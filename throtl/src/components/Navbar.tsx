// src/components/Navbar.tsx
import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Transition } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { MobileNav } from "./MobileNav"; 
import { DesktopNav } from "./DesktopNav"; 

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

  const titleX = useTransform(scrollY, [0, 140], [0, -300]);
  const titleScale = useTransform(scrollY, [0, 140], [1, 0.95]);
  const titleY = useTransform(scrollY, [0, 140], [0, -4]);

  const titleStyle =
    !isLanding || reduceMotion
      ? { x: 0, y: 0, scale: 1 }
      : { x: titleX, y: titleY, scale: titleScale };

  const [stacked, setStacked] = useState<boolean>(false);
  const prevStackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (reduceMotion) {
      setStacked(false);
      prevStackedRef.current = false;
      return;
    }
    const threshold = 140;
    const hysteresisPx = 12;
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
    });

    return () => unsubscribe();
  }, [scrollY, isLanding, reduceMotion]);

  const compact = !isLanding;

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
        <Link to="/">
          <div className="flex flex-row items-center cursor-pointer relative">
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
              <motion.div
                className="w-full h-full"
                initial={false}
                whileHover={reduceMotion ? undefined : "hover"}
              >
                <motion.span className={`absolute hover:bg-white bg-neutral-950 z-50 ${compact ? "h-2 w-2 bottom-3 right-0 md:h-3 md:w-3 md:bottom-5" : "h-4 w-4 bottom-4 right-0 md:h-5 md:w-5 md:bottom-10"} `} variants={compact ? smallDotVariants : dotVariants}/>
                <motion.span className={`absolute hover:bg-white bg-neutral-950 z-50 ${compact ? "h-2 w-2 bottom-5 right-2 md:h-3 md:w-3 md:bottom-8 md:right-3" : "h-4 w-4 bottom-8 right-4 md:h-5 md:w-5 md:bottom-[60px] md:right-5"} `} variants={compact ? smallDotVariants : dotVariants} />
                <motion.span className={`absolute hover:bg-white bg-neutral-950 z-50 ${compact ? "h-2 w-2 bottom-7 right-0 md:h-3 md:w-3 md:bottom-[44px]" : "h-4 w-4 bottom-12 right-0 md:h-5 md:w-5 md:bottom-[80px]"} `} variants={compact ? smallDotVariants : dotVariants} />
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
        
        <div className="hidden md:flex items-center">
            <DesktopNav 
                navItems={NAV_ITEMS}
                isLanding={isLanding}
                stacked={stacked}
                springTransition={springTransition}
                compact={compact}
            />
        </div>

        <div className="md:hidden flex items-center pr-2">
            <MobileNav navItems={NAV_ITEMS} />
        </div>
        
      </motion.div>
    </nav>
  );
}