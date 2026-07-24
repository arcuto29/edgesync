'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  subtitle?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  subtitle,
  delay = 0,
}: StatCardProps) {
  const changeColor =
    changeType === 'positive'
      ? 'text-profit'
      : changeType === 'negative'
      ? 'text-loss'
      : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative rounded-2xl bg-card border border-border/50 p-5 card-hover overflow-hidden"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80">
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-white tracking-tight stat-value">{value}</p>
          {change && (
            <p className={`text-xs mt-1.5 font-medium ${changeColor}`}>
              {change}
            </p>
          )}
          {subtitle && (
            <p className="text-xs mt-1.5 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
