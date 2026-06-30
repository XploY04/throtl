import { motion } from "motion/react";
import { FADE_IN_UP, STAGGER_PARENT } from "./ConstantAnimations";
import { Users, WifiOff, ArrowRight } from "lucide-react";


export function ProblemSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={STAGGER_PARENT}
      className="py-24 md:my-16"
    >
      <div className="mx-auto max-w-4xl px-4 text-center">
        <motion.h2
          variants={FADE_IN_UP}
          className="text-3xl font-bold tracking-tight md:text-6xl"
        >
          Your WiFi shouldn't feel like a traffic jam.
        </motion.h2>
        <motion.p variants={FADE_IN_UP} className="mx-auto mt-4 max-w-2xl text-lg mb-16 text-neutral-400">
          That critical video call stutters while someone else's massive
          download consumes all the bandwidth. Monitoring tools show you the
          problem, but Throtl actually fixes it.
        </motion.p>
      </div>

      <motion.div
        variants={FADE_IN_UP}
        className="mx-auto mt-12 flex max-w-3xl items-center justify-between gap-1 px-4 md:gap-8"
      >
        <motion.div
          className=" group flex flex-1 flex-col items-center gap-3 rounded-sm bordershadow-[inset_0_1px_2px_rgba(225,225,225,0.15),_0_2px_4px_rgba(150,150,150,0.6)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_0_1px_1px_rgba(235,235,235,0.1)] transition-all duration-600 bg-neutral-900/50 p-6 text-center"
        >
          <Users className="h-8 w-8 text-neutral-400 group-hover:text-green-200 transition-colors duration-400" />
          <p className="font-semibold">Normal Users</p>
          <p className="text-xs text-neutral-500">Studying, Streaming, Working</p>
        </motion.div>
        
        <div className="flex flex-col items-center gap-3">
            <WifiOff className="h-6 w-6 text-neutral-400 hover:text-red-300 transition-color duration-300" />
            <ArrowRight className="h-8 w-8 text-neutral-700" />
        </div>

        <motion.div
          className="flex flex-1 flex-col items-center gap-3 rounded-sm bordershadow-[inset_0_1px_2px_rgba(123,27,27,0.35),_0_1px_1px_rgba(123,17,17,0.3)] hover:shadow-[inset_0_1px_2px_rgba(153,27,27,0.3),_0_1px_1px_rgba(123,27,27,0.3)] transition-all duration-600 bg-red-950/10 p-6 text-center "
        >
          <div className="font-mono text-2xl font-bold text-red-100">P2P</div>
          <p className="font-semibold text-red-200">The Bandwidth Hog</p>
          <p className="text-xs text-red-300">90% of Network Usage</p>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}