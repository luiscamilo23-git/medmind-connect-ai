import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface RecordingTimerProps {
  isRecording: boolean;
  className?: string;
}

const RecordingTimer: React.FC<RecordingTimerProps> = ({
  isRecording,
  className
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30",
      className
    )}>
      <div className="relative flex items-center justify-center">
        <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
        <span className="absolute w-5 h-5 rounded-full bg-destructive/30 animate-ping" />
      </div>
      <span className="text-lg font-mono font-semibold text-destructive">
        {formatTime(seconds)}
      </span>
      <span className="text-sm text-muted-foreground">
        Grabando...
      </span>
    </div>
  );
};

export default RecordingTimer;
