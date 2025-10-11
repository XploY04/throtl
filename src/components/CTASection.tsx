import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo, useRef } from "react";

const CTAButton = ({ children }: { children: React.ReactNode }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="rounded-sm bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-300"
  >
    {children}
  </motion.button>
);

function CTAGridBackground() {
  const cols = 16;
  const rows = 8;
  const total = cols * rows;
  const density = 0.15;

  const neutralPalette = ["#374151", "#1f2937", "#111827", "#030712"];

  const seedRef = useRef(Math.random());
  const rnd = (n = 1) => {
    seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
    return (seedRef.current / 233280) * n;
  };

  const activeIndices = useMemo(() => {
    const count = Math.max(2, Math.floor(total * density));
    const set = new Set<number>();
    while (set.size < count) {
      set.add(Math.floor(Math.random() * total));
    }
    return set;
  }, []);

  const pickNeutral = () => neutralPalette[Math.floor(rnd(neutralPalette.length))];

  const hexToRgba = (hex: string, alpha = 1) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const r = parseInt(full.substring(0, 2), 16);
    const g = parseInt(full.substring(2, 4), 16);
    const b = parseInt(full.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 0,
        opacity: 0.6,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = activeIndices.has(i);
        const delay = isActive ? rnd(6) : rnd(12);
        const duration = isActive ? 4 + rnd(4) : 10 + rnd(6);
        const activeAlpha = 0.12 + rnd(0.1);
        const inactiveAlpha = 0.02 + rnd(0.01);
        const baseHex = pickNeutral();
        const bgColor = isActive
          ? hexToRgba(baseHex, activeAlpha)
          : hexToRgba(pickNeutral(), inactiveAlpha);
        const midColor = hexToRgba(pickNeutral(), 0.25 + rnd(0.15));

        return (
          <motion.div
            key={i}
            initial={{ opacity: isActive ? 0 : 0.015, scale: 1 }}
            animate={
              isActive
                ? {
                    opacity: [0, 0.3 + rnd(0.2), 0.4 + rnd(0.2), 0],
                    scale: [1, 1.01 + rnd(0.01), 1],
                    backgroundColor: [bgColor, midColor, bgColor],
                  }
                : { opacity: [0.015, 0.025, 0.015], backgroundColor: [bgColor, bgColor] }
            }
            transition={{
              duration,
              delay,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
            style={{ width: "100%", height: "100%", margin: 0, borderRadius: 0 }}
          />
        );
      })}
    </motion.div>
  );
}

export function CTASection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="px-6 py-20 md:py-28"
      aria-label="Call to action"
    >
      <div className="relative mx-auto max-w-6xl rounded-md border border-neutral-800/50 bg-neutral-900/40 backdrop-blur-sm p-8 md:p-12">
        <CTAGridBackground />
        <div className="relative z-10 text-center lg:flex lg:items-center lg:justify-between lg:text-left">
          <div className="max-w-xl mx-auto lg:mx-0">
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-white"
            >
              Take control of your network chaos
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-4 text-lg text-neutral-400"
            >
              Throtl automatically balances bandwidth, ensuring fairness and smooth performance for all your devices.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row justify-center gap-4 lg:mt-0 lg:justify-end"
          >
            <CTAButton>Get started</CTAButton>
            <motion.div whileHover={{ }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-sm bg-neutral-800/50 px-5 py-3 text-sm font-semibold text-neutral-200 border border-neutral-700/50 transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2"
              >
                Contact
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}