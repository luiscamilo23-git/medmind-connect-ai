import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  isRecording: boolean;
  mediaStream?: MediaStream | null;
  className?: string;
  barCount?: number;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  mediaStream,
  className,
  barCount = 32
}) => {
  const [levels, setLevels] = useState<number[]>(new Array(barCount).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && mediaStream) {
      // Create audio context and analyser
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;

      const updateLevels = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Map frequency data to bar count
          const newLevels = new Array(barCount).fill(0);
          const step = Math.floor(dataArray.length / barCount);
          
          for (let i = 0; i < barCount; i++) {
            const index = Math.min(i * step, dataArray.length - 1);
            // Normalize to 0-1 range with some amplification
            newLevels[i] = Math.min(1, (dataArray[index] / 255) * 1.5);
          }
          
          setLevels(newLevels);
        }
        animationRef.current = requestAnimationFrame(updateLevels);
      };

      updateLevels();
    } else {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setLevels(new Array(barCount).fill(0));
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, mediaStream, barCount]);

  return (
    <div className={cn("flex items-center justify-center gap-0.5 h-16", className)}>
      {levels.map((level, index) => {
        const height = isRecording ? Math.max(4, level * 56) : 4;
        const delay = index * 0.02;
        
        return (
          <div
            key={index}
            className="w-1 rounded-full transition-all duration-75 ease-out"
            style={{
              height: `${height}px`,
              background: isRecording 
                ? `linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.5))`
                : 'hsl(var(--muted))',
              boxShadow: isRecording && level > 0.3 
                ? '0 0 8px hsl(var(--primary) / 0.5)' 
                : 'none',
              transitionDelay: `${delay}s`
            }}
          />
        );
      })}
    </div>
  );
};

export default AudioWaveform;
