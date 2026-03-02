// src/components/ui/responsive-cards.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, ArrowRight, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon?: ReactNode;
  color?: 'purple' | 'green' | 'blue' | 'orange' | 'red' | 'pink';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  icon,
  color = 'purple',
  className
}: MetricCardProps) {
  const colorStyles = {
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400'
  };

  const isPositive = change && change > 0;

  return (
    <Card className={cn('relative overflow-hidden hover:shadow-lg transition-all duration-200', className)}>
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-4">
          {icon && (
            <div className={cn('p-3 rounded-xl', colorStyles[color])}>
              {icon}
            </div>
          )}
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        
        <div className={cn(
          'absolute inset-x-0 bottom-0 h-1',
          `bg-${color}-500`
        )} />
      </CardContent>
    </Card>
  );
}

// Progress Card Component
interface ProgressCardProps {
  title: string;
  subtitle?: string;
  progress: number;
  total: number;
  completedText?: string;
  icon?: ReactNode;
  showPercentage?: boolean;
  estimatedTime?: string;
  className?: string;
}

export function ProgressCard({
  title,
  subtitle,
  progress,
  total,
  completedText,
  icon,
  showPercentage = true,
  estimatedTime,
  className
}: ProgressCardProps) {
  const percentage = Math.round((progress / total) * 100);

  return (
    <Card className={cn(
      'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10',
      'border-purple-200 dark:border-purple-800',
      className
    )}>
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{title}</h3>
                {subtitle && (
                  <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
                )}
              </div>
            </div>
            {showPercentage && (
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">
                  {percentage}%
                </div>
                {completedText && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{completedText}</p>
                )}
              </div>
            )}
          </div>
          
          <Progress value={percentage} className="h-3 bg-purple-100 dark:bg-purple-900/20" />
          
          {estimatedTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{estimatedTime}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Step Card Component
interface StepCardProps {
  step: {
    title: string;
    description: string;
    duration?: string;
    icon?: ReactNode;
    status: 'completed' | 'current' | 'upcoming' | 'locked';
  };
  onClick?: () => void;
  showArrow?: boolean;
  className?: string;
}

export function StepCard({ step, onClick, showArrow = true, className }: StepCardProps) {
  const isCompleted = step.status === 'completed';
  const isCurrent = step.status === 'current';
  const isLocked = step.status === 'locked';
  
  const statusColors = {
    completed: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    current: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    upcoming: 'bg-gray-100 text-gray-400 dark:bg-gray-800',
    locked: 'bg-gray-100 text-gray-400 dark:bg-gray-800'
  };

  return (
    <Card 
      className={cn(
        'relative cursor-pointer transition-all duration-200',
        isCurrent ? 'ring-2 ring-purple-600 shadow-lg' : 'hover:shadow-md',
        isLocked && 'opacity-60',
        className
      )}
      onClick={!isLocked ? onClick : undefined}
    >
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center',
            statusColors[step.status]
          )}>
            {isCompleted ? (
              <Check className="h-6 w-6" />
            ) : step.icon ? (
              <div className="h-6 w-6">{step.icon}</div>
            ) : (
              <div className="h-6 w-6" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              {step.duration && (
                <Badge variant={isCurrent ? 'default' : 'outline'} className="ml-2">
                  {step.duration}
                </Badge>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {step.description}
            </p>
            {isCurrent && showArrow && (
              <Button variant="link" className="p-0 h-auto gap-1 text-purple-600">
                {isCompleted ? 'Review' : 'Start Now'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className={cn(
          'absolute inset-x-0 top-0 h-1',
          isCompleted ? 'bg-green-500' :
          isCurrent ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
          'bg-gray-200 dark:bg-gray-700'
        )} />
      </CardContent>
    </Card>
  );
}

// Feature Card Component
interface FeatureCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  status?: 'available' | 'coming-soon' | 'locked';
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon,
  status = 'available',
  onClick,
  className
}: FeatureCardProps) {
  const isAvailable = status === 'available';
  
  return (
    <Card 
      className={cn(
        'transition-all duration-200',
        isAvailable ? 'cursor-pointer hover:shadow-md' : 'border-dashed',
        className
      )}
      onClick={isAvailable ? onClick : undefined}
    >
      <CardContent className="p-6 text-center">
        {icon && (
          <div className={cn(
            'h-8 w-8 mx-auto mb-3',
            isAvailable ? 'text-purple-600' : 'text-gray-400'
          )}>
            {icon}
          </div>
        )}
        <h4 className="font-medium mb-1">{title}</h4>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
        {status === 'coming-soon' && (
          <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
        )}
      </CardContent>
    </Card>
  );
}

// Help Card Component
interface HelpCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function HelpCard({ title, description, icon, action, className }: HelpCardProps) {
  return (
    <Card className={cn(
      'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800',
      className
    )}>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {icon && (
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                {icon}
              </div>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          {action && (
            <Button 
              size="lg" 
              variant="outline" 
              className="gap-2"
              onClick={action.onClick}
            >
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}