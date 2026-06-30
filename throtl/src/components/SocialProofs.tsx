import { motion } from "motion/react";
import { FADE_IN_UP } from "./ConstantAnimations";

export function SocialProofSection() {
  const quotes = [
    { name: "Riya S.", role: "IT Lead", text: "Throtl reduced peak congestion by 40% in our office — zero config." },
    { name: "Omar K.", role: "SRE", text: "Lightweight agent, massive impact. Super impressed with the fairness engine." },
  ];

  return (
    <section className="px-6 py-34 bg-neutral-950/40" aria-label="Testimonials">
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