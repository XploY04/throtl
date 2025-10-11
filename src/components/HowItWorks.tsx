import { motion } from "motion/react";
import { FADE_IN_UP } from "./ConstantAnimations";


export function HowItWorksSection() {
  return (
    <section className="px-6 py-20" aria-label="How it works">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <motion.div variants={FADE_IN_UP} initial="hidden" whileInView="visible" className="rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-6 border border-neutral-800">
          <h3 className="text-xl font-semibold">How Throtl works</h3>
          <ol className="mt-4 space-y-4 text-sm text-neutral-400">
            <li>
              <strong className="text-neutral-100">Discover</strong> — continuous local scans map connected devices and flows.
            </li>
            <li>
              <strong className="text-neutral-100">Detect</strong> — lightweight analytics spot bandwidth anomalies in real time.
            </li>
            <li>
              <strong className="text-neutral-100">Act</strong> — policies throttle only the offending traffic, preserving important services.
            </li>
          </ol>
        </motion.div>

        <motion.div variants={FADE_IN_UP} initial="hidden" whileInView="visible" className="rounded-sm bg-neutral-900/30 p-6 border border-neutral-800">
          <div className="h-64 flex items-center justify-center text-neutral-500">Animated diagram / flow (placeholder)</div>
        </motion.div>
      </div>
    </section>
  );
}