import React, { useEffect, useRef, useState } from 'react';
import type { StageMeta } from './growthStageConfig';

// Served from the production Cloudflare R2 bucket (skill-echosystem) under
// growth-map/plants/ — previously bundled as local Vite imports from
// ./assets/plant-stage-*.png (files kept in place, no longer imported here).
const R2_PLANT_ASSETS_BASE = 'https://storage-sp.rareminds.in/growth-map/plants';
const plantSeedlingSprout = `${R2_PLANT_ASSETS_BASE}/plant-stage-seedling-sprout.png`;
const plantEarlyGrowth = `${R2_PLANT_ASSETS_BASE}/plant-stage-early-growth.png`;
const plantBranchingOut = `${R2_PLANT_ASSETS_BASE}/plant-stage-branching-out.png`;
const plantActiveExploration = `${R2_PLANT_ASSETS_BASE}/plant-stage-active-exploration.png`;
const plantBuddingPotential = `${R2_PLANT_ASSETS_BASE}/plant-stage-budding-potential.png`;
const plantFullBloom = `${R2_PLANT_ASSETS_BASE}/plant-stage-full-bloom.png`;

interface Props {
  currentStage: StageMeta;
  previewStage?: StageMeta | null;
}

/**
 * The 6 unique plant growth levels, in order. Two stage pairs in
 * growthStageConfig.ts share a level (stages 3 & 4 both "Branching Out",
 * stages 6 & 7 both "Budding Potential"), so this list has 6 entries even
 * though there are 8 Growth Map stages — the progress dots below represent
 * these 6 levels, not the 8 stage cards.
 */
const GROWTH_LEVELS: { label: string; image: string }[] = [
  { label: 'Seedling Sprout', image: plantSeedlingSprout },
  { label: 'Early Growth', image: plantEarlyGrowth },
  { label: 'Branching Out', image: plantBranchingOut },
  { label: 'Active Exploration', image: plantActiveExploration },
  { label: 'Budding Potential', image: plantBuddingPotential },
  { label: 'Full Bloom', image: plantFullBloom },
];

const PLANT_IMAGE_BY_LEVEL: Record<string, string> = Object.fromEntries(
  GROWTH_LEVELS.map((level) => [level.label, level.image])
);

const ARC_PATH = 'M 220 25 A 195 195 0 0 1 220 415';
const ARC_LENGTH = 613;

const PLANT_CROSSFADE_MS = 200;

/**
 * Original pixel height of each of the 6 plant PNGs (confirmed via the PNG
 * IHDR header of each actual asset file), in growth-level order. Matches
 * the Bolt reference's own stageHeights array exactly — these are the same
 * source images. Bolt scales each image's on-screen height relative to
 * level 4's height (186px) instead of stretching every image to fill its
 * container equally, so a Seedling Sprout deliberately renders smaller and
 * lower than a Full Bloom, matching the plant's real proportions.
 */
const GROWTH_LEVEL_IMAGE_HEIGHTS = [104, 124, 160, 186, 218, 246];
const REFERENCE_HEIGHT = 186; // level 4 (Active Exploration) is the 100% baseline

