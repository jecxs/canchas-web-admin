"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const sections = [
  {
    image: '/imagesApp/phone-loginGrassly.png',
    alt: 'Inicia sesión en Grassly',
    subtitle: '— EL JUEGO EMPIEZA CONTIGO',
    navLabel: 'Bienvenida',
    title: (
      <>
        Bienvenido a <br/><span className="text-[#D7FF38]">Grassly.</span>
      </>
    ),
    description:
      'Ingresa rápidamente a tu cuenta para empezar a explorar y reservar las mejores canchas cerca de ti.',
  },
  {
    image: "/imagesApp/phone-mapaApp2.png",
    alt: "Mapa interactivo de Grassly",
    subtitle: '— MÁS CERCA DE TU PRÓXIMO PARTIDO',
    navLabel: 'Encuentra tu cancha',
    title: (
      <>
        Encuentra tu <br/><span className="text-[#D7FF38]">cancha ideal.</span>
      </>
    ),
    description:
      "Explora el mapa interactivo de MapBox en tiempo real, filtra por deportes y encuentra complejos deportivos cerca de ti.",
  },
  {
    image: "/imagesApp/phone-canchaApp.png",
    alt: "Detalles de una cancha",
    subtitle: '— TRANSPARENCIA TOTAL',
    navLabel: 'Detalles del local',
    title: <>Conoce cada <br/><span className="text-[#D7FF38]">detalle.</span></>,
    description:
      "Revisa fotos, comodidades como Wi-Fi y estacionamiento, y el tipo de grass antes de separar tu turno.",
  },
  {
    image: "/imagesApp/phone-horarioApp.png",
    alt: "Horarios disponibles",
    subtitle: '— SIN LLAMADAS NI ESPERAS',
    navLabel: 'Horarios',
    title: <>Elige tu horario <br/><span className="text-[#D7FF38]">al instante.</span></>,
    description:
      "Consulta los turnos disponibles y sus precios para encontrar el horario que mejor se adapta a tu partido.",
  },
  {
    image: "/imagesApp/phone-pasarelaPagoApp.png",
    alt: "Opciones para pagar",
    subtitle: '— PAGOS SEGUROS',
    navLabel: 'Pago rápido',
    title: (
      <>
        Reserva y paga <br/>en <span className="text-[#D7FF38]">3 toques.</span>
      </>
    ),
    description:
      "Elige tu horario y asegura tu cancha rápidamente subiendo tu comprobante de Yape o Plin directo desde la app.",
  },
  {
    image: "/imagesApp/phone-perfilGrassly.png",
    alt: "Perfil de jugador",
    subtitle: '— TU HISTORIAL DEPORTIVO',
    navLabel: 'Tu perfil',
    title: <>Tu agenda <br/><span className="text-[#D7FF38]">siempre en orden.</span></>,
    description:
      "Accede a tu perfil para revisar tus reservas próximas, tu historial de partidos jugados y tus locales favoritos.",
  },
];

const backdropPositions = [
  { x: -230, y: -54, rotation: -10, scale: 0.58 },
  { x: 230, y: 54, rotation: 10, scale: 0.58 },
];

