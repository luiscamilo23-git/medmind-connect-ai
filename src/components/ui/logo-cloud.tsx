import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

type Logo = {
  src: string;
  alt: string;
};

type LogoCloudProps = {
  logos: Logo[];
  label?: string;
};

export function LogoCloud({ logos, label }: LogoCloudProps) {
  return (
    <div className="bg-background border-y border-border/30 py-5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          {label && (
            <div className="shrink-0 md:border-r md:pr-6 md:max-w-44">
              <p className="text-xs text-muted-foreground text-center md:text-right leading-snug">
                {label}
              </p>
            </div>
          )}
          <div className="relative w-full md:w-[calc(100%-11rem)]">
            <InfiniteSlider gap={56} speed={50} speedOnHover={20}>
              {logos.map((logo) => (
                <img
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  height="auto"
                  width="auto"
                  loading="lazy"
                  className="h-6 md:h-7 w-auto object-contain opacity-50 hover:opacity-90 transition-opacity select-none pointer-events-none dark:brightness-0 dark:invert"
                />
              ))}
            </InfiniteSlider>
            <ProgressiveBlur
              className="pointer-events-none absolute left-0 top-0 h-full w-20"
              direction="left"
              blurIntensity={0.8}
            />
            <ProgressiveBlur
              className="pointer-events-none absolute right-0 top-0 h-full w-20"
              direction="right"
              blurIntensity={0.8}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
