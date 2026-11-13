"use client";

import { useRef } from "react";
import Image from "next/image";
import { Link } from "next-view-transitions";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FilterHorizontalIcon,
  HistoryIcon,
  Location03Icon,
} from "@hugeicons/core-free-icons";

gsap.registerPlugin(useGSAP);

const features = [
  {
    icon: Location03Icon,
    title: "Mapa interactivo MapBox",
    description: "Encuentra canchas y locales cerca de ti.",
  },
  {
    icon: FilterHorizontalIcon,
    title: "Deportes y horarios",
    description: "Filtra opciones según cómo y cuándo quieres jugar.",
  },
  {
    icon: HistoryIcon,
    title: "Historial y perfil de jugador",
    description: "Consulta tus reservas y mantén tus datos al día.",
  },
];

type MockupColumnProps = {
  images: string[];
  direction: "up" | "down";
  speed: number;
};

function MockupColumn({ images, direction, speed }: MockupColumnProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!trackRef.current || images.length === 0) return;

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          trackRef.current,
          { yPercent: direction === "up" ? 0 : -50 },
          {
            yPercent: direction === "up" ? -50 : 0,
            duration: speed,
            ease: "none",
            repeat: -1,
            force3D: true,
          },
        );
      });

      return () => media.revert();
    },
    { scope: trackRef },
  );

  return (
    <div className="min-w-0 flex-1 overflow-hidden">
      <div
        ref={trackRef}
        className="flex flex-col gap-3 pb-3 sm:gap-4 sm:pb-4 will-change-transform"
      >
        {[...images, ...images].map((src, index) => {
          const isLoginImage = src.includes("phone-loginGrassly.png");

          return (
            <div
              key={`${src}-${index}`}
              className="relative w-full shrink-0 overflow-hidden"
            >
              <Image
                src={src}
                alt="App mockup"
                width={400}
                height={800}
                priority
                sizes="(min-width: 1024px) 18vw, 36vw"
                className="w-full h-auto object-contain shadow-2xl rounded-[15%]"
                style={{
                  viewTransitionName:
                    src.includes("loginGrassly") && index < images.length
                      ? "app-hero-image"
                      : "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AppShowcase() {
  return (
    <section
      id="app-movil"
      className="relative isolate overflow-hidden bg-[#151c16] px-5 py-24 text-white sm:px-8 lg:px-8 lg:py-32"
    >
      <div className="relative mx-auto grid h-auto max-w-7xl grid-cols-1 gap-12 overflow-visible lg:h-[80vh] lg:grid-cols-2 lg:overflow-hidden">
        <div className="relative z-10 flex h-fit flex-col justify-center lg:sticky lg:top-1/2 lg:-translate-y-1/2">
          <h2 className="max-w-xl text-balance font-display text-4xl font-black leading-[.98] tracking-[-.035em] sm:text-5xl lg:text-6xl">
            Reserva y gestiona en{" "}
            <span className="text-[#D7FF38]">segundos</span>
          </h2>

          <div className="mt-8 grid gap-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group flex items-start gap-4 rounded-2xl p-4 transition-colors duration-300 hover:bg-[#17201A]"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 text-[#D7FF38] transition-colors duration-300 group-hover:border-[#6E4BFF]/30">
                  <HugeiconsIcon
                    icon={feature.icon}
                    strokeWidth={1.8}
                    className="size-5"
                  />
                </span>
                <span className="pt-1">
                  <span className="block text-base font-bold text-white transition-colors duration-300 group-hover:text-[#6E4BFF]">
                    {feature.title}
                  </span>
                  <span className="mt-1 block max-w-md text-sm leading-6 text-white/60">
                    {feature.description}
                  </span>
                </span>
              </article>
            ))}
          </div>

          <Link
            href="/app-detalles"
            className="mt-6 inline-flex w-fit items-center justify-center rounded-full bg-[#D7FF38] px-8 py-3 text-sm font-extrabold text-[#151c16] transition duration-300 hover:scale-[1.02] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF38] focus-visible:ring-offset-4 focus-visible:ring-offset-[#151c16] sm:px-6"
          >
            Descubrir la App
          </Link>
        </div>

        <div
          aria-hidden="true"
          className="mask-image-vertical-fade relative mt-0 flex h-[70svh] min-h-[420px] max-h-[640px] gap-3 overflow-hidden lg:-mt-[25vh] lg:h-[150vh] lg:max-h-none lg:gap-4"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
          }}
        >
          <MockupColumn
            images={[
              "/imagesApp/phone-homeGrassly.png",
              "/imagesApp/phone-mapaApp.png",
              "/imagesApp/phone-horarioApp.png",
              "/imagesApp/phone-comprobanteApp.png",
            ]}
            direction="up"
            speed={38}
          />
          <MockupColumn
            images={[
              "/imagesApp/phone-loginGrassly.png",
              "/imagesApp/phone-mapaApp2.png",
              "/imagesApp/phone-pasarelaPagoApp.png",
              "/imagesApp/phone-perfilGrassly.png",
            ]}
            direction="down"
            speed={46}
          />
          <MockupColumn
            images={[
              "/imagesApp/phone-canchaApp.png",
              "/imagesApp/phone-mapaApp3.png",
              "/imagesApp/phone-notificacionesApp.png",
              "/imagesApp/phone-historialReservasApp.png",
            ]}
            direction="up"
            speed={42}
          />
        </div>
      </div>
    </section>
  );
}
