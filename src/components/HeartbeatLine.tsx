import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

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
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  const colorMap = {
    primary: "#4A90D9",
    secondary: "#14B8A6",
    purple: "#A855F7",
    muted: "#94A3B8"
  };

  const speedMap = {
    slow: 6,
    normal: 4,
    fast: 2
  };

  const positionMap = {
    top: "top-0",
    bottom: "bottom-0",
    center: "top-1/2 -translate-y-1/2"
  };

  // EKG path - realistic heartbeat pattern
  const ekgPath = "M0,40 L80,40 L100,40 L110,40 L115,38 L120,42 L125,40 L150,40 L160,40 L170,35 L175,45 L180,20 L185,60 L190,15 L195,65 L200,40 L220,40 L240,40 L280,40 L300,40 L310,40 L315,38 L320,42 L325,40 L350,40 L360,40 L370,35 L375,45 L380,20 L385,60 L390,15 L395,65 L400,40 L420,40 L440,40 L480,40 L500,40 L510,40 L515,38 L520,42 L525,40 L550,40 L560,40 L570,35 L575,45 L580,20 L585,60 L590,15 L595,65 L600,40 L620,40 L640,40 L680,40 L700,40 L710,40 L715,38 L720,42 L725,40 L750,40 L760,40 L770,35 L775,45 L780,20 L785,60 L790,15 L795,65 L800,40 L820,40 L840,40 L880,40 L900,40 L910,40 L915,38 L920,42 L925,40 L950,40 L960,40 L970,35 L975,45 L980,20 L985,60 L990,15 L995,65 L1000,40 L1020,40 L1040,40 L1080,40 L1100,40 L1110,40 L1115,38 L1120,42 L1125,40 L1150,40 L1160,40 L1170,35 L1175,45 L1180,20 L1185,60 L1190,15 L1195,65 L1200,40";

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, []);

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
          <linearGradient id={`ekg-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorMap[color]} stopOpacity="0" />
            <stop offset="10%" stopColor={colorMap[color]} stopOpacity="1" />
            <stop offset="90%" stopColor={colorMap[color]} stopOpacity="1" />
            <stop offset="100%" stopColor={colorMap[color]} stopOpacity="0" />
          </linearGradient>
          
          {/* Moving highlight gradient */}
          <linearGradient id={`ekg-highlight-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorMap[color]} stopOpacity="0">
              <animate attributeName="offset" values="0;0.9;0" dur={`${speedMap[speed]}s`} repeatCount="indefinite" />
            </stop>
            <stop offset="5%" stopColor={colorMap[color]} stopOpacity="1">
              <animate attributeName="offset" values="0.05;0.95;0.05" dur={`${speedMap[speed]}s`} repeatCount="indefinite" />
            </stop>
            <stop offset="10%" stopColor={colorMap[color]} stopOpacity="0">
              <animate attributeName="offset" values="0.1;1;0.1" dur={`${speedMap[speed]}s`} repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        
        {/* Base EKG path - subtle */}
        <path
          d={ekgPath}
          stroke={`url(#ekg-gradient-${color})`}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.3"
        />
        
        {/* Main animated EKG path - draws progressively */}
        <path
          ref={pathRef}
          d={ekgPath}
          stroke={`url(#ekg-highlight-${color})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            strokeDasharray: pathLength || 3000,
            strokeDashoffset: pathLength || 3000,
            animation: `ekg-draw ${speedMap[speed]}s ease-in-out infinite`
          }}
        />
        
        {/* Glow effect following the draw */}
        <path
          ref={glowRef}
          d={ekgPath}
          stroke={colorMap[color]}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            filter: "blur(3px)",
            strokeDasharray: pathLength || 3000,
            strokeDashoffset: pathLength || 3000,
            animation: `ekg-draw ${speedMap[speed]}s ease-in-out infinite`,
            opacity: 0.5
          }}
        />
      </svg>
      
      <style>{`
        @keyframes ekg-draw {
          0% {
            stroke-dashoffset: ${pathLength || 3000};
          }
          100% {
            stroke-dashoffset: -${pathLength || 3000};
          }
        }
      `}</style>
    </div>
  );
};

// Compact version for cards
export const HeartbeatLineCompact = ({ 
  className, 
  color = "primary",
  opacity = 0.2
}: Omit<HeartbeatLineProps, 'position' | 'speed'>) => {
  const colorMap = {
    primary: "#4A90D9",
    secondary: "#14B8A6",
    purple: "#A855F7",
    muted: "#94A3B8"
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
          d="M0,16 L50,16 L70,16 L80,12 L85,20 L90,8 L95,24 L100,16 L150,16 L170,16 L180,12 L185,20 L190,8 L195,24 L200,16 L250,16 L270,16 L280,12 L285,20 L290,8 L295,24 L300,16 L350,16 L370,16 L380,12 L385,20 L390,8 L395,24 L400,16"
          stroke={colorMap[color]}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            animation: "ekg-pulse 3s ease-in-out infinite"
          }}
        />
      </svg>
      
      <style>{`
        @keyframes ekg-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
