"use client";

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useEffect, type PropsWithChildren } from "react";

interface TransitionProgressProps {
  progress?: number;
}

const TransitionProgress: React.FC<
  PropsWithChildren<TransitionProgressProps>
> = ({ progress, children }) => {
  const value = useMotionValue(0);
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 20,
    duration: 0.5,
  });
  const background = useMotionTemplate`conic-gradient(blue ${springValue}%, #f1f1f1 0%)`;

  useEffect(() => {
    if (progress) {
      value.set(progress * 100);
    }
  }, [progress, value]);

  return (
    <motion.div className="relative p-1">
      {children}
      <AnimatePresence
        onExitComplete={() => {
          value.set(0);
        }}
      >
        {progress !== undefined && (
          <motion.div
            className="absolute inset-0 -z-10 rounded-full"
            style={{
              background,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TransitionProgress;
