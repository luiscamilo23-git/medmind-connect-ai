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

// Configuration maps for variants and intensities
const intensityConfig: Record<Intensity, { opacity: number; strokeBase: number; strokeGlow: number; blur: number }> = {
  low: { opacity: 0.3, strokeBase: 1.5, strokeGlow: 3, blur: 2 },
  medium: { opacity: 0.5, strokeBase: 2, strokeGlow: 5, blur: 4 },
  high: { opacity: 0.8, strokeBase: 2.5, strokeGlow: 8, blur: 6 },
};

const variantConfig: Record<Variant, { height: string; viewBox: string; intensity: Intensity }> = {
  hero: { height: "h-24 sm:h-32 md:h-40", viewBox: "0 0 1200 100", intensity: "high" },
  background: { height: "h-16 sm:h-20 md:h-24", viewBox: "0 0 1200 100", intensity: "medium" },
  separator: { height: "h-8 sm:h-10", viewBox: "0 0 800 40", intensity: "medium" },
  card: { height: "h-10 sm:h-12", viewBox: "0 0 400 40", intensity: "low" },
  subtle: { height: "h-6 sm:h-8", viewBox: "0 0 400 40", intensity: "low" },
};

const colorMap: Record<Color, string> = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  purple: "hsl(var(--purple))",
  muted: "hsl(var(--muted-foreground))",
};

const glowColorMap: Record<Color, string> = {
  primary: "rgba(74, 144, 217, 0.7)",
  secondary: "rgba(20, 184, 166, 0.7)",
  purple: "rgba(168, 85, 247, 0.7)",
  muted: "rgba(148, 163, 184, 0.5)",
};

const speedMap = {
  slow: "10s",
  normal: "6s",
  fast: "3s",
};

// EKG paths for different sizes
const ekgPathLarge = "M0,50 L60,50 L80,50 L90,48 L100,52 L110,50 L140,50 L160,50 L175,45 L185,55 L195,25 L205,75 L215,20 L225,80 L235,50 L260,50 L300,50 L340,50 L360,50 L370,48 L380,52 L390,50 L420,50 L440,50 L455,45 L465,55 L475,25 L485,75 L495,20 L505,80 L515,50 L540,50 L580,50 L620,50 L640,50 L650,48 L660,52 L670,50 L700,50 L720,50 L735,45 L745,55 L755,25 L765,75 L775,20 L785,80 L795,50 L820,50 L860,50 L900,50 L920,50 L930,48 L940,52 L950,50 L980,50 L1000,50 L1015,45 L1025,55 L1035,25 L1045,75 L1055,20 L1065,80 L1075,50 L1100,50 L1140,50 L1180,50 L1200,50";
const ekgPathMedium = "M0,20 L50,20 L70,20 L85,17 L95,23 L105,8 L115,32 L125,5 L135,35 L145,20 L180,20 L220,20 L260,20 L290,20 L305,17 L315,23 L325,8 L335,32 L345,5 L355,35 L365,20 L400,20 L440,20 L480,20 L520,20 L560,20 L580,20 L595,17 L605,23 L615,8 L625,32 L635,5 L645,35 L655,20 L700,20 L740,20 L780,20 L800,20";
const ekgPathSmall = "M0,20 L40,20 L60,20 L70,16 L80,24 L90,10 L100,30 L110,20 L150,20 L170,20 L180,16 L190,24 L200,10 L210,30 L220,20 L260,20 L280,20 L290,16 L300,24 L310,10 L320,30 L330,20 L370,20 L400,20";

