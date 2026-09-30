import { useState, type FC } from 'react';
import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

interface SkillItem {
  label: string;
  status: string;
  percentage?: number;
  score_out_of_5?: number;
}

interface Props {
  selfSocial?: {
    self_eq?: SkillItem[];
    social_sq?: SkillItem[];
  };
  isActive?: boolean;
  sectionIntro?: SectionIntro;
}

type SkillCategory = 'self' | 'eq' | 'social';

interface RadarSkill {
  title: string;
  level: number | null;
  category: SkillCategory;
  stage: string;
}

const CATEGORY_CONFIG: Record<SkillCategory, { label: string; color: string; bg: string; text: string }> = {
  self: { label: 'Self', color: '#3b82f6', bg: 'bg-blue-500', text: '#3b82f6' },
  eq: { label: 'EQ', color: '#f59e0b', bg: 'bg-amber-500', text: '#f59e0b' },
  social: { label: 'Social', color: '#10b981', bg: 'bg-emerald-500', text: '#10b981' },
};

const CATEGORY_ORDER: SkillCategory[] = ['self', 'eq', 'social'];

const STAGE_COLORS: Record<string, string> = {
  STRONG: '#10b981',
  'READY FOR NEXT LEVEL': '#3b82f6',
  CONFIDENT: '#f59e0b',
  BUILDING: '#f43f5e',
  STARTING: '#64748b',
  PRACTICING: '#f59e0b',
  GROWING: '#10b981',
};

const EQ_KEYWORDS = [
  'active listening',
  'empathy',
  'emotion',
  'feeling',
  'kind',
  'listening',
  'patience',
  'regulation',
];

function levelFor(item: SkillItem): number | null {
  if (typeof item.percentage === 'number' && Number.isFinite(item.percentage)) {
    return Math.max(0, Math.min(100, Math.round(item.percentage)));
  }
  if (typeof item.score_out_of_5 === 'number' && Number.isFinite(item.score_out_of_5)) {
    return Math.max(0, Math.min(100, Math.round((item.score_out_of_5 / 5) * 100)));
  }
  return null;
}

function presentationCategory(label: string): SkillCategory {
  const normalized = label.toLowerCase();
  if (EQ_KEYWORDS.some((keyword) => normalized.includes(keyword))) return 'eq';
  return 'self';
}

function truncateSkillLabel(label: string) {
  return label.length > 14 ? `${label.slice(0, 12)}...` : label;
}

