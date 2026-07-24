'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  subtitle,
}: StatCardProps) {
  const changeColor =
    changeType === 'positive'
      ? 'text-[hsl(var(--profit))]'
      : changeType === 'negative'
      ? 'text-[hsl(var(--loss))]'
      : 'text-[hsl(var(--muted-foreground))]';

  return (
    <div className="rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{title}</p>
        <Icon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        {change && (
          <p className={`text-xs mt-1 ${changeColor}`}>
            {change}
          </p>
        )}
        {subtitle && (
          <p className="text-xs mt-1 text-[hsl(var(--muted-foreground))]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
