import type { Transition } from "framer-motion";

export const STANDARD_SPRING: Transition = {
  type: "spring",
  stiffness: 170,
  damping: 26,
  mass: 1
};

export const RESPONSIVE_SPRING: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
  mass: 1
};

export const HEAVY_SPRING: Transition = {
  type: "spring",
  stiffness: 80,
  damping: 25,
  mass: 1,
  restDelta: 0.001
};
