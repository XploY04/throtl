import { useMemo, useRef } from "react";
import { motion } from "framer-motion";

function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AnimatedGrid() {
  const cols = 32; 
  const rows = 20;
  const total = cols * rows;

  const density = 0.1;

  const neutralPalette = [
    "#374151", 
    "#1f2937", 
    "#111827", 
    "#030712", 
  ];

  const seedRef = useRef(Math.random());
  const rnd = (n = 1) => {
    seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
    return (seedRef.current / 233280) * n;
  };

  const activeIndices = useMemo(() => {
    const count = Math.max(4, Math.floor(total * density));
    const set = new Set<number>();
    while (set.size < count) {
      set.add(Math.floor(Math.random() * total));
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, rows]);

  const pickNeutral = () => {
    const idx = Math.floor(rnd(neutralPalette.length));
    return neutralPalette[Math.min(idx, neutralPalette.length - 1)];
  };

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 0,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = activeIndices.has(i);
        const delay = isActive ? Math.round(rnd(8000)) / 1000 : Math.round(rnd(16000)) / 1000;
        const duration = isActive ? 6 + rnd(6) : 14 + rnd(10);

        const activeAlpha = 0.18 + rnd(0.18);
        const inactiveAlpha = 0.025 + rnd(0.015);

        const baseHex = pickNeutral();
        const bgColor = isActive ? hexToRgba(baseHex, activeAlpha) : hexToRgba(pickNeutral(), inactiveAlpha);
        const midColor = hexToRgba(pickNeutral(), 0.35 + rnd(0.2));

        return (
          <motion.div
            key={i}
            initial={{ opacity: isActive ? 0 : 0.02, scale: 1 }}
            animate={
              isActive
                ? {
                    opacity: [0, 0.4 + rnd(0.25), 0.5 + rnd(0.25), 0],
                    scale: [1, 1.01 + rnd(0.02), 1],
                    backgroundColor: [bgColor, midColor, bgColor],
                  }
                : { opacity: [0.02, 0.03, 0.02], backgroundColor: [bgColor, bgColor] }
            }
            transition={{
              duration,
              delay,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
            style={{
              width: "100%",
              height: "100%",
              margin: 0,
              borderRadius: 0,
              filter: "none",
            }}
          />
        );
      })}
    </motion.div>
  );
}
