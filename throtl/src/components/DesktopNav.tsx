// src/components/DesktopNav.tsx
import React, { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, type Transition } from "framer-motion";

type NavItem = { to: string; label: string };

type DesktopNavProps = {
  navItems: NavItem[];
  isLanding: boolean;
  stacked: boolean;
  springTransition: Transition;
  compact: boolean;
};

export function DesktopNav({
  navItems,
  isLanding,
  stacked,
  springTransition,
  compact,
}: DesktopNavProps): React.JSX.Element {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [widthOffsets, setWidthOffsets] = useState<number[] | null>(null);
  const [heightOffsets, setHeightOffsets] = useState<number[] | null>(null);
  const gapPx = 8;

  useLayoutEffect(() => {
    const measure = () => {
      const widths: number[] = [];
      const heights: number[] = [];
      for (let i = 0; i < navItems.length; i++) {
        const el = itemRefs.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          widths.push(Math.round(rect.width));
          heights.push(Math.round(rect.height));
        } else {
          widths.push(0);
          heights.push(0);
        }
      }

      const cumulativeX: number[] = [];
      let accum = 0;
      for (let i = 0; i < widths.length; i++) {
        cumulativeX.push(accum);
        accum += widths[i] + 12;
      }

      setWidthOffsets(cumulativeX);
      setHeightOffsets(heights);
    };
    
    measure();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fallbackX = navItems.map((_, i) => i * 140);
  const xOffsets = widthOffsets ?? fallbackX;
  const yPositions: number[] =
    heightOffsets?.map(
      (_, i) =>
        heightOffsets!.slice(0, i).reduce((a, b) => a + b, 0) + i * gapPx
    ) ?? navItems.map((_, i) => i * 56);
    
  const containerClass = "relative flex-shrink-0 min-w-[180px] md:min-w-[300px] lg:min-w-[420px] h-auto";

  return (
    <div className={containerClass} ref={containerRef} aria-label="nav-links">
      <motion.div
        initial={false}
        animate={{}}
        transition={springTransition}
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {navItems.map((item, i) => {
          const xRow = -xOffsets[i];
          const yStack = yPositions[i] ?? i * 56;
          const isActive = location.pathname === item.to;

          // --- YOUR ORIGINAL CLASS LOGIC ---
          const compactBase = "mx-2 py-2 px-2 text-sm md:mx-5 md:py-3 md:px-3 md:text-lg";
          const compactHover = compact && !isActive
              ? " hover:underline hover:scale-[1.01] hover:decoration-dashed hover:decoration-2 hover:decoration-current underline-offset-5 transition-all"
              : "";
          const compactClass = `${compactBase}${compactHover}`;
          const fullClass = "mx-2 py-3 px-3 text-lg hover:underline hover:scale-[1.01] hover:decoration-dashed hover:decoration-2 hover:decoration-current underline-offset-5 transition-all md:mx-5 md:py-6 md:px-6 md:text-2xl backdrop-blur-sm";
          const linkDivClass = compact ? compactClass : fullClass;
          // --- END ORIGINAL CLASS LOGIC ---

          return (
            <motion.div
              key={item.to}
              ref={(el) => { itemRefs.current[i] = el; }}
              initial={false}
              animate={{
                x: stacked && isLanding ? 0 : xRow,
                top: stacked && isLanding ? 0 : "50%",
                y: stacked && isLanding ? yStack : "-50%",
                opacity: 1,
              }}
              transition={springTransition}
              style={{
                position: "absolute",
                right: 0,
                display: "block",
                transformOrigin: "right center",
                willChange: "transform, opacity",
              }}
              className="pointer-events-auto"
            >
              <Link
                to={item.to}
                className="text-white transition-colors"
                aria-current={isActive ? "page" : undefined}
              >
                <div className={`${linkDivClass} whitespace-nowrap`}>
                  {item.label}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}