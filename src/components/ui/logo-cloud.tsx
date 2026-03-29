import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

type LogoItem = {
  type: "img";
  src: string;
  alt: string;
} | {
  type: "text";
  label: string;
};

type LogoCloudProps = {
  title?: string;
  subtitle?: string;
  items: LogoItem[];
};

export function LogoCloud({
  title = "Integrado con las mejores plataformas",
  subtitle = "Trabajamos con las herramientas que el sector salud ya conoce y confía",
  items,
}: LogoCloudProps) {
  return (
    <div className="bg-background border-y border-border/30 py-10 px-4">
      {/* Header centrado */}
      <div className="text-center mb-7 space-y-1">
        <p className="text-xs text-muted-foreground tracking-wider uppercase">{subtitle}</p>
        <p className="text-base font-black text-foreground tracking-tight">{title}</p>
      </div>

      {/* Slider */}
      <div className="relative mx-auto max-w-5xl">
        <InfiniteSlider gap={56} speed={45} speedOnHover={20}>
          {items.map((item, i) =>
            item.type === "img" ? (
              <img
                key={i}
                src={item.src}
                alt={item.alt}
                height="auto"
                width="auto"
                loading="lazy"
                className="h-7 md:h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity select-none pointer-events-none dark:brightness-0 dark:invert"
              />
            ) : (
              <span
                key={i}
                className="text-sm font-bold text-muted-foreground/70 hover:text-foreground transition-colors whitespace-nowrap select-none"
              >
                {item.label}
              </span>
            )
          )}
        </InfiniteSlider>
        <ProgressiveBlur
          className="pointer-events-none absolute left-0 top-0 h-full w-24"
          direction="left"
          blurIntensity={0.9}
        />
        <ProgressiveBlur
          className="pointer-events-none absolute right-0 top-0 h-full w-24"
          direction="right"
          blurIntensity={0.9}
        />
      </div>
    </div>
  );
}
