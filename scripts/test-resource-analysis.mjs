// Opt-in paid smoke test. Only synthetic fixtures are sent; never real course data.
import fs from 'node:fs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { zipSync, strToU8 } from 'fflate';
import { analyzeResource, RESOURCE_ANALYSIS_MODEL } from '../functions/api/ai-tutor/utils/resource-analysis.ts';

if (!process.argv.includes('--live')) throw new Error('Pass --live to authorize the synthetic OpenRouter smoke test.');
const root = new URL('../', import.meta.url);
const vars = fs.existsSync(new URL('.dev.vars', root)) ? fs.readFileSync(new URL('.dev.vars', root), 'utf8') : '';
const key = (process.env.OPENROUTER_API_KEY || vars.match(/^OPENROUTER_API_KEY\s*=\s*(.+)$/m)?.[1]?.trim() || '').replace(/^(['"])(.*)\1$/, '$2');
if (!key) throw new Error('OPENROUTER_API_KEY is not configured.');
const fixtures = new Map();
const pdf = await PDFDocument.create();
const page = pdf.addPage();
const font = await pdf.embedFont(StandardFonts.Helvetica);
page.drawText('Harbor Method: prepare, compare, decide. Review after 17 minutes.', { x: 30, y: 700, size: 14, font });
fixtures.set('pdf', { bytes: await pdf.save(), terms: ['Harbor', 'prepare', 'compare', 'decide', '17'] });
fixtures.set('pptx', { bytes: zipSync({
  'ppt/slides/slide1.xml': strToU8('<a:t>Willow Method: collect, classify, conclude.</a:t>'),
  'ppt/notesSlides/notesSlide1.xml': strToU8('<a:t>Speaker note: review after 19 minutes.</a:t>'),
}), terms: ['Willow', 'collect', 'classify', 'conclude', '19'] });
fixtures.set('docx', { bytes: zipSync({ 'word/document.xml': strToU8('<w:p><w:t>Cedar Framework</w:t></w:p><w:tbl><w:t>Measure temperature every 11 minutes.</w:t></w:tbl>') }), terms: ['Cedar', 'temperature', '11'] });

if (process.argv.includes('--video')) {
  const { default: puppeteer } = await import('puppeteer');
  const executablePath = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(path => fs.existsSync(path));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const tab = await browser.newPage();
    const data = await tab.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540;
      const ctx = canvas.getContext('2d');
      const draw = () => {
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 960, 540); ctx.fillStyle = 'black'; ctx.font = '36px Arial';
        ctx.fillText('VIDEO LESSON: ORCHID CYCLE', 40, 100);
        ctx.fillText('Observe -> Measure -> Reflect', 40, 220);
        ctx.fillText('Cycle duration: 23 seconds', 40, 340);
      };
      draw(); const stream = canvas.captureStream(5);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' }); const chunks = [];
      const done = new Promise(resolve => {
        recorder.ondataavailable = event => chunks.push(event.data);
        recorder.onstop = async () => {
          const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
          let text = ''; for (const byte of bytes) text += String.fromCharCode(byte);
          resolve(btoa(text)); stream.getTracks().forEach(track => track.stop());
        };
      });
      recorder.start(); const timer = setInterval(draw, 200);
      await new Promise(resolve => setTimeout(resolve, 2200)); recorder.stop(); clearInterval(timer);
      return done;
    });
    fixtures.set('webm', { bytes: new Uint8Array(Buffer.from(data, 'base64')), terms: ['Orchid', 'Observe', 'Measure', 'Reflect', '23'] });
  } finally { await browser.close(); }
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(String(input));
  if (url.hostname === 'fixture.example.test') return new Response(fixtures.get(url.pathname.split('.').at(-1)).bytes);
  return originalFetch(input, options);
};
try {
  for (const [format, fixture] of fixtures) {
    const result = await analyzeResource({ resourceId: format, name: `Synthetic lesson.${format}`, type: format, url: `https://fixture.example.test/lesson.${format}`, content: null }, { OPENROUTER_API_KEY: key, CLOUDFLARE_R2_PUBLIC_URL: 'https://fixture.example.test' });
    const missing = fixture.terms.filter(term => !result.text.toLowerCase().includes(term.toLowerCase()));
    console.log(JSON.stringify({ model: RESOURCE_ANALYSIS_MODEL, format, passed: missing.length === 0, missing }));
    if (missing.length) process.exitCode = 1;
  }
} finally { globalThis.fetch = originalFetch; }
