// src/components/layouts/PageLayout.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'narrow' | 'default' | 'wide' | 'full';
}

export function PageLayout({ 
  children, 
  className,
  maxWidth = 'default' 
}: PageLayoutProps) {
  const maxWidthClasses = {
    narrow: 'max-w-3xl',
    default: 'max-w-5xl',
    wide: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'space-y-6 sm:space-y-8',
      maxWidthClasses[maxWidth],
      'mx-auto px-4 sm:px-6 lg:px-8',
      'py-6 lg:py-8',
      className
    )}>
      {children}
    </div>
  );
}

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
}

export function PageHeader({ 
  title, 
  subtitle, 
  icon, 
  actions,
  centered = false 
}: PageHeaderProps) {
  if (centered) {
    return (
      <div className="text-center space-y-4">
        {icon && (
          <div className="inline-flex p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/20">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center justify-center gap-4 pt-4">
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

// Section Component
interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h2 className="text-2xl font-semibold">{title}</h2>}
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}