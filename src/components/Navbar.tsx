import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Transition,
} from "framer-motion";
import { Link, useLocation } from "react-router-dom";

type NavItem = { to: string; label: string };

const dotVariants = {
  initial: { x: 0, backgroundColor: "#0a0a0a" },
  hover: { x: -30, backgroundColor: "#fafafa" },
};
const smallDotVariants = {
  initial: { x: 0, backgroundColor: "#0a0a0a" },
  hover: { x: -15, backgroundColor: "#fafafa" },
};

const NAV_ITEMS: NavItem[] = [
  { to: "/contact", label: "Contact" },
  { to: "/about", label: "About" },
  { to: "/dashboard", label: "Dashboard" },

];

export function Navbar(): React.JSX.Element {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const springTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 300, damping: 30 };

  // Title transform (only active on landing)
  const titleX = useTransform(scrollY, [0, 140], [0, -300]);
  const titleScale = useTransform(scrollY, [0, 140], [1, 0.95]);
  const titleY = useTransform(scrollY, [0, 140], [0, -4]);

  const titleStyle =
    !isLanding || reduceMotion
      ? { x: 0, y: 0, scale: 1 }
      : { x: titleX, y: titleY, scale: titleScale };

  // ---------- stacked state with hysteresis ----------
  const threshold = 140;
  const hysteresisPx = 12;
  const [stacked, setStacked] = useState<boolean>(false);
  const prevStackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (reduceMotion) {
      setStacked(false);
      prevStackedRef.current = false;
      return;
    }

    // seed from current scrollY
    const initial = scrollY.get() > threshold;
    setStacked(initial);
    prevStackedRef.current = initial;

    const unsubscribe = scrollY.onChange((y) => {
      if (!isLanding) {
        if (prevStackedRef.current) {
          prevStackedRef.current = false;
          setStacked(false);
        }
        return;
      }

      if (!prevStackedRef.current && y > threshold + hysteresisPx) {
        prevStackedRef.current = true;
        setStacked(true);
      } else if (prevStackedRef.current && y < threshold - hysteresisPx) {
        prevStackedRef.current = false;
        setStacked(false);
      }
      // else: do nothing (avoid unnecessary state updates)
    });

    return () => unsubscribe();
  }, [scrollY, isLanding, reduceMotion]);

  // ---------- measurement for transform offsets ----------
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [widthOffsets, setWidthOffsets] = useState<number[] | null>(null);
  const [heightOffsets, setHeightOffsets] = useState<number[] | null>(null);
  const gapPx = 8; 

  const measure = () => {
    const widths: number[] = [];
    const heights: number[] = [];
    for (let i = 0; i < NAV_ITEMS.length; i++) {
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

  useLayoutEffect(() => {
    measure();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measure();
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fallback offsets if measurement missing (keeps things functional instantly)
  const fallbackX = NAV_ITEMS.map((_, i) => i * 140); 
  const xOffsets = widthOffsets ?? fallbackX;

  const yPositions: number[] =
    heightOffsets?.map((_, i) =>
      heightOffsets!.slice(0, i).reduce((a, b) => a + b, 0) + i * gapPx
    ) ?? NAV_ITEMS.map((_, i) => i * 56); 

  // ---------- compact detection ----------
  const compact = !isLanding;

  const containerClass =
    "relative flex-shrink-0 min-w-[180px] md:min-w-[300px] lg:min-w-[420px] h-auto";

  return (
    <nav
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        !isLanding ? "p-4 md:p-8 md:mx-[52px]" : "p-0"
      }`}
      aria-label="Main navigation"
    >
      <motion.div
        layoutId="main-nav"
        initial={false}
        transition={springTransition}
        className={`${
          !isLanding ? "border border-neutral-800 backdrop-blur-sm" : ""
        } flex justify-between items-center font-bold`}
        style={{ willChange: "transform" }}
      >
        <Link
          to="/"
          className=""
        >
          <div className="flex flex-row items-center cursor-pointer relative">
            {/* White logo box */}
            <div
              className={`relative bg-white hover:bg-neutral-950 transition-colors duration-300 ease-in-out flex items-center justify-center
                ${
                  compact
                    ? "h-12 w-12 md:h-20 md:w-20"
                    : "h-20 w-20 md:h-[140px] md:w-[140px]"
                }`}
              aria-hidden="true"
              style={{ zIndex: 40 }}
            >
              {/* Hover animation dots */}
              <motion.div
                className="w-full h-full"
                initial={false}
                whileHover={reduceMotion ? undefined : "hover"}
              >
                <motion.span
                  className={`absolute hover:bg-white bg-neutral-950 z-50 ${
                    compact
                      ? "h-2 w-2 bottom-3 right-0 md:h-3 md:w-3 md:bottom-5"
                      : "h-4 w-4 bottom-5 right-0 md:h-5 md:w-5 md:bottom-10"
                  } `}
                  variants={compact ? smallDotVariants : dotVariants}
                />
                <motion.span
                  className={`absolute hover:bg-white bg-neutral-950 z-50 ${
                    compact
                      ? "h-2 w-2 bottom-5 right-2 md:h-3 md:w-3 md:bottom-8 md:right-3"
                      : "h-4 w-4 bottom-8 right-3 md:h-5 md:w-5 md:bottom-[60px] md:right-5"
                  } `}
                  variants={compact ? smallDotVariants : dotVariants}
                />
                <motion.span
                  className={`absolute hover:bg-white bg-neutral-950 z-50 ${
                    compact
                      ? "h-2 w-2 bottom-8 right-0 md:h-3 md:w-3 md:bottom-[44px]"
                      : "h-4 w-4 bottom-10 right-0 md:h-5 md:w-5 md:bottom-[80px]"
                  } `}
                  variants={compact ? smallDotVariants : dotVariants}
                />
              </motion.div>
            </div>

            <motion.h1
              initial={false}
              style={{ zIndex: 20, ...titleStyle }}
              className={`tracking-tight transition-all hover:tracking-wide duration-500 ease-out ${
                compact
                  ? "text-3xl px-3 md:text-5xl md:px-5"
                  : "text-5xl px-4 md:text-8xl md:px-10"
              }`}
            >
              Throtl
            </motion.h1>
          </div>
        </Link>

        {/* ---------------- Nav items container (transform-only approach) ---------------- */}
        <div className={containerClass} ref={containerRef} aria-label="nav-links">
          <motion.div
            initial={false}
            animate={{}}
            transition={springTransition}
            style={{ position: "relative", width: "100%", height: "100%" }}
          >
            {NAV_ITEMS.map((item, i) => {
  const xRow = -xOffsets[i];
  const yStack = yPositions[i] ?? i * 56;
  const isActive = location.pathname === item.to; // true when link is current page

  // compact small style — only add hover effects when compact AND this is NOT the active page
  const compactBase = "mx-2 py-2 px-2 text-sm md:mx-5 md:py-3 md:px-3 md:text-lg";
  const compactHover =
    compact && !isActive
      ? " hover:underline hover:scale-[1.01] hover:decoration-dashed hover:decoration-2 hover:decoration-current underline-offset-5 transition-all"
      : "";
  const compactClass = `${compactBase}${compactHover}`;

  // full (non-compact) style — keep your existing hover treatment
  const fullClass =
    "mx-2 py-3 px-3 text-lg hover:underline hover:scale-[1.01] hover:decoration-dashed hover:decoration-2 hover:decoration-current underline-offset-5 transition-all md:mx-5 md:py-6 md:px-6 md:text-2xl backdrop-blur-sm";

  const linkDivClass = compact ? compactClass : fullClass;

  return (
    <motion.div
      key={item.to}
      ref={(el) => {
        itemRefs.current[i] = el;
      }}
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
      </motion.div>
    </nav>
  );
}

export default Navbar;
