// Filename: src/pages/AboutPage.tsx

import { motion } from "framer-motion";
import { Cpu, Layers, Zap } from "lucide-react";

// Animation variants for staggered fade-in effect
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
    },
  }),
};

// A helper component for each step in the "How It Works" section
function HowItWorksStep({ icon: Icon, title, children, index }: { icon: React.ElementType, title: string, children: React.ReactNode, index: number }) {
  return (
    <motion.div
      className="flex flex-col md:flex-row items-start gap-6"
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={sectionVariants}
    >
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm">
        <Icon className="w-8 h-8 text-neutral-300" />
      </div>
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-neutral-400 leading-relaxed">{children}</p>
      </div>
    </motion.div>
  );
}

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter">
          Your Network, But Fair.
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-neutral-400">
          Throtl is a smart network manager built to solve one of the most common frustrations in any shared space: the dreaded "bandwidth hog."
        </p>
      </motion.header>

      <div className="my-20 h-px w-full bg-neutral-800" />

      <section className="space-y-12">
        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
        >
          <h2 className="text-3xl font-bold text-center">The Problem We Solve</h2>
          <p className="mt-4 text-center text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            We've all been there. It's the night before a deadline, you're trying to stream a lecture, but the WiFi is unusably slow. Why? Because someone in the next room is torrenting a massive file, consuming 90% of the bandwidth. Existing tools can show you this is happening, but they don't fix it. The problem isn't a lack of data; it's a lack of fairness and control.
          </p>
        </motion.div>

        <div className="my-20 h-px w-full bg-neutral-800" />

        <div className="text-center">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-2 text-neutral-500">A simple, powerful, three-step process.</p>
        </div>

        <div className="mt-12 space-y-12">
          <HowItWorksStep icon={Layers} title="1. Discover & Analyze" index={2}>
            Our core engine runs on a designated device (like a laptop or Raspberry Pi) that acts as the network gateway. It uses packet analysis with **Scapy** to passively and continuously monitor all traffic, identifying every connected device and calculating their real-time bandwidth consumption.
          </HowItWorksStep>

          <HowItWorksStep icon={Cpu} title="2. Identify & Decide" index={3}>
            The engine compares each device's usage against a predefined threshold. If a device exceeds this threshold for a sustained period, our system identifies it as a "bandwidth hog." This logic prevents false positives from short bursts of activity, targeting only genuine network abuse.
          </HowItWorksStep>

          <HowItWorksStep icon={Zap} title="3. Act & Restore" index={4}>
            Once an offender is identified, Throtl automatically applies a precise traffic shaping rule using Linux **Traffic Control (`tc`)**. This instantly throttles the specific device's bandwidth, freeing up capacity for everyone else. The process is immediate, automated, and restores fairness to the entire network without disconnecting the user.
          </HowItWorksStep>
        </div>
      </section>

      <div className="my-20 h-px w-full bg-neutral-800" />

      <motion.section
        custom={5}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        className="text-center"
      >
        <h2 className="text-3xl font-bold">The Technology Stack</h2>
        <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
          Throtl is built with a modern, real-time stack to ensure performance and reliability.
        </p>
        <div className="mt-8 flex justify-center gap-4 flex-wrap font-mono">
            <span className="bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-1">Python</span>
            <span className="bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-1">Scapy</span>
            <span className="bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-1">Redis</span>
            <span className="bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-1">FastAPI</span>
            <span className="bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-1">WebSockets</span>
            <span className="bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-1">React</span>
            <span className="bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-1">TypeScript</span>
            <span className="bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-1">Tailwind CSS</span>
        </div>
      </motion.section>
    </div>
  );
}