export const FADE_IN_UP = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const STAGGER_PARENT = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

