"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type ButterflyProps = { className?: string; variant?: "rose" | "sage" };

function Butterfly({ className, variant = "rose" }: ButterflyProps) {
  const wingColor = variant === "rose" ? "#c88983" : "#98a48d";
  const wingLight = variant === "rose" ? "#e6c0b5" : "#cbd2c1";

  return <svg className={cn("overflow-visible", className)} viewBox="0 0 72 64" fill="none" aria-hidden="true" focusable="false">
    <g className="butterfly-wing-left">
      <path d="M35 31C26 8 10 9 9 20c-1 7 5 12 12 15C7 30 3 41 10 47c7 6 18 0 25-8Z" fill={wingColor} fillOpacity=".86" stroke="#886d64" strokeOpacity=".62" strokeWidth="1.2" />
      <path d="M34 37c-15-7-25-2-23 7 2 8 15 8 25 1" fill={wingLight} fillOpacity=".82" />
      <circle cx="18" cy="23" r="2" fill="#fffaf5" fillOpacity=".8" />
    </g>
    <g className="butterfly-wing-right">
      <path d="M37 31C46 8 62 9 63 20c1 7-5 12-12 15 14-5 18 6 11 12-7 6-18 0-25-8Z" fill={wingColor} fillOpacity=".86" stroke="#886d64" strokeOpacity=".62" strokeWidth="1.2" />
      <path d="M38 37c15-7 25-2 23 7-2 8-15 8-25 1" fill={wingLight} fillOpacity=".82" />
      <circle cx="54" cy="23" r="2" fill="#fffaf5" fillOpacity=".8" />
    </g>
    <path d="M35.5 28c-2 7-2 13 0 19m1-19c2 7 2 13 0 19m-1-19c-3-7-7-9-11-9m13 9c3-7 7-9 11-9" stroke="#6d5752" strokeLinecap="round" strokeWidth="1.5" />
    <ellipse cx="36" cy="36" rx="2.4" ry="7" fill="#725a54" />
  </svg>;
}

export function ScrollButterflies() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const firstX = useTransform(scrollYProgress, [0, .22, .48, .74, 1], [0, 44, -20, 36, 0]);
  const firstY = useTransform(scrollYProgress, [0, .22, .48, .74, 1], [0, 46, -22, 40, 0]);
  const firstRotate = useTransform(scrollYProgress, [0, .22, .48, .74, 1], [-4, 9, -7, 8, -2]);
  const secondX = useTransform(scrollYProgress, [0, .25, .52, .78, 1], [0, -34, 20, -42, 0]);
  const secondY = useTransform(scrollYProgress, [0, .25, .52, .78, 1], [0, -24, 38, -32, 0]);
  const secondRotate = useTransform(scrollYProgress, [0, .25, .52, .78, 1], [4, -8, 6, -7, 1]);
  const thirdX = useTransform(scrollYProgress, [0, .3, .6, 1], [0, 28, -28, 0]);
  const thirdY = useTransform(scrollYProgress, [0, .3, .6, 1], [0, 32, -26, 0]);
  const thirdRotate = useTransform(scrollYProgress, [0, .3, .6, 1], [-5, 7, -8, 2]);

  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
    <motion.div className="absolute left-[7%] top-[28%]" style={{ x: reducedMotion ? 0 : firstX, y: reducedMotion ? 0 : firstY, rotate: reducedMotion ? 0 : firstRotate }}><Butterfly className="butterfly h-9 w-9 sm:h-12 sm:w-12" variant="rose" /></motion.div>
    <motion.div className="absolute right-[9%] top-[62%] hidden sm:block" style={{ x: reducedMotion ? 0 : secondX, y: reducedMotion ? 0 : secondY, rotate: reducedMotion ? 0 : secondRotate }}><Butterfly className="butterfly h-11 w-11" variant="sage" /></motion.div>
    <motion.div className="absolute right-[25%] top-[18%] hidden md:block" style={{ x: reducedMotion ? 0 : thirdX, y: reducedMotion ? 0 : thirdY, rotate: reducedMotion ? 0 : thirdRotate }}><Butterfly className="butterfly h-8 w-8" variant="rose" /></motion.div>
  </div>;
}