export const GrowthMapPlantVisual: React.FC<Props> = ({ currentStage, previewStage }) => {
  const displayStage = previewStage ?? currentStage;
  const plantImage = PLANT_IMAGE_BY_LEVEL[displayStage.growthLevelLabel] ?? plantSeedlingSprout;
  const activeDotIndex = GROWTH_LEVELS.findIndex(
    (level) => level.label === displayStage.growthLevelLabel
  );
  const levelCount = GROWTH_LEVELS.length;
  // Same formulas as the Bolt reference (TabbedView.tsx), adapted from its
  // 8-tab index range to this component's 6 growth-level range.
  const pointerAngle = -75 + (activeDotIndex / (levelCount - 1)) * 150;
  const arcDashoffset = ARC_LENGTH - (ARC_LENGTH * (activeDotIndex + 1)) / levelCount;

  // Same per-stage image scaling as the Bolt reference: each growth level's
  // image is rendered at a height proportional to its real pixel size
  // relative to level 4, not stretched to fill the container uniformly.
  const imagePixelHeight = GROWTH_LEVEL_IMAGE_HEIGHTS[activeDotIndex] ?? REFERENCE_HEIGHT;
  const imageHeightPercent = Math.round((imagePixelHeight / REFERENCE_HEIGHT) * 100);

  // Crossfade between the outgoing and incoming plant images instead of
  // unmounting/remounting a single <img> (which briefly shows the old image
  // before the new one paints, causing a visible flash/double-image glitch
  // — present in the Bolt reference's own identical key-remount pattern too,
  // so it isn't fixed by copying Bolt more closely; it needs a real crossfade).
  const [outgoingImage, setOutgoingImage] = useState<{ src: string; heightPercent: number } | null>(
    null
  );
  const previousImageRef = useRef({ src: plantImage, heightPercent: imageHeightPercent });

  useEffect(() => {
    if (previousImageRef.current.src === plantImage) return;
    const fadingOut = previousImageRef.current;
    setOutgoingImage(fadingOut);
    previousImageRef.current = { src: plantImage, heightPercent: imageHeightPercent };

    const timeout = setTimeout(() => {
      setOutgoingImage((current) => (current?.src === fadingOut.src ? null : current));
    }, PLANT_CROSSFADE_MS);

    return () => clearTimeout(timeout);
  }, [plantImage, imageHeightPercent]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 shadow-sm mb-12 sm:mb-16">
        <span className="text-blue-700 text-xs font-bold">
          Stage {displayStage.order}: {displayStage.growthLevelLabel}
        </span>
      </div>

      <div className="group relative flex items-center justify-center my-6">
        {/* Outer glow halo — matches Bolt's h-60 w-60 sm:h-72 sm:w-72 blur-2xl
            halo exactly (same responsive sizing as the pot container below). */}
        <div className="absolute size-[240px] rounded-full blur-2xl transition-all duration-500 sm:size-[288px]" style={{ backgroundColor: 'rgba(96,165,250,0.15)' }} />
        {/* Pulsing ring — matches Bolt's fixed h-52 w-52 (208px, no responsive
            variant), same as Bolt's own source. */}
        <div
          className="absolute size-[208px] animate-pulse rounded-full border"
          style={{ borderColor: 'rgba(147,197,253,0.4)' }}
        />
        {/* Complete neutral base-track circle — matches Bolt's fixed h-64 w-64
            (256px, no responsive variant). This is intentionally LARGER than
            the pot container's base 240px size (so the ring is visible below
            the sm: breakpoint, exactly like Bolt) but smaller than the pot's
            sm:288px size (so it tucks behind the pot at sm: and up, again
            exactly like Bolt). Previously this circle was derived from an
            inset on the same fixed 288px box as the pot, making it always
            smaller than the (always-288px) pot and permanently hidden behind
            it — this fixed 256px value plus the pot's own responsive sizing
            is what restores the visible complete ring. */}
        <div
          className="absolute size-[256px] rounded-full border"
          style={{ borderColor: '#e2e8f0' }}
        />

        {/* Dynamic rotating semi-arc dial around the plant, matching the Bolt
            reference: an SVG progress arc plus a rotating pointer needle,
            both driven by the current growth-level position (0-5). Bolt
            offsets this whole dial with translate-x-2 sm:translate-x-4 so
            the arc sits slightly right of dead-center relative to the
            concentric gray track/pot circles — without this offset the arc
            reads as colliding with the gray ring instead of sitting
            cleanly outside it. */}
        <div
          className="pointer-events-none absolute flex size-[380px] translate-x-2 items-center justify-center sm:size-[430px] sm:translate-x-4"
          aria-hidden="true"
        >
          <svg className="h-full w-full overflow-visible" viewBox="0 0 440 440">
            <defs>
              <linearGradient id="growthMapArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.9" />
              </linearGradient>
              <filter id="growthMapArcGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <path
              d={ARC_PATH}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="opacity-60"
            />

            <path
              d={ARC_PATH}
              fill="none"
              stroke="url(#growthMapArcGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={ARC_LENGTH}
              strokeDashoffset={arcDashoffset}
              className="transition-all duration-700 ease-out"
              filter="url(#growthMapArcGlow)"
            />
          </svg>

          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
            style={{ transform: `rotate(${pointerAngle}deg)` }}
          >
            <div className="absolute right-0 -mr-2.5 flex items-center justify-center sm:-mr-3">
              <div className="absolute h-8 w-8 animate-ping rounded-full bg-blue-500/40" />
              <div
                className="h-4 w-4 rounded-full border-2 border-solid border-white"
                style={{
                  backgroundImage: 'linear-gradient(to right, #2563eb, #4f46e5)',
                  boxShadow: '0px 0px 14px 0px rgba(37,99,235,0.9)',
                }}
              />
            </div>
            <div
              className="absolute right-2 h-0.5 w-24"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(96,165,250,0), rgba(96,165,250,0.5) 50%, #2563eb)',
              }}
            />
          </div>
        </div>

        <div
          className="relative z-10 flex size-[240px] flex-col items-center justify-end overflow-hidden rounded-full border-4 pb-6 pt-4 px-4 shadow-[0px_10px_35px_0px_rgba(37,99,235,0.12)] transition-all duration-500 sm:size-[288px]"
          style={{
            borderColor: 'rgba(96,165,250,0.4)',
            backgroundImage:
              'linear-gradient(to bottom, rgba(239,246,255,0.5), white 50%, #f8fafc)',
          }}
        >
          <div className="relative flex h-[224px] w-[208px] items-end justify-center">
            {outgoingImage && (
              <img
                src={outgoingImage.src}
                alt=""
                aria-hidden="true"
                className="plant-fade-out absolute max-h-[224px] max-w-[208px] object-contain"
                style={{ height: `${outgoingImage.heightPercent}%`, width: 'auto' }}
              />
            )}
            <img
              src={plantImage}
              alt={`Growth stage: ${displayStage.growthLevelLabel}`}
              className={
                outgoingImage
                  ? 'plant-fade-in absolute max-h-[224px] max-w-[208px] object-contain'
                  : 'max-h-[224px] max-w-[208px] object-contain'
              }
              style={{ height: `${imageHeightPercent}%`, width: 'auto' }}
            />
          </div>
        </div>
      </div>

      <p className="mt-12 max-w-[320px] text-center text-sm font-semibold text-slate-600 sm:mt-16">
        {displayStage.description}
      </p>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {GROWTH_LEVELS.map((level, index) => (
          <span
            key={level.label}
            className={
              index === activeDotIndex
                ? 'h-2 w-6 rounded-full shadow-[0px_0px_8px_0px_rgba(37,99,235,0.5)]'
                : 'h-2 w-2 rounded-full bg-slate-200'
            }
            style={
              index === activeDotIndex
                ? { backgroundImage: 'linear-gradient(to right, #2563eb, #4f46e5)' }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};
