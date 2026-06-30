// src/components/MobileNav.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = { to: string; label: string };

const menuVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

type MobileNavProps = {
  navItems: NavItem[];
};

export function MobileNav({ navItems }: MobileNavProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={toggleMenu}
        className="relative z-[1000] p-2 text-white"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" animate={{ d: isOpen ? "M6 18L18 6" : "M4 6H20" }} />
          <motion.path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" animate={{ opacity: isOpen ? 0 : 1 }} transition={{ duration: 0.1 }} />
          <motion.path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" animate={{ d: isOpen ? "M6 6L18 18" : "M4 18H20" }} />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // --- FINAL CORRECTION USING STANDARD TAILWIND SYNTAX ---
            className="fixed inset-0 z-[999] flex flex-col items-end pt-20 "
          >
            {navItems.map((item) => (
              <motion.div variants={itemVariants} key={item.to}>
                <Link
                  to={item.to}
                  onClick={closeMenu}
                  className={`block p-4 mb-4 border-b border-neutral-200 border-dashed w-32 text-right text-xl font-bold transition-colors bg-black bg-opacity-40 backdrop-blur-xl ${
                    location.pathname === item.to
                      ? "text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  aria-current={location.pathname === item.to ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}