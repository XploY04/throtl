import { motion } from "framer-motion";
import { STAGGER_PARENT } from "./ConstantAnimations";
import { Wifi, Zap, ShieldCheck } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

export function FeaturesSection() {
  return (
    <section
      className="relative px-6 py-32 bg-neutral-950 text-neutral-300 md:mt-36 overflow-hidden"
      aria-label="Features"
    >
      {/* Background gradient accent */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.04),transparent_70%)]" />

      <div className="max-w-7xl mx-auto text-center mb-24 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]"
        >
          Power that{" "}
          <span className="text-neutral-400">keeps your network fair.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-8 text-xl md:text-2xl text-neutral-500 max-w-3xl mx-auto leading-relaxed"
        >
          Throtl monitors, manages, and optimizes your bandwidth automatically —
          keeping every connection smooth and equitable.
        </motion.p>
      </div>

      {/* Feature Grid */}
      <motion.div
        variants={STAGGER_PARENT}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto relative z-10"
      >
        <FeatureCard
          icon={Wifi}
          title="Real-time Discovery"
          description="Instantly detect every device on your network with live scanning powered by adaptive polling."
        />
        <FeatureCard
          icon={Zap}
          title="Automatic Throttling"
          description="Pinpoint devices consuming too much bandwidth and dynamically limit their speeds to maintain balance."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Fairness Engine"
          description="Intelligent prioritization ensures critical traffic like calls and work apps stay smooth for everyone."
        />
      </motion.div>
    </section>
  );
}
