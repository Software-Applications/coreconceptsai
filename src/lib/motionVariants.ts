import type { Transition, Variants } from "framer-motion";

export const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
} as const;

export const cardHover = {
  scale: 1.02,
  y: -2,
};

export const cardTap = {
  scale: 0.97,
};

export const buttonTap = {
  scale: 0.9,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const dropdownVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: -8, 
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      staggerChildren: 0.03,
    },
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

export const dropdownItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};
