// Filename: src/components/Navbar.tsx

import React from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
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
  const reduceMotion = useReducedMotion();

  // explicitly type the transition so TS knows this matches framer-motion's Transition type
  const springTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 300, damping: 30 };

  return (
    <nav className={`${isDashboard ? "p-8 mx-[52px]" : ""} `}>
      <motion.div
        layoutId="main-nav"
        transition={springTransition}
        className={`${isDashboard ? "border border-neutral-800" : ""} flex justify-between items-center font-bold`}
      >
        <Link to="/" aria-label="Go to Throtl home" title="Throtl home" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-800">
          <div className="flex flex-row items-center cursor-pointer">
            <div
              className={`relative bg-white hover:bg-neutral-950 transition-colors duration-300 ease-in-out ${
                isDashboard ? "h-20 w-20" : "h-[140px] w-[140px]"
              }`}
              aria-hidden="true"
            >
              <motion.div
                className="w-full h-full"
                initial="initial"
                whileHover={reduceMotion ? undefined : "hover"}
              >
                <motion.span
                  className={`absolute ${
                    isDashboard
                      ? "h-3 w-3 bottom-5 right-0"
                      : "h-5 w-5 bottom-10 right-0"
                  }`}
                  variants={isDashboard ? smallDotVariants : dotVariants}
                  aria-hidden="true"
                  role="presentation"
                />
                <motion.span
                  className={`absolute ${
                    isDashboard
                      ? "h-3 w-3 bottom-8 right-3"
                      : "h-5 w-5 bottom-[60px] right-5"
                  }`}
                  variants={isDashboard ? smallDotVariants : dotVariants}
                  aria-hidden="true"
                  role="presentation"
                />
                <motion.span
                  className={`absolute ${
                    isDashboard
                      ? "h-3 w-3 bottom-[44px] right-0"
                      : "h-5 w-5 bottom-[80px] right-0"
                  }`}
                  variants={isDashboard ? smallDotVariants : dotVariants}
                  aria-hidden="true"
                  role="presentation"
                />
              </motion.div>
            </div>
            <h1
              className={`hover:scale-[1.01]  tracking-tight hover:tracking-normal transition-all duration-500 ${isDashboard ? "text-5xl px-5" : "text-8xl px-10"}`}
            >
              Throtl
            </h1>
          </div>
        </Link>

        <div>
          <Link
            to="/dashboard"
            className="text-black transition-colors"
            aria-current={isDashboard ? "page" : undefined}
          >
            <div
              className={`text-white  ${
                isDashboard
                  ? "mx-5 py-3 px-3 text-lg"
                  : "mx-5 py-6 px-6 text-2xl hover:underline hover:scale-[1.01] hover:decoration-dashed hover:decoration-2 hover:decoration-current underline-offset-5 transition-all"
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
