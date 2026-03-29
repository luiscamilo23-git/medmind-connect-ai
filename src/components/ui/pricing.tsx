'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, StarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, Transition } from 'framer-motion';

type FREQUENCY = 'monthly' | 'yearly';
const frequencies: FREQUENCY[] = ['monthly', 'yearly'];

export interface Plan {
  name: string;
  info: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    text: string;
    tooltip?: string;
  }[];
  btn: {
    text: string;
    href: string;
  };
  highlighted?: boolean;
  badge?: string;
}

interface PricingSectionProps extends React.ComponentProps<'div'> {
  plans: Plan[];
  heading: string;
  description?: string;
  showToggle?: boolean;
}

export function PricingSection({
  plans,
  heading,
  description,
  showToggle = true,
  ...props
}: PricingSectionProps) {
  const [frequency, setFrequency] = React.useState<FREQUENCY>('monthly');

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center space-y-8 p-4',
        props.className,
      )}
      {...props}
    >
      <div className="mx-auto max-w-xl space-y-2">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          {heading}
        </h2>
        {description && (
          <p className="text-muted-foreground text-center text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      {showToggle && (
        <PricingFrequencyToggle frequency={frequency} setFrequency={setFrequency} />
      )}
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard plan={plan} key={plan.name} frequency={frequency} />
        ))}
      </div>
    </div>
  );
}

type PricingFrequencyToggleProps = React.ComponentProps<'div'> & {
  frequency: FREQUENCY;
  setFrequency: React.Dispatch<React.SetStateAction<FREQUENCY>>;
};

export function PricingFrequencyToggle({
  frequency,
  setFrequency,
  ...props
}: PricingFrequencyToggleProps) {
  return (
    <div
      className={cn(
        'bg-muted/20 border border-border mx-auto flex w-fit rounded-full p-1 gap-1',
        props.className,
      )}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          onClick={() => setFrequency(freq)}
          className={cn(
            'relative flex items-center gap-1 px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200',
            frequency === freq
              ? 'bg-primary text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {freq === 'monthly' ? 'Mensual' : 'Anual'}
          {freq === 'yearly' && (
            <span className={cn(
              'text-[10px] font-bold',
              frequency === 'yearly' ? 'text-white/80' : 'text-primary',
            )}>-17%</span>
          )}
        </button>
      ))}
    </div>
  );
}

type PricingCardProps = React.ComponentProps<'div'> & {
  plan: Plan;
  frequency?: FREQUENCY;
};

export function PricingCard({
  plan,
  className,
  frequency = frequencies[0],
  ...props
}: PricingCardProps) {
  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(n);

  const savingPct =
    frequency === 'yearly'
      ? Math.round(
          ((plan.price.monthly * 12 - plan.price.yearly) / (plan.price.monthly * 12)) * 100,
        )
      : 0;

  return (
    <div
      key={plan.name}
      className={cn(
        'relative flex w-full flex-col rounded-xl border transition-all duration-300',
        plan.highlighted
          ? 'border-primary/60 shadow-lg shadow-primary/10 scale-[1.02]'
          : 'border-border/50 hover:border-primary/30',
        className,
      )}
      {...props}
    >
      {plan.highlighted && (
        <BorderTrail
          size={80}
          style={{
            background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)))',
            boxShadow: '0 0 20px 4px hsl(var(--primary) / 0.3)',
          }}
        />
      )}

      {/* Header */}
      <div
        className={cn(
          'rounded-t-xl border-b p-5',
          plan.highlighted ? 'bg-primary/10' : 'bg-muted/20',
        )}
      >
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {(plan.highlighted || plan.badge) && (
            <p className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              <StarIcon className="h-3 w-3 fill-current" />
              {plan.badge ?? 'Popular'}
            </p>
          )}
          {frequency === 'yearly' && savingPct > 0 && (
            <p className="bg-primary/20 text-primary border border-primary/30 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
              -{savingPct}%
            </p>
          )}
        </div>

        <div className="text-lg font-bold">{plan.name}</div>
        <p className="text-muted-foreground text-sm">{plan.info}</p>
        <h3 className="mt-3 flex items-end gap-1">
          <span className="text-3xl font-black">{formatCOP(plan.price[frequency])}</span>
          <span className="text-muted-foreground text-sm mb-0.5">
            /{frequency === 'monthly' ? 'mes' : 'año'}
          </span>
        </h3>
        {frequency === 'monthly' && (
          <p className="text-xs text-muted-foreground mt-1">+ IVA · Cancela cuando quieras</p>
        )}
      </div>

      {/* Features */}
      <div
        className={cn(
          'text-muted-foreground space-y-3.5 px-5 py-5 text-sm flex-1',
          plan.highlighted && 'bg-primary/5',
        )}
      >
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <CheckCircleIcon className="text-primary h-4 w-4 mt-0.5 shrink-0" />
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <p
                    className={cn(
                      'leading-snug',
                      feature.tooltip && 'cursor-pointer border-b border-dashed border-muted-foreground/40',
                    )}
                  >
                    {feature.text}
                  </p>
                </TooltipTrigger>
                {feature.tooltip && (
                  <TooltipContent>
                    <p>{feature.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className={cn(
          'mt-auto border-t p-4',
          plan.highlighted && 'bg-primary/10',
        )}
      >
        <Button
          className="w-full rounded-lg"
          variant={plan.highlighted ? 'default' : 'outline'}
          asChild
        >
          <Link to={plan.btn.href}>{plan.btn.text}</Link>
        </Button>
      </div>
    </div>
  );
}

// ── BorderTrail ──────────────────────────────────────────────────────────────

type BorderTrailProps = {
  className?: string;
  size?: number;
  transition?: Transition;
  delay?: number;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
};

export function BorderTrail({
  className,
  size = 60,
  transition,
  delay,
  onAnimationComplete,
  style,
}: BorderTrailProps) {
  const BASE_TRANSITION = { repeat: Infinity, duration: 4, ease: 'linear' };

  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
      <motion.div
        className={cn('absolute aspect-square', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)))',
          ...style,
        }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ ...(transition ?? BASE_TRANSITION), delay }}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}
