'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in seconds when revealing several in sequence. */
  delay?: number;
  /** Travel distance in px (default 16). */
  y?: number;
  /** Re-animate every time it enters the viewport (default: once). */
  once?: boolean;
  as?: 'div' | 'section' | 'li' | 'article' | 'span';
};

/**
 * Scroll-triggered entrance. Fades + lifts content into view once it crosses
 * the viewport. Honors `prefers-reduced-motion` (renders static). Use to give
 * sections and grids a calm, intentional reveal — never gratuitous motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  once = true,
  as = 'div',
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Staggered grid/list reveal. Wrap a list in <Stagger> and each direct child in
 * <StaggerItem> for a cascading entrance (product grids, feature rows).
 */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}
