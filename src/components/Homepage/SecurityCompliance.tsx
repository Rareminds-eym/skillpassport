import { WarpBackground } from "./ui/warp-background/warp-background";

const SecurityCompliance = () => {
  return (
    <section className="relative w-full bg-white py-12 md:py-16 px-2 sm:px-4">
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
          <div className="w-full py-8 px-4 sm:py-10 sm:px-6 md:py-16 md:px-12 text-center bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-gray-200 flex flex-col items-center justify-center">
            <h2 className="font-bold text-black mb-6 text-2xl sm:text-3xl md:text-4xl">
              Security & Compliance
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed text-sm sm:text-base md:text-lg">
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
