import { cn } from "@/lib/utils";

interface HeartbeatLineProps {
  className?: string;
  color?: "primary" | "secondary" | "purple" | "muted";
  position?: "top" | "bottom" | "center";
  opacity?: number;
  speed?: "slow" | "normal" | "fast";
}

export const HeartbeatLine = ({ 
  className, 
  color = "primary",
  position = "bottom",
  opacity = 0.4,
  speed = "normal"
}: HeartbeatLineProps) => {
  const colorMap = {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    purple: "hsl(var(--purple))",
    muted: "hsl(var(--muted-foreground))"
  };

  const glowColorMap = {
    primary: "rgba(74, 144, 217, 0.6)",
    secondary: "rgba(20, 184, 166, 0.6)",
    purple: "rgba(168, 85, 247, 0.6)",
    muted: "rgba(148, 163, 184, 0.4)"
  };

  const speedMap = {
    slow: "8s",
    normal: "5s",
    fast: "3s"
  };

  const positionMap = {
    top: "top-0",
    bottom: "bottom-0",
    center: "top-1/2 -translate-y-1/2"
  };

  // EKG path - realistic heartbeat pattern that extends full width
  const ekgPath = "M0,50 L60,50 L80,50 L90,48 L100,52 L110,50 L140,50 L160,50 L175,45 L185,55 L195,25 L205,75 L215,20 L225,80 L235,50 L260,50 L300,50 L340,50 L360,50 L370,48 L380,52 L390,50 L420,50 L440,50 L455,45 L465,55 L475,25 L485,75 L495,20 L505,80 L515,50 L540,50 L580,50 L620,50 L640,50 L650,48 L660,52 L670,50 L700,50 L720,50 L735,45 L745,55 L755,25 L765,75 L775,20 L785,80 L795,50 L820,50 L860,50 L900,50 L920,50 L930,48 L940,52 L950,50 L980,50 L1000,50 L1015,45 L1025,55 L1035,25 L1045,75 L1055,20 L1065,80 L1075,50 L1100,50 L1140,50 L1180,50 L1200,50";

  return (
    <div 
      className={cn(
        "absolute left-0 right-0 pointer-events-none overflow-hidden",
        positionMap[position],
        className
      )}
      style={{ opacity }}
    >
      <svg 
        className="w-full h-20 md:h-24 lg:h-28"
        viewBox="0 0 1200 100" 
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          {/* Glow filter for the animated line */}
          <filter id={`ekg-glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          {/* Gradient for the moving pulse effect */}
          <linearGradient id={`ekg-pulse-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorMap[color]} stopOpacity="0" />
            <stop offset="45%" stopColor={colorMap[color]} stopOpacity="0.3" />
            <stop offset="50%" stopColor={colorMap[color]} stopOpacity="1" />
            <stop offset="55%" stopColor={colorMap[color]} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colorMap[color]} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Base static EKG path - always visible */}
        <path
          d={ekgPath}
          stroke={colorMap[color]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.25"
        />
        
        {/* Animated glowing pulse that travels along the line */}
        <g style={{ animation: `ekg-travel ${speedMap[speed]} linear infinite` }}>
          <path
            d={ekgPath}
            stroke={`url(#ekg-pulse-gradient-${color})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={`url(#ekg-glow-${color})`}
          />
        </g>
        
        {/* Secondary glow layer for extra visibility */}
        <g style={{ animation: `ekg-travel ${speedMap[speed]} linear infinite`, animationDelay: "-2.5s" }}>
          <path
            d={ekgPath}
            stroke={glowColorMap[color]}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ filter: "blur(4px)" }}
            opacity="0.5"
          />
        </g>
      </svg>
      
      <style>{`
        @keyframes ekg-travel {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

// Compact version for cards and smaller areas
export const HeartbeatLineCompact = ({ 
  className, 
  color = "primary",
  opacity = 0.35
}: Omit<HeartbeatLineProps, 'position' | 'speed'>) => {
  const colorMap = {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    purple: "hsl(var(--purple))",
    muted: "hsl(var(--muted-foreground))"
  };

  return (
    <div 
      className={cn(
        "absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-10",
        className
      )}
      style={{ opacity }}
    >
      <svg 
        className="w-full h-full"
        viewBox="0 0 400 40" 
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0,20 L40,20 L60,20 L70,16 L80,24 L90,10 L100,30 L110,20 L150,20 L170,20 L180,16 L190,24 L200,10 L210,30 L220,20 L260,20 L280,20 L290,16 L300,24 L310,10 L320,30 L330,20 L370,20 L400,20"
          stroke={colorMap[color]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            animation: "ekg-pulse-compact 2.5s ease-in-out infinite"
          }}
        />
      </svg>
      
      <style>{`
        @keyframes ekg-pulse-compact {
          0%, 100% { 
            opacity: 0.4;
            filter: drop-shadow(0 0 2px ${colorMap[color]});
          }
          50% { 
            opacity: 1;
            filter: drop-shadow(0 0 6px ${colorMap[color]});
          }
        }
      `}</style>
    </div>
  );
};
