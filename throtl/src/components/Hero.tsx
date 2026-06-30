import { motion } from "motion/react";
import AnimatedGrid from "./AnimatedGrid";
import { CTAButton } from "./CTAButton";
import { STAGGER_PARENT, FADE_IN_UP } from "./ConstantAnimations";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[70vh] mt-16 flex items-center" aria-label="Hero">
      <AnimatedGrid />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={STAGGER_PARENT}
        className="relative z-10 max-w-6xl mx-auto w-full text-center px-6"
      >
        <motion.h1 
          variants={FADE_IN_UP} 
          // Mobile: text-4xl, Desktop: text-7xl
          className="text-4xl md:text-7xl font-extrabold tracking-tight"
        >
          Tame your network chaos <br/> 
          {/* Mobile: text-6xl, Desktop: text-8xl */}
          <span className="parisienne-regular text-6xl md:text-8xl"> automatically</span>
          <span className="text-neutral-600">.</span>
        </motion.h1>
        
        <motion.p 
          variants={FADE_IN_UP} 
          // Mobile: text-lg, Desktop: text-xl
          className="mt-6 max-w-2xl mx-auto text-lg text-neutral-400 md:text-xl"
        >
          Throtl finds devices hogging bandwidth, applies precise policies, and keeps critical traffic flowing. Low overhead — big impact.
        </motion.p>

        <motion.div 
          variants={FADE_IN_UP} 
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <CTAButton>Get started</CTAButton>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 rounded-sm bg-neutral-800/50 px-4 py-2 border border-neutral-800 text-neutral-200 text-sm transition-transform duration-200 hover:scale-102"
          >
            Live demo
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}