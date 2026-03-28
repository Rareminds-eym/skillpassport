import { SecurityIconBackground } from "./ui/warp-background/security-icon-background";
import { ShieldCheck, Lock } from 'lucide-react';

const SecurityCompliance = () => {
  return (
    <section className="relative w-full bg-white py-12 md:py-16 px-2 sm:px-4">
      <div className="container mx-auto max-w-5xl">
        <SecurityIconBackground 
          className="bg-white/80 backdrop-blur-sm"
          perspective={350}
          iconsPerSide={6}
          iconSize={5}
          iconDelayMax={3}
          iconDelayMin={0}
          iconDuration={8}
          gridColor="hsl(0, 0%, 85%)"
        >

          <div className="w-full py-8 px-4 sm:py-10 sm:px-6 md:py-16 md:px-12 text-center bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-gray-200 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-6">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-black animate-pulse" />
              <h2 className="font-bold text-black text-2xl sm:text-3xl md:text-4xl">
                Security & Compliance
              </h2>
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-black animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed text-sm sm:text-base md:text-lg">
              Enterprise-Grade Data Security, Role-Based Access, And Tamper-Proof 
              Records Ensure Trust And Integrity At Scale.
            </p>
          </div>
        </SecurityIconBackground>
      </div>
    </section>
  );
};

export default SecurityCompliance;
