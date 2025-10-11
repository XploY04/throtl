import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Wifi, Zap, ShieldCheck, } from "lucide-react";
import AnimatedGrid from "../components/AnimatedGrid";


const FADE_IN_UP = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const STAGGER_PARENT = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};


export function CTAButton({ children, to = "/dashboard" }: { children: React.ReactNode; to?: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-3 rounded-sm bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-700 text-neutral-100 px-6 py-3 font-semibold shadow-[0_8px_28px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:scale-105"
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

export function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <motion.article
      variants={FADE_IN_UP}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      whileHover={{ scale: 1.03, y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-6 border border-neutral-800 relative overflow-hidden"
    >
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-11 h-11 rounded-sm bg-neutral-950 border border-neutral-800 flex items-center justify-center">
          <Icon className="w-5 h-5 text-neutral-300" />
        </div>
        <div>
          <h4 className="text-lg font-semibold">{title}</h4>
          <p className="mt-2 text-sm text-neutral-400">{description}</p>
        </div>
      </div>
    </motion.article>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-neutral-900/40 p-3 border border-neutral-800 text-sm">
      <div className="text-neutral-400 text-xs">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[70vh] flex items-center" aria-label="Hero">
      <AnimatedGrid />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={STAGGER_PARENT}
        className="relative z-10 max-w-6xl mx-auto w-full text-center px-6"
      >
        <motion.h1 variants={FADE_IN_UP} className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Tame your network chaos <br/> automatically.
        </motion.h1>
        <motion.p variants={FADE_IN_UP} className="mt-4 max-w-2xl mx-auto text-lg text-neutral-400">
          Throtl finds devices hogging bandwidth, applies precise policies, and keeps critical traffic flowing. Low overhead — big impact.
        </motion.p>

        <motion.div variants={FADE_IN_UP} className="mt-8 flex items-center justify-center gap-4">
          <CTAButton>Get started — free trial</CTAButton>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 rounded-sm bg-neutral-800/50 px-4 py-2 border border-neutral-800 text-neutral-200 text-sm transition-transform duration-200 hover:scale-102"
          >
            Live demo
          </Link>
        </motion.div>

        <motion.div variants={FADE_IN_UP} className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
          <Stat label="Active" value="18" />
          <Stat label="Throughput" value="1.2 Gbps" />
          <Stat label="Hogs" value="2" />
          <Stat label="Alerts" value="5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="px-6 py-24" aria-label="Features">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={STAGGER_PARENT} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon={Wifi} title="Real-time Discovery" description="Automatically scan and identify every device connected to your local network." />
          <FeatureCard icon={Zap} title="Automatic Throttling" description="Pinpoint devices using unfair amounts of bandwidth and precisely throttle their speed." />
          <FeatureCard icon={ShieldCheck} title="Fairness Engine" description="Smart policies that prioritize essential services while keeping everyone online." />
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
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

function SocialProofSection() {
  const quotes = [
    { name: "Riya S.", role: "IT Lead", text: "Throtl reduced peak congestion by 40% in our office — zero config." },
    { name: "Omar K.", role: "SRE", text: "Lightweight agent, massive impact. Super impressed with the fairness engine." },
  ];

  return (
    <section className="px-6 py-20 bg-neutral-950/40" aria-label="Testimonials">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-center text-2xl font-semibold">Trusted by teams who need reliable networks</h3>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {quotes.map((q, i) => (
            <motion.blockquote key={i} variants={FADE_IN_UP} initial="hidden" whileInView="visible" className="rounded-sm p-6 border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-900/40">
              <div className="text-sm text-neutral-400">{q.text}</div>
              <div className="mt-4 text-sm font-semibold">{q.name} <span className="text-neutral-400 font-normal">— {q.role}</span></div>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-6 py-24" aria-label="Call to action">
      <div className="max-w-4xl mx-auto rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-8 border border-neutral-800 text-center">
        <h3 className="text-2xl font-semibold">Ready to take back control of your network?</h3>
        <p className="mt-3 text-neutral-400">Start a trial and let Throtl automatically manage bandwidth fairness — no manual policing required.</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <CTAButton>Start free trial</CTAButton>
          <Link className="text-sm px-3 py-2 rounded-sm bg-neutral-800/50 border border-neutral-800 text-neutral-200" to="/contact">Contact sales</Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-8 text-sm text-neutral-400">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>© {new Date().getFullYear()} Throtl</div>
        <div className="flex items-center gap-4">
          <a className="hover:underline" href="#">Privacy</a>
          <a className="hover:underline" href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden text-neutral-100 bg-neutral-950">
      <HeroSection />
      <div className="max-w-7xl mx-auto">
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <CTASection />
      </div>
      <Footer />
    </motion.main>
  );
}
