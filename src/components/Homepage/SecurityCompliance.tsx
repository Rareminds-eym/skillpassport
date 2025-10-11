import { WarpBackground } from "./ui/warp-background/warp-background";

const SecurityCompliance = () => {
  return (
    <section className="relative w-full bg-white py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <WarpBackground 
          className="bg-white/80 backdrop-blur-sm"
          perspective={350}
          beamsPerSide={4}
          beamSize={3}
          beamDelayMax={4}
          beamDelayMin={0}
          beamDuration={4}
          gridColor="hsl(0, 0%, 85%)"
        >
          <div className="py-12 px-8 md:py-16 md:px-12 text-center bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-gray-200 flex flex-col items-center justify-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">
              Security & Compliance
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade data security, role-based access, and tamper-proof 
              records ensure trust and integrity at scale.
            </p>
          </div>
        </WarpBackground>
      </div>
    </section>
  );
};

export default SecurityCompliance;
