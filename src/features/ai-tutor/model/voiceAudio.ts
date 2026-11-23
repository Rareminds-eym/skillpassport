export type AudioTone = readonly [number,number,number];
/** Frequency-band energy describes sound texture, not emotion or exact pitch. */
export function audioTone(data:Uint8Array,sampleRate:number,fftSize:number):AudioTone {
  const band=(low:number,high:number)=>{
    const start=Math.max(1,Math.ceil(low*fftSize/sampleRate));
    const end=Math.min(data.length,Math.ceil(high*fftSize/sampleRate));
    let sum=0;for(let index=start;index<end;index++)sum+=data[index];
    return end>start?Math.min(1,sum/(end-start)/180):0;
  };
  return [band(80,400),band(400,2000),band(2000,6500)];
}

/** Browser audio lifecycle shared by listening, VAD and playback animation. */
export class VoiceAudio {
  private context: AudioContext;
  private generation = 0;
  private cleanup: (() => void) | undefined;
  private finishCapture: (() => void) | undefined;
  constructor() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined' || typeof AudioContext === 'undefined') throw new Error('Voice is not supported in this browser. Please continue in text chat.');
    this.context = new AudioContext();
  }
  resume() { return this.context.resume(); }
  stop() { this.generation++;this.finishCapture=undefined; const cleanup=this.cleanup;this.cleanup=undefined;cleanup?.(); }
  finish() { this.finishCapture?.(); }
  close() { this.stop(); void this.context.close().catch(()=>{}); }
  async listen(onQuestion:(_audio:Blob)=>void,onLevel:(_level:number)=>void,onError:(_message:string)=>void,onTone?:(_tone:AudioTone)=>void) {
    this.stop();const generation=this.generation;
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    if (generation!==this.generation) { stream.getTracks().forEach(track=>track.stop());return; }
    try {
      const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type));
      const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
      const source=this.context.createMediaStreamSource(stream);const analyser=this.context.createAnalyser();analyser.fftSize=512;source.connect(analyser);
      const frequencies=new Uint8Array(analyser.frequencyBinCount);
      const samples=new Uint8Array(analyser.fftSize);const chunks:Blob[]=[];
      let spoken=0;let lastVoice=performance.now();const started=lastVoice;
      const dispose=()=>{clearInterval(timer);recorder.onstop=null;recorder.ondataavailable=null;recorder.onerror=null;if(recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(track=>track.stop());source.disconnect();analyser.disconnect();onLevel(0);onTone?.([0,0,0]);};
      this.cleanup=dispose;
      this.finishCapture=()=>{if(recorder.state==='recording')recorder.stop();};
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onerror=()=>{this.stop();onError('Microphone recording stopped. Please try again.');};
      recorder.onstop=()=>{
        const blob=new Blob(chunks,{type:recorder.mimeType});this.cleanup=undefined;this.finishCapture=undefined;dispose();
        if(generation!==this.generation)return;
        if(spoken>=250 && blob.size)onQuestion(blob);else onError('No clear speech was heard. Start listening and try again.');
      };
      const timer=setInterval(()=>{
        analyser.getByteTimeDomainData(samples);
        const rms=Math.sqrt(samples.reduce((sum,value)=>sum+((value-128)/128)**2,0)/samples.length);
        onLevel(Math.min(1,rms*8));
        if(onTone){analyser.getByteFrequencyData(frequencies);onTone(audioTone(frequencies,this.context.sampleRate,analyser.fftSize));}
        const now=performance.now();
        if(rms>0.018){spoken+=50;lastVoice=now;}
        if((spoken>=250&&now-lastVoice>1100)||now-started>60000||(!spoken&&now-started>15000)) {clearInterval(timer);if(recorder.state==='recording')recorder.stop();}
      },50);
      recorder.start(250);
    } catch(error) { stream.getTracks().forEach(track=>track.stop());this.stop();throw error; }
  }
  async play(bytes:ArrayBuffer,onLevel:(_level:number)=>void,signal:AbortSignal,onTone?:(_tone:AudioTone)=>void) {
    this.stop();const generation=this.generation;
    const buffer=await this.context.decodeAudioData(bytes);
    if(signal.aborted||generation!==this.generation)throw new DOMException('Cancelled','AbortError');
    await this.context.resume();
    return new Promise<void>((resolve,reject)=>{
      const source=this.context.createBufferSource();const analyser=this.context.createAnalyser();analyser.fftSize=512;source.buffer=buffer;source.connect(analyser);analyser.connect(this.context.destination);
      const samples=new Uint8Array(analyser.frequencyBinCount);
      const timer=setInterval(()=>{analyser.getByteFrequencyData(samples);onLevel(Math.min(1,samples.reduce((sum,value)=>sum+value,0)/samples.length/70));onTone?.(audioTone(samples,this.context.sampleRate,analyser.fftSize));},50);
      const dispose=()=>{clearInterval(timer);signal.removeEventListener('abort',cancel);source.onended=null;try{source.stop();}catch{/* already stopped */}source.disconnect();analyser.disconnect();onLevel(0);onTone?.([0,0,0]);};
      const cancel=()=>{this.cleanup=undefined;dispose();reject(new DOMException('Cancelled','AbortError'));};
      this.cleanup=cancel;source.onended=()=>{this.cleanup=undefined;dispose();resolve();};signal.addEventListener('abort',cancel,{once:true});
      if(signal.aborted){cancel();return;}source.start();
    });
  }
}
