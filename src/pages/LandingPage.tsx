import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Wifi, Zap, ShieldCheck } from "lucide-react";
import AnimatedGrid from "../components/AnimatedGrid";

const FADE_IN_UP_VARIANT = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={FADE_IN_UP_VARIANT}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-6 border border-neutral-800 relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-sm w-fit">
          <Icon className="w-6 h-6 text-neutral-300" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-neutral-400">{description}</p>
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative overflow-hidden"
    >
      <section className="relative min-h-[60vh] flex items-center justify-center text-center px-4 py-20">
        <AnimatedGrid />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
            hidden: {},
          }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.h1
            variants={FADE_IN_UP_VARIANT}
            className="text-5xl md:text-7xl font-extrabold tracking-tighter"
          >
            Tame Your Network Chaos
          </motion.h1>
          <motion.p
            variants={FADE_IN_UP_VARIANT}
            className="mt-4 max-w-2xl text-lg text-neutral-400"
          >
            Throtl is a smart, active network manager that automatically finds
            and slows down bandwidth hogs, making the internet fair for
            everyone.
          </motion.p>
          <motion.div variants={FADE_IN_UP_VARIANT} className="mt-8">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 font-semibold text-neutral-950 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Wifi}
            title="Real-time Discovery"
            description="Automatically scan and identify every device connected to your local network."
          />
          <FeatureCard
            icon={Zap}
            title="Automatic Throttling"
            description="Pinpoint devices using unfair amounts of bandwidth and precisely throttle their speed."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Fairness Engine"
            description="Our smart policy ensures essential traffic is always prioritized, keeping the network usable for all."
          />
        </div>
      </section>
    </motion.div>
  );
}