export function AppDetallesScrolly() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsFooterRef = useRef<HTMLElement>(null);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    window.scrollTo({top: 0, left: 0, behavior: "instant"});

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "bottom bottom",
        onEnter: () => gsap.to(stepsFooterRef.current, { autoAlpha: 0, duration: 0.2, overwrite: true }),
        onLeaveBack: () => gsap.to(stepsFooterRef.current, { autoAlpha: 1, duration: 0.2, overwrite: true }),
      });

      imagesRef.current.forEach((img, i) => {
        if (!img) return;
        if (i === 0) {
          gsap.set(img, { scale: 1, x: 0, y: 0, rotation: 0, opacity: 1, filter: "blur(0px)", zIndex: 50 });
        } else {
          const backdrop = backdropPositions[(i - 1) % backdropPositions.length];
          gsap.set(img, {
            ...backdrop,
            opacity: i <= 2 ? 0.72 : 0,
            filter: "blur(2px)",
            zIndex: 20 - i,
          });
        }
      });

      textRefs.current.forEach((textEl, i) => {
        if (!textEl) return;
        
        ScrollTrigger.create({
          trigger: `#section-${i}`,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveIndex(i),
          onEnterBack: () => setActiveIndex(i),
        });

        const textTl = gsap.timeline({
          scrollTrigger: {
            trigger: `#section-${i}`,
            start: "top 75%",
            end: "bottom 25%",
            scrub: true,
          },
        });

        textTl
          .fromTo(textEl, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" })
          .to(textEl, { opacity: 1, y: 0, duration: 4 }) // El 4 hace que espere quieto mucho más tiempo
          .to(textEl, { opacity: 0, y: -50, duration: 1, ease: "power2.in" });
      });

      sections.forEach((_, i) => {
        if (i === sections.length - 1) return; 

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: `#section-${i}`,
            start: "center center",
            end: "bottom center",
            scrub: true,
          },
        });

        tl.to(imagesRef.current[i], {
          scale: 1.8, opacity: 0, filter: "blur(12px)", ease: "power1.inOut"
        }, 0);

        tl.to(imagesRef.current[i + 1], {
          scale: 1, x: 0, y: 0, rotation: 0, opacity: 1, filter: "blur(0px)", zIndex: 50, ease: "power1.inOut"
        }, 0);

        for (let j = i + 2; j < sections.length; j++) {
          const img = imagesRef.current[j];
          if (!img) continue;

          if (j <= i + 3) {
            const backdrop = backdropPositions[(j - 1) % backdropPositions.length];
            tl.to(img, {
              ...backdrop,
              opacity: 0.72,
              filter: "blur(2px)",
              zIndex: 20 - j,
              ease: "power1.inOut",
            }, 0);
          } else {
            tl.to(img, { opacity: 0, ease: "power1.inOut" }, 0);
          }
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={containerRef} className="relative bg-[#0B0E0C] text-white selection:bg-[#D7FF38] selection:text-black">
      
      <header className="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-8 py-8 mix-blend-difference sm:px-12">
        <div className="font-display text-2xl font-black lowercase tracking-tighter text-white">
          grassly
        </div>
        <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 sm:text-[10px]">
          <span className="size-1.5 rounded-full bg-[#D7FF38]"></span>
          Tu próximo partido empieza aquí
        </div>
      </header>

      <footer ref={stepsFooterRef} className="fixed bottom-0 left-0 z-50 hidden w-full items-end justify-between px-12 py-8 mix-blend-difference lg:flex">
        <div className="grid w-[72vw] max-w-[920px] grid-cols-6 gap-x-4 xl:gap-x-6">
          {sections.map((section, idx) => (
            <div key={idx} className={`flex flex-col gap-3 transition-opacity duration-500 ${activeIndex === idx ? "opacity-100" : "opacity-40"}`}>
              <div className="flex items-start gap-2 text-[10px] font-bold uppercase tracking-[0.08em]">
                <span>0{idx + 1}</span>
                <span>{section.navLabel}</span>
              </div>
              <div className={`h-[2px] bg-[#D7FF38] transition-all duration-500 ${activeIndex === idx ? "w-full" : "w-0"}`}></div>
            </div>
          ))}
        </div>
        <div className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 xl:block">
          Nos vemos en la cancha.
        </div>
      </footer>

      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-6 sm:px-12 lg:grid-cols-2 lg:gap-16">
        
        <div className="relative z-10 pt-20 lg:pt-0">
          {sections.map((section, index) => (
            <section
              key={index}
              id={`section-${index}`}
              className="flex min-h-svh flex-col justify-center pb-40 pt-20 lg:pb-56"
            >
              <div ref={(el) => { textRefs.current[index] = el; }} className="max-w-xl will-change-transform" style={{ opacity: 0 }}>
                
                <div className="mb-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D7FF38]">
                  {section.subtitle}
                </div>
                
                <h2 className="font-display text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[72px]">
                  {section.title}
                </h2>
                
                <p className="mt-6 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
                  {section.description}
                </p>
                
                <span aria-hidden="true" className="mt-8 block h-1 w-12 bg-[#D7FF38]" />
              </div>

              <div className="relative mx-auto mt-12 w-[min(75vw,300px)] lg:hidden">
                <div className="relative aspect-9/16 overflow-hidden rounded-[2.5rem] bg-[#0B0D0B] shadow-2xl ring-1 ring-white/10">
                  <Image src={section.image} alt={section.alt} fill sizes="(min-width: 640px) 320px, 280px" className="object-contain" />
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="sticky top-0 z-0 hidden h-[100svh] items-center justify-center lg:flex">
          <div className="relative flex h-full w-full items-center justify-center">
            
            <div className="absolute h-[500px] w-[300px] rounded-full bg-[#18251B] opacity-40 blur-[100px]" />
            
            <div className="relative z-10 mx-auto h-[75svh] max-h-[800px] w-full max-w-md perspective-[1200px]">
              {sections.map((section, index) => (
                <div
                  key={index}
                  ref={(el) => { imagesRef.current[index] = el; }}
                  className="absolute inset-0 flex items-center justify-center will-change-transform"
                  style={{
                    opacity: index === 0 ? 1 : 0, 
                    viewTransitionName: index === 0 ? "app-hero-image" : "none",
                  }}
                >
                  <Image
                    src={section.image}
                    alt={section.alt}
                    fill
                    sizes="(min-width: 1024px) 450px, 100vw"
                    priority={index === 0}
                    className="object-contain drop-shadow-[0_0px_40px_rgba(215,255,56,0.1)]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}