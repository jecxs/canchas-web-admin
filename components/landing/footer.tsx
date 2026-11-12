"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AnimatedLink } from "./animated-link";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const productLinks = [
  { href: "/registro", label: "Registrar mi local" },
  { href: "/#precio", label: "Precios y Planes" },
  { href: "/registro", label: "Iniciar Sesión" },
  { href: "/#app-movil", label: "App para Jugadores" },
];

const legalLinks = [
  { href: "/terminos", label: "Términos y Condiciones" },
  { href: "/privacidad", label: "Políticas de Privacidad" },
];

function ContactIcon({ kind }: { kind: "email" | "chat" | "book" }) {
  if (kind === "email") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4 shrink-0"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="m4 7 8 6 8-6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "chat") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-4 shrink-0"
      >
        <path
          d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6a7.5 7.5 0 1 1 17-3.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 11h8M8 14h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-4 shrink-0"
    >
      <path
        d="M4 5.5c2.6-.9 5.3-.6 8 1v13c-2.7-1.6-5.4-1.9-8-1v-13ZM20 5.5c-2.6-.9-5.3-.6-8 1v13c2.7-1.6 5.4-1.9 8-1v-13Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7 9h2M7 12h2M15 9h2M15 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const footer = footerRef.current;
      if (!footer) return;

      const reels = footer.querySelectorAll<HTMLElement>("[data-logo-reel]");
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          reels,
          { yPercent: -75 },
          {
            yPercent: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: footer,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      return () => media.revert();
    },
    { scope: footerRef },
  );

  return (
    <footer
      ref={footerRef}
      className="border-t-4 border-[#D7FF38] bg-[#151c16] px-5 pt-16 pb-8 text-gray-300 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-3">
        <div>
          <Link href="/" aria-label="Grassly, inicio" className="inline-block">
            <div className="mb-6 flex items-center">
              <Image
                src="/iconGrasslysinFondo.png"
                alt="Grassly Logo"
                width={64}
                height={64}
                className="h-16 w-16 object-contain relative z-10"
              />
              <div className="-ml-1 relative z-0 flex items-baseline whitespace-nowrap text-white font-bold text-4xl">
                <span>G</span>
                <span>r</span>
                <span
                  className="inline-flex flex-col h-[1em] overflow-hidden leading-none"
                  style={{ width: "0.56em" }}
                >
                  <span
                    data-logo-reel
                    aria-hidden="true"
                    className="flex flex-col leading-none"
                  >
                    {["a", "@", "X", "7"].map((character, index) => (
                      <span
                        key={index}
                        className="flex h-[1em] w-full shrink-0 items-center justify-center leading-[1em]"
                      >
                        {character}
                      </span>
                    ))}
                  </span>
                  <span className="sr-only">a</span>
                </span>
                <span>s</span>
                <span>s</span>
                <span
                  className="inline-flex flex-col h-[1em] overflow-hidden leading-none"
                  style={{ width: "0.28em" }}
                >
                  <span
                    data-logo-reel
                    aria-hidden="true"
                    className="flex flex-col leading-none"
                  >
                    {["l", "#", "Z", "8"].map((character, index) => (
                      <span
                        key={index}
                        className="flex h-[1em] w-full shrink-0 items-center justify-center leading-[1em]"
                      >
                        {character}
                      </span>
                    ))}
                  </span>
                  <span className="sr-only">l</span>
                </span>
                <span>y</span>
              </div>
            </div>
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-6 text-gray-400">
            El sistema operativo diseñado para gestionar, optimizar y aumentar
            los ingresos de tus complejos deportivos de césped sintético.
          </p>

          <div className="mt-8 flex flex-col items-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Desarrollado por:
            </span>
            <a
              href="https://lexovate.com.pe"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar Lexovate (abre en una pestaña nueva)"
              className="group inline-flex cursor-pointer items-center gap-2 opacity-80 transition-opacity hover:opacity-100"
            >
              <Image
                src="/lexovateBlanco.png"
                alt="Lexovate"
                width={200}
                height={40}
                className="h-8 w-auto object-contain object-left transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </a>
          </div>
        </div>

        <nav aria-label="Producto">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#D7FF38]">
            Producto
          </h2>
          <ul className="mt-5 space-y-3 text-sm">
            {productLinks.map((item) => (
              <li key={item.label}>
                <AnimatedLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#D7FF38]">
            Soporte
          </h2>
          <ul className="mt-5 space-y-4 text-sm">
            <li>
              <a
                href="mailto:soporte@grassly.pe"
                className="inline-flex items-center gap-3 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline"
              >
                <ContactIcon kind="email" />
                soporte@grassly.pe
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/51999999999?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20Grassly."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline"
              >
                <ContactIcon kind="chat" />
                WhatsApp Ventas
              </a>
            </li>
          </ul>
          <p className="mt-5 text-xs leading-5 text-gray-400">
            Atención: Lunes a Sábado | 9:00 AM - 7:00 PM
          </p>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col-reverse gap-5 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
        <p className="text-xs leading-5 text-gray-400">
          © 2026 Grassly · Ayacucho, Perú. Todos los derechos reservados.
        </p>
        <nav aria-label="Información legal">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-gray-400">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <AnimatedLink href={item.href} label={item.label} />
              </li>
            ))}
            <li>
              <Link
                href="/libro-de-reclamaciones"
                className="inline-flex items-center gap-2 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline"
              >
                <ContactIcon kind="book" />
                Libro de Reclamaciones
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
