"use client";
import { useState, useEffect, useRef } from "react";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  theme?: "dark" | "light";
}

export default function RadialOrbitalTimeline({
  timelineData,
  theme = "dark",
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [viewMode, setViewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Layout constants for node and label alignment - responsive based on screen size
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const NODE_SIZE = isMobile ? 48 : 64; // Smaller on mobile
  const LABEL_WIDTH = isMobile ? 120 : 220; // Narrower labels on mobile
  const GAP = isMobile ? 16 : 32; // Reduced gap on mobile

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = isMobile ? 140 : 240; // Smaller orbit radius on mobile
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    if (theme === "light") {
      switch (status) {
        case "completed":
          return "text-white bg-black border-black";
        case "in-progress":
          return "text-white bg-black/70 border-black";
        case "pending":
          return "text-black bg-white/40 border-black/50";
        default:
          return "text-black bg-white/40 border-black/50";
      }
    }
    switch (status) {
      case "completed":
        return "text-white bg-black border-white";
      case "in-progress":
        return "text-black bg-white border-black";
      case "pending":
        return "text-white bg-black/40 border-white/50";
      default:
        return "text-white bg-black/40 border-white/50";
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center overflow-hidden ${
        theme === "light" ? "bg-white" : "bg-black"
      }`}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          <div className={`absolute rounded-full flex items-center justify-center z-10 ${
            isMobile ? "w-20 h-20" : "w-32 h-32"
          } ${
            theme === "light" ? "bg-white border-[2px] border-black/20" : "bg-black border-[2px] border-white/20"
          }`}>
            <img
              src="/assets/HomePage/RMLogo.webp"
              alt="RM Logo"
              className={isMobile ? "w-12 h-12" : "w-20 h-20"}
              style={{ objectFit: "contain" }}
            />
          </div>

          <div className={`absolute rounded-full border ${
            isMobile ? "w-[280px] h-[280px]" : "w-[480px] h-[480px]"
          } ${
            theme === "light" ? "border-black/30" : "border-white/10"
          }`}></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            // Determine label placement based on polar angle
            const ang = ((position.angle % 360) + 360) % 360;
            let labelStyle: React.CSSProperties = {};
            const labelOffset = NODE_SIZE / 2 + GAP;
            
            // Position labels based on quadrant
            if (ang >= 315 || ang < 45) {
              // Right side (0°)
              labelStyle = {
                position: "absolute" as const,
                left: `${labelOffset}px`,
                top: "50%",
                transform: "translateY(-50%)",
                width: `${LABEL_WIDTH}px`,
                textAlign: "left",
              };
            } else if (ang >= 45 && ang < 135) {
              // Top side (90°)
              labelStyle = {
                position: "absolute" as const,
                left: "50%",
                bottom: `${labelOffset}px`,
                transform: "translateX(-50%)",
                width: `${LABEL_WIDTH}px`,
                textAlign: "center",
              };
            } else if (ang >= 135 && ang < 225) {
              // Left side (180°)
              labelStyle = {
                position: "absolute" as const,
                right: `${labelOffset}px`,
                top: "50%",
                transform: "translateY(-50%)",
                width: `${LABEL_WIDTH}px`,
                textAlign: "right",
              };
            } else {
              // Bottom side (270°) - 225-315
              labelStyle = {
                position: "absolute" as const,
                left: "50%",
                top: `${labelOffset}px`,
                transform: "translateX(-50%)",
                width: `${LABEL_WIDTH}px`,
                textAlign: "center",
              };
            }

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: theme === "light" 
                      ? `radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 70%)`
                      : `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
                    width: `${item.energy * 0.6 + 60}px`,
                    height: `${item.energy * 0.6 + 60}px`,
                    left: `-${(item.energy * 0.6 + 60 - 64) / 2}px`,
                    top: `-${(item.energy * 0.6 + 60 - 64) / 2}px`,
                  }}
                ></div>

                <div
                  className={`
                  rounded-full flex items-center justify-center relative
                  ${isMobile ? "w-12 h-12" : "w-16 h-16"}
                  ${
                    theme === "light"
                      ? isExpanded
                        ? "bg-black text-white"
                        : isRelated
                        ? "bg-black/50 text-white"
                        : "bg-black text-white"
                      : isExpanded
                      ? "bg-white text-black"
                      : isRelated
                      ? "bg-white/50 text-black"
                      : "bg-black text-white"
                  }
                  ${isMobile ? "border-[2px]" : "border-[3px]"}
                  ${
                    theme === "light"
                      ? isExpanded
                        ? "border-black shadow-lg shadow-black/30"
                        : isRelated
                        ? "border-black animate-pulse"
                        : "border-black"
                      : isExpanded
                      ? "border-white shadow-lg shadow-white/30"
                      : isRelated
                      ? "border-white animate-pulse"
                      : "border-white"
                  }
                  transition-all duration-300 transform
                  ${isExpanded ? (isMobile ? "scale-125" : "scale-150") : ""}
                `}
                >
                  <span className={isMobile ? "text-lg font-bold" : "text-2xl font-bold"}>{item.id}</span>
                </div>

                <div
                  className={`
                  whitespace-normal break-words leading-tight
                  font-semibold
                  transition-all duration-300
                  ${isMobile ? "text-xs" : "text-base md:text-lg"}
                  ${
                    theme === "light"
                      ? isExpanded ? "text-black scale-105" : "text-black/80"
                      : isExpanded ? "text-white scale-105" : "text-white/80"
                  }
                `}
                  style={labelStyle}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className={`absolute left-1/2 -translate-x-1/2 backdrop-blur-lg shadow-xl overflow-visible ${
                    isMobile ? "top-16 w-[85vw] max-w-[280px]" : "top-24 w-64"
                  } ${
                    theme === "light"
                      ? "bg-white/90 border-black/30 shadow-black/10"
                      : "bg-black/90 border-white/30 shadow-white/10"
                  }`}>
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 ${
                      theme === "light" ? "bg-black/50" : "bg-white/50"
                    }`}></div>
                    <CardHeader className={isMobile ? "pb-2 px-3 pt-3" : "pb-2"}>
                      <div className="flex justify-between items-center gap-2">
                        <Badge
                          className={`px-2 text-xs flex-shrink-0 ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status === "completed"
                            ? "COMPLETE"
                            : item.status === "in-progress"
                            ? "IN PROGRESS"
                            : "PENDING"}
                        </Badge>
                        <span className={`text-xs font-mono flex-shrink-0 ${
                          theme === "light" ? "text-black/50" : "text-white/50"
                        }`}>
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className={isMobile ? "text-xs mt-2" : "text-sm mt-2"}>
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className={`${
                      isMobile ? "text-[11px] px-3 pb-3" : "text-xs"
                    } ${
                      theme === "light" ? "text-black/80" : "text-white/80"
                    }`}>
                      <p className="leading-relaxed">{item.content}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
