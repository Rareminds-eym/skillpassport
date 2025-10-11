"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
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

  // Layout constants for node and label alignment
  const NODE_SIZE = 64; // px (w-16 h-16)
  const LABEL_WIDTH = 220; // px
  const GAP = 32; // px between node edge and label

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
    const radius = 240; // Increased from 200 for better spacing
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
          <div className={`absolute w-32 h-32 rounded-full flex items-center justify-center z-10 ${
            theme === "light" ? "bg-white border-[2px] border-black/20" : "bg-black border-[2px] border-white/20"
          }`}>
            <img
              src="/assets/HomePage/RMLogo.webp"
              alt="RM Logo"
              className="w-20 h-20 object-contain"
            />
          </div>

          <div className={`absolute w-[480px] h-[480px] rounded-full border ${
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
                  w-16 h-16 rounded-full flex items-center justify-center relative
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
                  border-[3px]
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
                  ${isExpanded ? "scale-150" : ""}
                `}
                >
                  <span className="text-2xl font-bold">{item.id}</span>
                </div>

                <div
                  className={`
                  whitespace-normal break-words leading-tight
                  text-base md:text-lg font-semibold
                  transition-all duration-300
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
                  <Card className={`absolute top-24 left-1/2 -translate-x-1/2 w-64 backdrop-blur-lg shadow-xl overflow-visible ${
                    theme === "light"
                      ? "bg-white/90 border-black/30 shadow-black/10"
                      : "bg-black/90 border-white/30 shadow-white/10"
                  }`}>
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 ${
                      theme === "light" ? "bg-black/50" : "bg-white/50"
                    }`}></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 text-xs ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status === "completed"
                            ? "COMPLETE"
                            : item.status === "in-progress"
                            ? "IN PROGRESS"
                            : "PENDING"}
                        </Badge>
                        <span className={`text-xs font-mono ${
                          theme === "light" ? "text-black/50" : "text-white/50"
                        }`}>
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className={`text-xs ${
                      theme === "light" ? "text-black/80" : "text-white/80"
                    }`}>
                      <p>{item.content}</p>

                      <div className={`mt-4 pt-3 border-t ${
                        theme === "light" ? "border-black/10" : "border-white/10"
                      }`}>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <Zap size={10} className="mr-1" />
                            Energy Level
                          </span>
                          <span className="font-mono">{item.energy}%</span>
                        </div>
                        <div className={`w-full h-1 rounded-full overflow-hidden ${
                          theme === "light" ? "bg-black/10" : "bg-white/10"
                        }`}>
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className={`mt-4 pt-3 border-t ${
                          theme === "light" ? "border-black/10" : "border-white/10"
                        }`}>
                          <div className="flex items-center mb-2">
                            <Link size={10} className={theme === "light" ? "text-black/70 mr-1" : "text-white/70 mr-1"} />
                            <h4 className={`text-xs uppercase tracking-wider font-medium ${
                              theme === "light" ? "text-black/70" : "text-white/70"
                            }`}>
                              Connected Nodes
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className={`flex items-center h-6 px-2 py-0 text-xs rounded-none bg-transparent transition-all ${
                                    theme === "light"
                                      ? "border-black/20 hover:bg-black/10 text-black/80 hover:text-black"
                                      : "border-white/20 hover:bg-white/10 text-white/80 hover:text-white"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={8}
                                    className={`ml-1 ${
                                      theme === "light" ? "text-black/60" : "text-white/60"
                                    }`}
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