export const SelfSocialStrengths: FC<Props> = ({ selfSocial, isActive, sectionIntro }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<SkillCategory | 'all'>('all');

  if (!selfSocial) return null;

  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;

  const skills: RadarSkill[] = [
    ...(selfSocial.self_eq ?? []).map((item) => ({
      title: item.label,
      level: levelFor(item),
      category: presentationCategory(item.label),
      stage: item.status.toUpperCase(),
    })),
    ...(selfSocial.social_sq ?? []).map((item) => ({
      title: item.label,
      level: levelFor(item),
      category: 'social' as const,
      stage: item.status.toUpperCase(),
    })),
  ];

  if (!skills.length) return null;

  const hasMeasuredLevels = skills.every((skill): skill is RadarSkill & { level: number } => skill.level !== null);

  if (!hasMeasuredLevels) {
    return (
      <div
        className={`bg-white rounded-2xl border border-gray-200 p-6 pb-8 shadow-sm sm:p-7 ${
          isActive ? 'ring-2 ring-blue-300' : ''
        }`}
      >
        {intro && (
          <>
            <h2 className="text-base font-bold text-gray-800 mb-1">{intro.heading}</h2>
            <p className="text-xs text-gray-500 mb-5">{intro.description}</p>
          </>
        )}
        <div className="space-y-2.5">
          {skills.map((skill, index) => (
            <div
              key={`${skill.title}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_CONFIG[skill.category].bg}`} />
                <span className="text-sm font-semibold text-gray-700">{skill.title}</span>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${STAGE_COLORS[skill.stage] ?? '#64748b'}15`,
                  color: STAGE_COLORS[skill.stage] ?? '#64748b',
                }}
              >
                {skill.stage}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const avgMastery = Math.round(skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length);
  const CX = 190;
  const CY = 190;
  const R = 108;
  const n = skills.length;
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pointFor = (i: number, r: number) => ({
    x: CX + Math.cos(angleFor(i)) * r,
    y: CY + Math.sin(angleFor(i)) * r,
  });

  const dataPoints = skills.map((skill, index) => pointFor(index, (skill.level / 100) * R));
  const dataPolygon = dataPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const gridRings = [0.25, 0.5, 0.75, 1].map((fraction) =>
    Array.from({ length: n }, (_, index) => {
      const point = pointFor(index, R * fraction);
      return `${point.x},${point.y}`;
    }).join(' ')
  );
  const categoryCounts = CATEGORY_ORDER.reduce<Record<SkillCategory, number>>((acc, category) => {
    acc[category] = skills.filter((skill) => skill.category === category).length;
    return acc;
  }, { self: 0, eq: 0, social: 0 });
  const isDim = (index: number) => hovered !== null && index !== hovered;
  const isCategoryFiltered = (category: SkillCategory) => activeFilter !== 'all' && activeFilter !== category;

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 p-6 pb-8 shadow-sm sm:p-7 ${
        isActive ? 'ring-2 ring-blue-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        {intro && <h2 className="text-base font-bold text-gray-800">{intro.heading}</h2>}
        <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {avgMastery}% Avg Mastery
        </span>
      </div>
      {intro ? (
        <p className="text-xs text-gray-500 mb-4">{intro.description}</p>
      ) : (
        <div className="mb-3" />
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
            activeFilter === 'all'
              ? 'bg-gray-800 text-white border-gray-800'
              : 'text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          All Skills {skills.length}
        </button>
        {CATEGORY_ORDER.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveFilter(category)}
            className={`text-xs rounded-full px-2.5 py-1 border transition-colors flex items-center gap-1.5 ${
              activeFilter === category ? 'text-white border-transparent' : 'text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
            style={activeFilter === category ? { backgroundColor: CATEGORY_CONFIG[category].color } : undefined}
          >
            <span className={`w-2 h-2 rounded-full ${CATEGORY_CONFIG[category].bg}`} />
            {CATEGORY_CONFIG[category].label} {categoryCounts[category]}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 380 380" className="h-auto w-full max-w-[360px] overflow-visible">
            {gridRings.map((points, index) => (
              <polygon
                key={index}
                points={points}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={1}
                opacity={1 - index * 0.15}
              />
            ))}

            {skills.map((_, index) => {
              const point = pointFor(index, R);
              return (
                <line
                  key={index}
                  x1={CX}
                  y1={CY}
                  x2={point.x}
                  y2={point.y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  opacity={isDim(index) ? 0.2 : 0.6}
                  style={{ transition: 'opacity 0.2s' }}
                />
              );
            })}

            <polygon points={dataPolygon} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth={1.5} />

            {skills.map((skill, index) => {
              const point = dataPoints[index];
              const category = CATEGORY_CONFIG[skill.category];
              const dim = isDim(index) || isCategoryFiltered(skill.category);
              return (
                <g key={`${skill.title}-${index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hovered === index ? 7 : 5}
                    fill={category.color}
                    stroke="white"
                    strokeWidth={2}
                    opacity={dim ? 0.2 : 1}
                    style={{ transition: 'r 0.15s, opacity 0.2s' }}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  <text
                    x={pointFor(index, R + 28).x}
                    y={pointFor(index, R + 28).y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8.5}
                    fontWeight={hovered === index ? 700 : 500}
                    fill={hovered === index ? category.color : '#6b7280'}
                    opacity={dim ? 0.3 : 1}
                    style={{ transition: 'opacity 0.2s' }}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {truncateSkillLabel(skill.title)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="w-full min-w-0 flex-1 lg:min-w-[190px]">
          {hovered !== null ? (
            <div
              className="rounded-xl border p-4 transition-all"
              style={{ borderColor: `${CATEGORY_CONFIG[skills[hovered].category].color}40` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_CONFIG[skills[hovered].category].color }}
                />
                <span className="text-sm font-bold text-gray-800">{skills[hovered].title}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs font-semibold" style={{ color: CATEGORY_CONFIG[skills[hovered].category].text }}>
                  {CATEGORY_CONFIG[skills[hovered].category].label}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${skills[hovered].level}%`,
                      backgroundColor: CATEGORY_CONFIG[skills[hovered].category].color,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700">{skills[hovered].level}%</span>
              </div>
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                style={{
                  backgroundColor: `${STAGE_COLORS[skills[hovered].stage] ?? '#64748b'}15`,
                  color: STAGE_COLORS[skills[hovered].stage] ?? '#64748b',
                }}
              >
                {skills[hovered].stage}
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 h-full flex flex-col justify-center">
              <p className="text-xs text-gray-400 mb-3">Hover any point on the radar to see skill details.</p>
              <div className="space-y-2">
                {CATEGORY_ORDER.map((category) => {
                  const categorySkills = skills.filter((skill) => skill.category === category);
                  const categoryAvg = categorySkills.length
                    ? Math.round(categorySkills.reduce((sum, skill) => sum + skill.level, 0) / categorySkills.length)
                    : 0;
                  return (
                    <div key={category} className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_CONFIG[category].bg}`} />
                      <span className="text-xs font-semibold text-gray-700 w-12">{CATEGORY_CONFIG[category].label}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${CATEGORY_CONFIG[category].bg}`} style={{ width: `${categoryAvg}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-500 w-8 text-right">{categoryAvg}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Skills grow through everyday choices and interactions with the world around you.
      </p>
    </div>
  );
};
