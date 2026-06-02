import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Driven by `useMotionValue` + `animate()` — NOT React state. setState-driven
// count-ups in a requestAnimationFrame loop re-render the parent on every frame,
// which jankily collides with Celebrate's confetti + pulse climax. This is a
// hard project rule.
interface Props {
  value: number;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString("en-IN");

export default function CountUp({
  value,
  duration = 1.2,
  delay = 0,
  format = defaultFormat,
  className,
  style,
}: Props) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(reduced ? value : 0);
  const text = useTransform(mv, (n: number) => format(n));
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      lastValueRef.current = value;
      return;
    }
    const ctrl = animate(mv, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    lastValueRef.current = value;
    return () => ctrl.stop();
  }, [value, duration, delay, reduced, mv]);

  return (
    <motion.span className={className} style={style}>
      {text}
    </motion.span>
  );
}

export const formatInrCount = (n: number): string =>
  `₹${Math.round(Math.max(0, n)).toLocaleString("en-IN")}`;