export const HeartbeatLine = ({
  className,
  color = "primary",
  variant = "background",
  intensity: intensityProp,
  speed = "normal",
}: HeartbeatLineProps) => {
  const variantCfg = variantConfig[variant];
  const intensity = intensityProp || variantCfg.intensity;
  const intensityCfg = intensityConfig[intensity];
  
  const isLarge = variant === "hero" || variant === "background";
  const ekgPath = isLarge ? ekgPathLarge : (variant === "separator" ? ekgPathMedium : ekgPathSmall);
  const uniqueId = `ekg-${variant}-${color}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className={cn(
        "absolute left-0 right-0 pointer-events-none overflow-hidden",
        variant === "separator" ? "relative" : "bottom-0",
        variantCfg.height,
        className
      )}
      style={{ opacity: intensityCfg.opacity }}
    >
      <svg
        className="w-full h-full"
        viewBox={variantCfg.viewBox}
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          {/* Glow filter */}
          <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={intensityCfg.blur} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradient for the moving pulse */}
          <linearGradient id={`${uniqueId}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorMap[color]} stopOpacity="0" />
            <stop offset="40%" stopColor={colorMap[color]} stopOpacity="0.4" />
            <stop offset="50%" stopColor={colorMap[color]} stopOpacity="1" />
            <stop offset="60%" stopColor={colorMap[color]} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colorMap[color]} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Base static EKG path */}
        <path
          d={ekgPath}
          stroke={colorMap[color]}
          strokeWidth={intensityCfg.strokeBase}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.3"
        />

        {/* Primary animated pulse */}
        <g style={{ animation: `ekg-travel ${speedMap[speed]} linear infinite` }}>
          <path
            d={ekgPath}
            stroke={`url(#${uniqueId}-gradient)`}
            strokeWidth={intensityCfg.strokeGlow}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={`url(#${uniqueId}-glow)`}
          />
        </g>

        {/* Secondary glow layer for extra visibility */}
        <g style={{ animation: `ekg-travel ${speedMap[speed]} linear infinite`, animationDelay: `-${parseInt(speedMap[speed]) / 2}s` }}>
          <path
            d={ekgPath}
            stroke={glowColorMap[color]}
            strokeWidth={intensityCfg.strokeGlow * 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ filter: `blur(${intensityCfg.blur}px)` }}
            opacity="0.6"
          />
        </g>
      </svg>

      <style>{`
        @keyframes ekg-travel {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// Compact static version for badges and small areas
export const HeartbeatLineCompact = ({
  className,
  color = "primary",
  intensity = "low",
}: Pick<HeartbeatLineProps, "className" | "color" | "intensity">) => {
  const intensityCfg = intensityConfig[intensity || "low"];

  return (
    <div
      className={cn("absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-8", className)}
      style={{ opacity: intensityCfg.opacity }}
    >
      <svg className="w-full h-full" viewBox="0 0 200 20" preserveAspectRatio="none" fill="none">
        <path
          d="M0,10 L30,10 L40,8 L50,12 L60,5 L70,15 L80,10 L120,10 L130,8 L140,12 L150,5 L160,15 L170,10 L200,10"
          stroke={colorMap[color]}
          strokeWidth={intensityCfg.strokeBase}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="animate-clinical-pulse"
        />
      </svg>
    </div>
  );
};

// Vital signs pulse dot animation
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
  const ringSize = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Pulsing ring */}
      <span
        className={cn(
          "absolute rounded-full animate-clinical-ring",
          ringSize[size]
        )}
        style={{ backgroundColor: colorMap[color], opacity: 0.3 }}
      />
      {/* Core dot */}
      <span
        className={cn("relative rounded-full animate-clinical-heartbeat", sizeMap[size])}
        style={{ backgroundColor: colorMap[color] }}
      />
    </div>
  );
};

// Monitor scan line effect
export const MonitorScanLine = ({
  className,
  color = "primary",
}: {
  className?: string;
  color?: Color;
}) => {
  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      <div
        className="absolute top-0 left-0 w-full h-px animate-clinical-scan"
        style={{
          background: `linear-gradient(90deg, transparent, ${colorMap[color]}, transparent)`,
          boxShadow: `0 0 10px ${glowColorMap[color]}, 0 0 20px ${glowColorMap[color]}`,
        }}
      />
    </div>
  );
};
