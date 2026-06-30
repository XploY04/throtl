import { motion } from "motion/react";
import { FADE_IN_UP } from "./ConstantAnimations";

export function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <motion.article
      variants={FADE_IN_UP}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      whileHover={{  }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="rounded-sm  p-6  relative overflow-hidden shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),_0_2px_4px_rgba(0,0,0,0.6)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_0_2px_1px_rgba(235,235,235,0.1)] transition-all duration-600"
    >
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-20 h-10 rounded-sm bg-neutral-950 flex items-center justify-center ">
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