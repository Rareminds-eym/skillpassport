import React from 'react';

// Trend Line Chart Component (using pure SVG)
interface TrendLineChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  showDots?: boolean;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  labels = [],
  color = '#3B82F6',
  height = 200,
  showDots = true
}) => {
  const [activePoint, setActivePoint] = React.useState<number | null>(null);
  const [clickedPoint, setClickedPoint] = React.useState<number | null>(null);
  
  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding.left + (index * chartWidth) / (data.length - 1);
    const y = padding.top + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y, value };
  });

  // Create smooth curved path
  const createSmoothPath = (points: Array<{ x: number; y: number; value: number }>) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlPointX = (current.x + next.x) / 2;
      
      path += ` Q ${controlPointX} ${current.y}, ${controlPointX} ${(current.y + next.y) / 2}`;
      path += ` Q ${controlPointX} ${next.y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };

  const pathD = createSmoothPath(points);

  // Area path for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
        {/* Gradient definitions */}
        <defs>
          {/* Area gradient */}
          <linearGradient id="modernAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          
          {/* Glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Shadow for dots */}
          <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background grid */}
        <g opacity="0.6">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + ratio * chartHeight;
            return (
              <line
                key={ratio}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}
        </g>

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + ratio * chartHeight;
          const value = Math.round(max - (ratio * range));
          return (
            <text
              key={`y-label-${idx}`}
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#9CA3AF"
              fontWeight="500"
            >
              {value}
            </text>
          );
        })}

        {/* Area fill with gradient */}
        <path d={areaD} fill="url(#modernAreaGradient)" />

        {/* Main line with glow effect */}
        <path 
          d={pathD} 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Data points with enhanced styling */}
        {showDots && points.map((p, i) => {
          const isActive = activePoint === i || clickedPoint === i;
          return (
            <g key={i} className="transition-all duration-200">
              {/* Outer glow ring */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={isActive ? "12" : "8"} 
                fill={color} 
                opacity={isActive ? "0.25" : "0.15"}
                className="transition-all duration-200"
              />
              
              {/* Interactive hit area */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="15" 
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActivePoint(i)}
                onMouseLeave={() => setActivePoint(null)}
                onClick={() => setClickedPoint(clickedPoint === i ? null : i)}
              />
              
              {/* Main dot */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={isActive ? "6" : "5"} 
                fill="white" 
                stroke={color} 
                strokeWidth={isActive ? "3" : "2.5"}
                filter="url(#dotShadow)"
                className="pointer-events-none transition-all duration-200"
              />
              
              {/* Inner dot */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={isActive ? "3" : "2.5"} 
                fill={color}
                className="pointer-events-none transition-all duration-200"
              />
              
              {/* Interactive tooltip */}
              {isActive && (
                <g className="animate-fadeIn">
                  {/* Tooltip background */}
                  <rect
                    x={p.x - 40}
                    y={p.y - 55}
                    width="80"
                    height="40"
                    rx="6"
                    fill="#1F2937"
                    opacity="0.95"
                    filter="url(#dotShadow)"
                  />
                  
                  {/* Label */}
                  {labels[i] && (
                    <text
                      x={p.x}
                      y={p.y - 38}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#9CA3AF"
                      fontWeight="500"
                    >
                      {labels[i]}
                    </text>
                  )}
                  
                  {/* Value */}
                  <text
                    x={p.x}
                    y={p.y - 23}
                    textAnchor="middle"
                    fontSize="14"
                    fill="white"
                    fontWeight="700"
                  >
                    {p.value}
                  </text>
                  
                  {/* Tooltip arrow */}
                  <path
                    d={`M ${p.x - 5} ${p.y - 15} L ${p.x} ${p.y - 10} L ${p.x + 5} ${p.y - 15}`}
                    fill="#1F2937"
                    opacity="0.95"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.length > 0 && labels.map((label, i) => (
          <text
            key={`x-label-${i}`}
            x={points[i].x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="11"
            fill="#6B7280"
            fontWeight="500"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// Area Chart Component (Filled)
interface AreaChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  labels = [],
  color = '#3B82F6',
  height = 200
}) => {
  const [activePoint, setActivePoint] = React.useState<number | null>(null);
  const [clickedPoint, setClickedPoint] = React.useState<number | null>(null);
  
  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding.left + (index * chartWidth) / (data.length - 1);
    const y = padding.top + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y, value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
        <defs>
          <linearGradient id="fullAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
          
          <filter id="areaShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        <g opacity="0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + ratio * chartHeight;
            return (
              <line
                key={ratio}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}
        </g>

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + ratio * chartHeight;
          const value = Math.round(max - (ratio * range));
          return (
            <text
              key={`y-${idx}`}
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#9CA3AF"
              fontWeight="500"
            >
              {value}
            </text>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#fullAreaGradient)" filter="url(#areaShadow)" />
        
        {/* Top border line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive data points */}
        {points.map((p, i) => {
          const isActive = activePoint === i || clickedPoint === i;
          return (
            <g key={`point-${i}`}>
              {/* Interactive hit area */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="12" 
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActivePoint(i)}
                onMouseLeave={() => setActivePoint(null)}
                onClick={() => setClickedPoint(clickedPoint === i ? null : i)}
              />
              
              {isActive && (
                <>
                  {/* Vertical indicator line */}
                  <line
                    x1={p.x}
                    y1={p.y}
                    x2={p.x}
                    y2={height - padding.bottom}
                    stroke={color}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                  
                  {/* Data point */}
                  <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" />
                  <circle cx={p.x} cy={p.y} r="2" fill={color} />
                  
                  {/* Tooltip */}
                  <g>
                    <rect
                      x={p.x - 40}
                      y={p.y - 55}
                      width="80"
                      height="40"
                      rx="6"
                      fill="#1F2937"
                      opacity="0.95"
                      filter="url(#areaShadow)"
                    />
                    {labels[i] && (
                      <text
                        x={p.x}
                        y={p.y - 38}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#9CA3AF"
                        fontWeight="500"
                      >
                        {labels[i]}
                      </text>
                    )}
                    <text
                      x={p.x}
                      y={p.y - 23}
                      textAnchor="middle"
                      fontSize="14"
                      fill="white"
                      fontWeight="700"
                    >
                      {p.value}
                    </text>
                    <path
                      d={`M ${p.x - 5} ${p.y - 15} L ${p.x} ${p.y - 10} L ${p.x + 5} ${p.y - 15}`}
                      fill="#1F2937"
                      opacity="0.95"
                    />
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.length > 0 && labels.map((label, i) => (
          <text
            key={`x-${i}`}
            x={points[i].x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="11"
            fill="#6B7280"
            fontWeight="500"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// Column/Bar Chart Component
interface ColumnChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}

export const ColumnChart: React.FC<ColumnChartProps> = ({
  data,
  labels = [],
  color = '#3B82F6',
  height = 200
}) => {
  const [activeBar, setActiveBar] = React.useState<number | null>(null);
  const [clickedBar, setClickedBar] = React.useState<number | null>(null);
  
  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 35, left: 40 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const max = Math.max(...data);
  const min = 0; // Bar charts typically start from 0
  const range = max - min || 1;
  
  const barWidth = chartWidth / (data.length * 1.5);
  const barSpacing = barWidth * 0.5;

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
        <defs>
          <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
          
          <filter id="barShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        <g opacity="0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + ratio * chartHeight;
            return (
              <line
                key={ratio}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}
        </g>

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + ratio * chartHeight;
          const value = Math.round(max - (ratio * range));
          return (
            <text
              key={`y-${idx}`}
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#9CA3AF"
              fontWeight="500"
            >
              {value}
            </text>
          );
        })}

        {/* Bars */}
        {data.map((value, index) => {
          const x = padding.left + (index * (barWidth + barSpacing)) + barSpacing;
          const barHeight = ((value - min) / range) * chartHeight;
          const y = padding.top + chartHeight - barHeight;
          const isActive = activeBar === index || clickedBar === index;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                filter="url(#barShadow)"
                rx="4"
                ry="4"
                opacity={isActive ? 1 : 0.85}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveBar(index)}
                onMouseLeave={() => setActiveBar(null)}
                onClick={() => setClickedBar(clickedBar === index ? null : index)}
              />
              
              {/* Value on top of bar */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
                fontWeight="600"
                className="pointer-events-none"
              >
                {value}
              </text>
              
              {/* Interactive tooltip */}
              {isActive && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 40}
                    y={y - 60}
                    width="80"
                    height="40"
                    rx="6"
                    fill="#1F2937"
                    opacity="0.95"
                    filter="url(#barShadow)"
                  />
                  {labels[index] && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 43}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#9CA3AF"
                      fontWeight="500"
                    >
                      {labels[index]}
                    </text>
                  )}
                  <text
                    x={x + barWidth / 2}
                    y={y - 28}
                    textAnchor="middle"
                    fontSize="14"
                    fill="white"
                    fontWeight="700"
                  >
                    {value}
                  </text>
                  <path
                    d={`M ${x + barWidth / 2 - 5} ${y - 20} L ${x + barWidth / 2} ${y - 15} L ${x + barWidth / 2 + 5} ${y - 20}`}
                    fill="#1F2937"
                    opacity="0.95"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.length > 0 && labels.map((label, i) => {
          const x = padding.left + (i * (barWidth + barSpacing)) + barSpacing + barWidth / 2;
          return (
            <text
              key={`x-${i}`}
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize="11"
              fill="#6B7280"
              fontWeight="500"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// Mini Sparkline Component
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#3B82F6',
  width = 100,
  height = 30
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index * width) / (data.length - 1);
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

// Bar Chart Component
interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  showValues?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 300,
  showValues = true
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.value));
  const barWidth = `${90 / data.length}%`;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-around h-full gap-2 px-4">
        {data.map((item, index) => {
          const barHeight = (item.value / max) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '85%' }}>
                {showValues && (
                  <span className="text-xs font-semibold text-gray-700 mb-1">
                    {item.value}
                  </span>
                )}
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    item.color || 'bg-blue-500'
                  }`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 text-center line-clamp-2">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Donut Chart Component
interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  centerText?: string;
  centerSubtext?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  centerText,
  centerSubtext
}) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90; // Start from top

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />

        {/* Data segments */}
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const dashArray = (percentage / 100) * circumference;
          const dashOffset = -((currentAngle + 90) / 360) * circumference;

          currentAngle += (percentage / 100) * 360;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference - dashArray}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Center text */}
      {(centerText || centerSubtext) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerText && (
            <div className="text-2xl font-bold text-gray-900">{centerText}</div>
          )}
          {centerSubtext && (
            <div className="text-xs text-gray-600 mt-1">{centerSubtext}</div>
          )}
        </div>
      )}
    </div>
  );
};

// Progress Ring Component
interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  label
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
        {label && <div className="text-xs text-gray-600 mt-1">{label}</div>}
      </div>
    </div>
  );
};

// Heatmap Component (simplified)
interface HeatmapProps {
  data: Array<Array<{ value: number; label?: string }>>;
  colorScale?: string[];
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  colorScale = ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB']
}) => {
  if (!data || data.length === 0) return null;

  const allValues = data.flat().map(d => d.value);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);

  const getColor = (value: number) => {
    const normalized = (value - min) / (max - min);
    const index = Math.floor(normalized * (colorScale.length - 1));
    return colorScale[index];
  };

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data[0].length}, minmax(0, 1fr))` }}>
      {data.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="aspect-square rounded flex items-center justify-center text-xs font-medium text-gray-700"
            style={{ backgroundColor: getColor(cell.value) }}
            title={cell.label || `Value: ${cell.value}`}
          >
            {cell.value}
          </div>
        ))
      )}
    </div>
  );
};
