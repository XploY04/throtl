import React from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Transition } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const dotVariants = {
  initial: { x: 0, backgroundColor: "#0a0a0a" },
  hover: { x: -30, backgroundColor: "#fafafa" },
};
const smallDotVariants = {
  initial: { x: 0, backgroundColor: "#0a0a0a" },
  hover: { x: -15, backgroundColor: "#fafafa" },
};

export function Navbar() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const isLanding = location.pathname === "/";
  const reduceMotion = useReducedMotion();

  const springTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 300, damping: 30 };

  // Scroll-based hide animation (only on landing)
  const { scrollY } = useScroll();

  const titleX = useTransform(scrollY, [0, 140], [0, -300]);
  const titleScale = useTransform(scrollY, [0, 140], [1, 0.95]);
  const titleY = useTransform(scrollY, [0, 140], [0, -4]);

  // ✅ Only animate if on landing page, otherwise static
  const titleStyle =
    !isLanding || reduceMotion
      ? { x: 0, y: 0, scale: 1 }
      : { x: titleX, y: titleY, scale: titleScale };

  return (
    <nav
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        isDashboard ? "p-4 md:p-8 md:mx-[52px]" : "p-0"
      }`}
    >
      <motion.div
        layoutId="main-nav"
        transition={springTransition}
        className={`${
          isDashboard ? "border border-neutral-800 backdrop-blur-sm" : ""
        } flex justify-between items-center font-bold`}
      >
        <Link
          to="/"
          aria-label="Go to Throtl home"
          title="Throtl home"
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-800"
        >
          <div className="flex flex-row items-center cursor-pointer relative">
            {/* White logo box */}
            <div
              className={`relative bg-white hover:bg-neutral-950 transition-colors duration-300 ease-in-out flex items-center justify-center
                ${
                  isDashboard
                    ? "h-12 w-12 md:h-20 md:w-20"
                    : "h-20 w-20 md:h-[140px] md:w-[140px]"
                }`}
              aria-hidden="true"
              style={{ zIndex: 40 }}
            >
              {/* Hover animation dots */}
              <motion.div
                className="w-full h-full"
                initial="initial"
                whileHover={reduceMotion ? undefined : "hover"}
              >
                <motion.span
                  className={`absolute ${
                    isDashboard
                      ? "h-2 w-2 bottom-3 right-0 md:h-3 md:w-3 md:bottom-5"
                      : "h-3 w-3 bottom-5 right-0 md:h-5 md:w-5 md:bottom-10"
                  }`}
                  variants={isDashboard ? smallDotVariants : dotVariants}
                />
                <motion.span
                  className={`absolute ${
                    isDashboard
                      ? "h-2 w-2 bottom-5 right-2 md:h-3 md:w-3 md:bottom-8 md:right-3"
                      : "h-3 w-3 bottom-8 right-3 md:h-5 md:w-5 md:bottom-[60px] md:right-5"
                  }`}
                  variants={isDashboard ? smallDotVariants : dotVariants}
                />
                <motion.span
                  className={`absolute ${
                    isDashboard
                      ? "h-2 w-2 bottom-8 right-0 md:h-3 md:w-3 md:bottom-[44px]"
                      : "h-3 w-3 bottom-10 right-0 md:h-5 md:w-5 md:bottom-[80px]"
                  }`}
                  variants={isDashboard ? smallDotVariants : dotVariants}
                />
              </motion.div>
            </div>

            {/* Title that slides horizontally behind (only on landing) */}
            <motion.h1
              style={{ zIndex: 20, ...titleStyle }}
              className={`tracking-tight transition-all duration-500 ease-out ${
                isDashboard
                  ? "text-3xl px-3 md:text-5xl md:px-5"
                  : "text-5xl px-4 md:text-8xl md:px-10"
              }`}
            >
              Throtl
            </motion.h1>
          </div>
        </Link>

        <div>
          <Link
            to="/dashboard"
            className="text-white transition-colors"
            aria-current={isDashboard ? "page" : undefined}
          >
            <div
              className={`${
                isDashboard
                  ? "mx-2 py-2 px-2 text-sm md:mx-5 md:py-3 md:px-3 md:text-lg"
                  : "mx-2 py-3 px-3 text-lg hover:underline hover:scale-[1.01] hover:decoration-dashed hover:decoration-2 hover:decoration-current underline-offset-5 transition-all md:mx-5 md:py-6 md:px-6 md:text-2xl backdrop-blur-sm"
              }`}
            >
              Dashboard
            </div>
          </Link>
        </div>
      </motion.div>
    </nav>
  );
}

export default Navbar;
