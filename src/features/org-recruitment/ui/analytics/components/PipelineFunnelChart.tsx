/**
 * Pipeline Funnel Chart Component
 * Visual funnel representation using Recharts
 */

import { FunnelChart, Funnel, Cell, LabelList, ResponsiveContainer, Tooltip } from 'recharts';
import type { PipelineStageData } from '../types';

interface PipelineFunnelChartProps {
  data: PipelineStageData[];
}

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#10B981', '#34D399', '#6EE7B7'];

export function PipelineFunnelChart({ data }: PipelineFunnelChartProps) {
  // Transform data for funnel chart
  const funnelData = data.map((stage, index) => ({
    name: stage.stage,
    value: stage.count,
    fill: COLORS[index] || '#94A3B8',
  }));

  if (funnelData.length === 0 || funnelData.every((d) => d.value === 0)) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-sm">No pipeline data available</p>
          <p className="text-xs text-gray-400 mt-1">Add candidates to see the funnel</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <FunnelChart>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              const stageData = data.payload;
              return (
                <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{data.value}</p>
                  {stageData.conversion !== undefined && (
                    <p className="text-xs text-gray-600">
                      {stageData.conversion}% of total sourced
                    </p>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        <Funnel
          dataKey="value"
          data={funnelData}
          isAnimationActive
        >
          <LabelList
            position="right"
            fill="#000"
            stroke="none"
            dataKey="name"
            style={{ fontSize: '14px', fontWeight: 500 }}
          />
          <LabelList
            position="inside"
            fill="#fff"
            stroke="none"
            dataKey="value"
            style={{ fontSize: '16px', fontWeight: 'bold' }}
          />
          {funnelData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
