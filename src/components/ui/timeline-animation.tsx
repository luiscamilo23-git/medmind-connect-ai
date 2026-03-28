import { motion, useInView, Variants } from 'framer-motion';
import React, { useRef, ElementType, RefObject, useMemo } from 'react';

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: -20, filter: 'blur(10px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' },
  }),
};

type TimelineContentProps = {
  as?: ElementType;
  children: React.ReactNode;
  className?: string;
  animationNum?: number;
  customVariants?: Variants;
  timelineRef?: RefObject<HTMLElement | null>;
};

export function TimelineContent({
  as: Tag = 'div',
  children,
  className,
  animationNum = 0,
  customVariants,
  timelineRef,
}: TimelineContentProps) {
  const selfRef = useRef<HTMLElement>(null);
  const inViewRef = timelineRef ?? selfRef;
  const isInView = useInView(inViewRef as RefObject<Element>, { once: true, margin: '-60px' });

  // Memoize so React never sees a new component type between renders
  const MotionTag = useMemo(() => motion(Tag as keyof JSX.IntrinsicElements), [Tag]);

  const variants = customVariants ?? defaultVariants;

  return (
    <MotionTag
      ref={selfRef as any}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={animationNum}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
