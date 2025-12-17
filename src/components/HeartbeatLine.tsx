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
  opacity = 0.15,
  speed = "normal"
}: HeartbeatLineProps) => {
  const colorMap = {
    primary: "stroke-primary",
    secondary: "stroke-secondary",
    purple: "stroke-purple",
    muted: "stroke-muted-foreground"
  };

  const speedMap = {
    slow: "8s",
    normal: "4s",
    fast: "2s"
  };

  const positionMap = {
    top: "top-0",
    bottom: "bottom-0",
    center: "top-1/2 -translate-y-1/2"
  };

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
        className="w-full h-16 md:h-20"
        viewBox="0 0 1200 80" 
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id={`heartbeat-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="15%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="85%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Heartbeat/EKG path */}
        <path
          className={cn(colorMap[color], "heartbeat-path")}
          d="M0,40 L100,40 L120,40 L140,38 L160,42 L180,40 L200,40 L220,40 L240,20 L260,60 L280,10 L300,70 L320,40 L340,40 L360,40 L380,40 L400,40 L420,40 L440,38 L460,42 L480,40 L500,40 L520,40 L540,20 L560,60 L580,10 L600,70 L620,40 L640,40 L660,40 L680,40 L700,40 L720,40 L740,38 L760,42 L780,40 L800,40 L820,40 L840,20 L860,60 L880,10 L900,70 L920,40 L940,40 L960,40 L980,40 L1000,40 L1020,40 L1040,38 L1060,42 L1080,40 L1100,40 L1120,40 L1140,20 L1160,60 L1180,10 L1200,70"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          stroke={`url(#heartbeat-gradient-${color})`}
          style={{
            animation: `heartbeat-draw ${speedMap[speed]} ease-in-out infinite`
          }}
        />
        
        {/* Glow effect path (duplicate for glow) */}
        <path
          className={cn(colorMap[color], "heartbeat-glow")}
          d="M0,40 L100,40 L120,40 L140,38 L160,42 L180,40 L200,40 L220,40 L240,20 L260,60 L280,10 L300,70 L320,40 L340,40 L360,40 L380,40 L400,40 L420,40 L440,38 L460,42 L480,40 L500,40 L520,40 L540,20 L560,60 L580,10 L600,70 L620,40 L640,40 L660,40 L680,40 L700,40 L720,40 L740,38 L760,42 L780,40 L800,40 L820,40 L840,20 L860,60 L880,10 L900,70 L920,40 L940,40 L960,40 L980,40 L1000,40 L1020,40 L1040,38 L1060,42 L1080,40 L1100,40 L1120,40 L1140,20 L1160,60 L1180,10 L1200,70"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          stroke={`url(#heartbeat-gradient-${color})`}
          style={{
            filter: "blur(4px)",
            opacity: 0.5,
            animation: `heartbeat-draw ${speedMap[speed]} ease-in-out infinite`
          }}
        />
      </svg>
    </div>
  );
};

// Compact version for cards and smaller containers
export const HeartbeatLineCompact = ({ 
  className, 
  color = "primary",
  opacity = 0.2
}: Omit<HeartbeatLineProps, 'position' | 'speed'>) => {
  const colorMap = {
    primary: "stroke-primary",
    secondary: "stroke-secondary",
    purple: "stroke-purple",
    muted: "stroke-muted-foreground"
  };

  return (
    <div 
      className={cn(
        "absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-8",
        className
      )}
      style={{ opacity }}
    >
      <svg 
        className="w-full h-full"
        viewBox="0 0 400 32" 
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          className={cn(colorMap[color])}
          d="M0,16 L50,16 L70,16 L80,8 L90,24 L100,4 L110,28 L120,16 L150,16 L170,16 L180,8 L190,24 L200,4 L210,28 L220,16 L250,16 L270,16 L280,8 L290,24 L300,4 L310,28 L320,16 L350,16 L370,16 L380,8 L390,24 L400,16"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            animation: "heartbeat-pulse 2s ease-in-out infinite"
          }}
        />
      </svg>
    </div>
  );
};
