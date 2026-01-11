'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FORM_STEPS } from '@/types/invention';

interface FormStepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
}

export function FormStepIndicator({ currentStep, completedSteps }: FormStepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {FORM_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;

          return (
            <li key={step.id} className="flex-1 relative">
              <div className="flex items-center">
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className={cn(
                      'absolute left-0 top-4 -translate-y-1/2 h-0.5 w-full -ml-1/2',
                      isCompleted || isCurrent ? 'bg-primary' : 'bg-muted'
                    )}
                    style={{ width: 'calc(100% - 2rem)', marginLeft: '-50%' }}
                  />
                )}

                {/* Step circle */}
                <div className="relative flex flex-col items-center group">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium z-10',
                      isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'border-primary bg-background text-primary'
                        : 'border-muted bg-background text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </span>

                  {/* Step label */}
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium text-center whitespace-nowrap',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
