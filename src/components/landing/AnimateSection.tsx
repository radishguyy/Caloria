"use client";

import { motion, useReducedMotion } from "framer-motion";
import React from "react";

interface AnimateSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimateSection({
  children,
  className,
  delay = 0,
}: AnimateSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FloatCharacter({
  children,
  className,
  delay = 0,
  duration = 3.5,
  amplitude = 8,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  amplitude?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      animate={{ y: [-amplitude / 2, amplitude / 2, -amplitude / 2] }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "easeInOut",
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

