import { cn } from "@/lib/utils";

type Variant = "hero" | "background" | "separator" | "card" | "subtle";
type Intensity = "low" | "medium" | "high";
type Color = "primary" | "secondary" | "purple" | "muted";

interface HeartbeatLineProps {
  className?: string;
  color?: Color;
  variant?: Variant;
  intensity?: Intensity;
  speed?: "slow" | "normal" | "fast";
}

const intensityConfig: Record<Intensity, { opacity: number; strokeWidth: number; glowBlur: number }> = {
  low: { opacity: 0.5, strokeWidth: 1.5, glowBlur: 4 },
  medium: { opacity: 0.7, strokeWidth: 2, glowBlur: 6 },
  high: { opacity: 0.9, strokeWidth: 2.5, glowBlur: 10 },
};

const variantConfig: Record<Variant, { height: string; viewBox: string; defaultIntensity: Intensity }> = {
  hero: { height: "h-20 sm:h-24 md:h-28", viewBox: "0 0 1200 100", defaultIntensity: "high" },
  background: { height: "h-14 sm:h-16 md:h-20", viewBox: "0 0 1200 100", defaultIntensity: "medium" },
  separator: { height: "h-8 sm:h-10", viewBox: "0 0 800 40", defaultIntensity: "medium" },
  card: { height: "h-8 sm:h-10", viewBox: "0 0 400 40", defaultIntensity: "low" },
  subtle: { height: "h-6", viewBox: "0 0 400 40", defaultIntensity: "low" },
};

const colorMap: Record<Color, string> = {
  primary: "hsl(211, 63%, 57%)",
  secondary: "hsl(173, 80%, 40%)",
  purple: "hsl(271, 91%, 65%)",
  muted: "hsl(215, 20%, 65%)",
};

const speedMap = { slow: "6s", normal: "4.5s", fast: "2s" };

// EKG paths
const ekgPathLarge =
  "M0,50 L100,50 L130,48 L140,52 L150,50 L220,50 L235,45 L245,55 L255,25 L265,75 L275,20 L285,80 L295,50 L400,50 L470,48 L480,52 L490,50 L560,50 L575,45 L585,55 L595,25 L605,75 L615,20 L625,80 L635,50 L750,50 L820,48 L830,52 L840,50 L910,50 L925,45 L935,55 L945,25 L955,75 L965,20 L975,80 L985,50 L1100,50 L1200,50";
const ekgPathSmall =
  "M0,20 L50,20 L80,18 L90,22 L100,20 L145,17 L155,23 L165,10 L175,30 L185,8 L195,32 L205,20 L310,20 L330,18 L340,22 L350,20 L400,20";

export const HeartbeatLine = ({
  className,
  color = "primary",
  variant = "background",
  intensity: intensityProp,
  speed = "normal",
}: HeartbeatLineProps) => {
  const variantCfg = variantConfig[variant];
  const intensity = intensityProp || variantCfg.defaultIntensity;
  const intensityCfg = intensityConfig[intensity];

  const isLarge = variant === "hero" || variant === "background";
  const ekgPath = isLarge ? ekgPathLarge : ekgPathSmall;
  const uniqueId = `ekg-${Math.random().toString(36).substr(2, 9)}`;
  const duration = speedMap[speed];
  const width = isLarge ? 1200 : 400;

  return (
    <div
      className={cn(
        "absolute left-0 right-0 bottom-0 pointer-events-none overflow-hidden",
        variantCfg.height,
        className,
      )}
      style={{ opacity: intensityCfg.opacity }}
    >
      <svg className="w-full h-full" viewBox={variantCfg.viewBox} preserveAspectRatio="none" fill="none">
        <defs>
          {/* Glow filter */}
          <filter id={`${uniqueId}-glow`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation={intensityCfg.glowBlur} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Bright leading light filter */}
          <filter id={`${uniqueId}-bright`} x="-50%" y="-100%" width="200%" height="300%">
            <feGaussianBlur stdDeviation={intensityCfg.glowBlur * 3} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip path that reveals the line progressively */}
          <clipPath id={`${uniqueId}-clip`}>
            <rect x={-width} y="0" width={width} height="100">
              <animate attributeName="x" values={`${-width};${width}`} dur={duration} repeatCount="indefinite" />
            </rect>
          </clipPath>
        </defs>

        {/* Trail line - revealed by clip */}
        <g clipPath={`url(#${uniqueId}-clip)`}>
          <path
            d={ekgPath}
            stroke={colorMap[color]}
            strokeWidth={intensityCfg.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={`url(#${uniqueId}-glow)`}
          />
        </g>
      </svg>
    </div>
  );
};
// Compact version for cards
export const HeartbeatLineCompact = ({
  className,
  color = "primary",
}: Pick<HeartbeatLineProps, "className" | "color">) => {
  return (
    <div className={cn("absolute inset-x-0 bottom-0 pointer-events-none h-6 opacity-20", className)}>
      <svg className="w-full h-full" viewBox="0 0 200 20" preserveAspectRatio="none" fill="none">
        <path
          d="M0,10 L40,10 L50,8 L60,12 L70,5 L80,15 L90,10 L140,10 L150,8 L160,12 L170,5 L180,15 L190,10 L200,10"
          stroke={colorMap[color]}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

// Vital pulse dot - simple pulsing indicator
export const VitalPulseDot = ({
  className,
  color = "primary",
  size = "md",
}: {
  className?: string;
  color?: Color;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeMap = { sm: "w-2 h-2", md: "w-3 h-3", lg: "w-4 h-4" };

  return (
    <span
      className={cn("relative inline-block rounded-full animate-clinical-pulse", sizeMap[size], className)}
      style={{ backgroundColor: colorMap[color] }}
    />
  );
};
