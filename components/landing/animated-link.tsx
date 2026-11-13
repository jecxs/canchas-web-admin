"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type AnimatedLinkProps = {
  href: string;
  label: string;
};

export function AnimatedLink({ href, label }: AnimatedLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const link = linkRef.current;
      const track = trackRef.current;
      if (!link || !track || !contextSafe) return;

      const rollUp = contextSafe((yPercent: number) => {
        gsap.to(track, {
          yPercent,
          duration: 0.4,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      });

      const onMouseEnter = () => rollUp(-50);
      const onMouseLeave = () => rollUp(0);
      link.addEventListener("mouseenter", onMouseEnter);
      link.addEventListener("mouseleave", onMouseLeave);
      link.addEventListener("focus", onMouseEnter);
      link.addEventListener("blur", onMouseLeave);

      return () => {
        link.removeEventListener("mouseenter", onMouseEnter);
        link.removeEventListener("mouseleave", onMouseLeave);
        link.removeEventListener("focus", onMouseEnter);
        link.removeEventListener("blur", onMouseLeave);
      };
    },
    { scope: linkRef },
  );

  return (
    <Link
      ref={linkRef}
      href={href}
      className="relative inline-flex h-[1.5em] flex-col cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:underline"
    >
      <span ref={trackRef} className="flex shrink-0 flex-col">
        <span className="h-[1.5em] shrink-0 leading-[1.5em]">{label}</span>
        <span
          aria-hidden="true"
          className="h-[1.5em] shrink-0 leading-[1.5em] text-[#6E4BFF]"
        >
          {label}
        </span>
      </span>
    </Link>
  );
}
