import { useCallback, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

const options: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    number: {
      value: 80,
      density: { enable: true, width: 1920, height: 1080 },
    },
    color: { value: "#3ca2fa" },
    links: {
      enable: true,
      color: "#3ca2fa",
      distance: 140,
      opacity: 0.15,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.6,
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
    opacity: {
      value: { min: 0.1, max: 0.4 },
      animation: { enable: true, speed: 0.8, sync: false },
    },
    shape: { type: "circle" },
    size: {
      value: { min: 1, max: 2.5 },
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
      resize: { enable: true },
    },
    modes: {
      grab: { distance: 160, links: { opacity: 0.35 } },
    },
  },
  detectRetina: true,
};

export default function ParticlesBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const onLoaded = useCallback((_container?: Container) => {}, []);

  if (!ready) return null;

  return (
    <Particles
      id="hero-particles"
      className="absolute inset-0 w-full h-full"
      options={options}
      particlesLoaded={onLoaded}
    />
  );
}
