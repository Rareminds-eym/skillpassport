import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { HTMLAttributes, useCallback, useMemo } from "react";
import { Shield, Lock, Key, FileCheck, ShieldCheck, Database, UserCheck, Fingerprint } from "lucide-react";

interface SecurityIconBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  perspective?: number;
  iconsPerSide?: number;
  iconSize?: number;
  iconDelayMax?: number;
  iconDelayMin?: number;
  iconDuration?: number;
  gridColor?: string;
}

const securityIcons = [Shield, Lock, Key, FileCheck, ShieldCheck, Database, UserCheck, Fingerprint];

const IconBeam = ({
  x,
  delay,
  duration,
}: {
  x: string | number;
  delay: number;
  duration: number;
}) => {
  const Icon = securityIcons[Math.floor(Math.random() * securityIcons.length)];

  return (
    <motion.div
      style={{
        left: `${x}`,
        position: "absolute",
        top: 0,
      }}
      className="flex items-center justify-center"
      initial={{ y: "100cqmax", x: "-50%" }}
      animate={{ 
        y: "-100%", 
        x: "-50%"
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <Icon size={40} className="text-gray-600 drop-shadow-lg" strokeWidth={2} />
    </motion.div>
  );
};

export const SecurityIconBackground: React.FC<SecurityIconBackgroundProps> = ({
  children,
  perspective = 100,
  className,
  iconsPerSide = 3,
  iconSize = 5,
  iconDelayMax = 3,
  iconDelayMin = 0,
  iconDuration = 5,
  gridColor = "hsl(var(--border))",
  ...props
}) => {
  const generateIconPositions = useCallback(() => {
    const positions = [];
    const cellsPerSide = Math.floor(100 / iconSize);
    const step = cellsPerSide / iconsPerSide;

    for (let i = 0; i < iconsPerSide; i++) {
      const x = Math.floor(i * step);
      const delay =
        Math.random() * (iconDelayMax - iconDelayMin) + iconDelayMin;
      positions.push({ x, delay });
    }
    return positions;
  }, [iconsPerSide, iconSize, iconDelayMax, iconDelayMin]);

  const topIcons = useMemo(() => generateIconPositions(), [generateIconPositions]);
  const rightIcons = useMemo(() => generateIconPositions(), [generateIconPositions]);
  const bottomIcons = useMemo(() => generateIconPositions(), [generateIconPositions]);
  const leftIcons = useMemo(() => generateIconPositions(), [generateIconPositions]);

  return (
    <div className={cn("relative rounded border p-20", className)} {...props}>
      <div
        style={
          {
            "--perspective": `${perspective}px`,
            "--grid-color": gridColor,
            "--icon-size": `${iconSize}%`,
          } as React.CSSProperties
        }
        className={
          "pointer-events-none absolute left-0 top-0 size-full overflow-hidden [clip-path:inset(0)] [container-type:size] [perspective:var(--perspective)] [transform-style:preserve-3d]"
        }
      >
        {/* top side */}
        <div className="absolute [transform-style:preserve-3d] [background-size:var(--icon-size)_var(--icon-size)] [background:linear-gradient(var(--grid-color)_0_1px,_transparent_1px_var(--icon-size))_50%_-0.5px_/var(--icon-size)_var(--icon-size),linear-gradient(90deg,_var(--grid-color)_0_1px,_transparent_1px_var(--icon-size))_50%_50%_/var(--icon-size)_var(--icon-size)] [container-type:inline-size] [height:100cqmax] [transform-origin:50%_0%] [transform:rotateX(-90deg)] [width:100cqi]">
          {topIcons.map((icon, index) => (
            <IconBeam
              key={`top-${index}`}
              x={`${icon.x * iconSize}%`}
              delay={icon.delay}
              duration={iconDuration}
            />
          ))}
        </div>
        {/* bottom side */}
        <div className="absolute top-full [transform-style:preserve-3d] [background-size:var(--icon-size)_var(--icon-size)] [background:linear-gradient(var(--grid-color)_0_1px,_transparent_1px_var(--icon-size))_50%_-0.5px_/var(--icon-size)_var(--icon-size),linear-gradient(90deg,_var(--grid-color)_0_1px,_transparent_1px_var(--icon-size))_50%_50%_/var(--icon-size)_var(--icon-size)] [container-type:inline-size] [height:100cqmax] [transform-origin:50%_0%] [transform:rotateX(-90deg)] [width:100cqi]">
          {bottomIcons.map((icon, index) => (
            <IconBeam
              key={`bottom-${index}`}
              x={`${icon.x * iconSize}%`}
              delay={icon.delay}
              duration={iconDuration}
            />
          ))}
        </div>
        {/* left side */}
        <div className="absolute left-0 top-0 [transform-style:preserve-3d] [background-size:var(--icon-size)_var(--icon-size)] [background:linear-gradient(var(--grid-color)_0_1px,_transparent_1px_var(--icon-size))_50%_-0.5px_/var(--icon-size)_var(--icon-size),linear-gradient(90deg,_var(--grid-color)_0_1px,_transparent_1px_var(--icon-size))_50%_50%_/var(--icon-size)_var(--icon-size)] [container-type:inline-size] [height:100cqmax] [transform-origin:0%_0%] [transform:rotate(90deg)_rotateX(-90deg)] [width:100cqh]">
          {leftIcons.map((icon, index) => (
            <IconBeam
              key={`left-${index}`}
              x={`${icon.x * iconSize}%`}
              delay={icon.delay}
              duration={iconDuration}
            />
          ))}
        </div>
        {/* right side */}
        <div className="absolute right-0 top-0 [transform-style:preserve-3d] [background-size:var(--icon-size)_var(--icon-size)] [background:linear-gradient(var(--grid-color)_0_1px,_transparent_1px_var(--icon-size))_50%_-0.5px_/var(--icon-size)_var(--icon-size),linear-gradient(90deg,_var(--grid-color)_0_1px,_transparent_1px_var(--icon-size))_50%_50%_/var(--icon-size)_var(--icon-size)] [container-type:inline-size] [height:100cqmax] [width:100cqh] [transform-origin:100%_0%] [transform:rotate(-90deg)_rotateX(-90deg)]">
          {rightIcons.map((icon, index) => (
            <IconBeam
              key={`right-${index}`}
              x={`${icon.x * iconSize}%`}
              delay={icon.delay}
              duration={iconDuration}
            />
          ))}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
};
