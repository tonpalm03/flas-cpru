import { Icon } from "./Icons"

export interface StepItem {
  id: number
  title: string
  description?: string
}

interface StepperProps {
  steps: StepItem[]
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className = "",
}: StepperProps) {
  return (
    <nav aria-label="Progress" className={`w-full ${className}`}>
      <ol className="flex items-center justify-between gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isUpcoming = currentStep < step.id

          return (
            <li key={step.id} className="relative flex-1">
              <div
                onClick={() => onStepClick && onStepClick(step.id)}
                className={`group flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-xl p-2 transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-brand/5"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Step Circle Indicator */}
                <div
                  className={`relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs ${
                    isCompleted
                      ? "bg-brand text-accent"
                      : isCurrent
                      ? "bg-brand-2 text-white ring-4 ring-brand-2/20 shadow-sm"
                      : "bg-slate-100 text-slate-500 border border-slate-300"
                  }`}
                >
                  {isCompleted ? (
                    <Icon name="check" size={16} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Labels */}
                <div className="flex flex-col text-center sm:text-left min-w-0">
                  <span
                    className={`text-xs font-bold truncate transition-colors ${
                      isCurrent
                        ? "text-brand"
                        : isCompleted
                        ? "text-brand-2"
                        : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span
                      className={`text-[10px] hidden sm:block truncate ${
                        isCurrent
                          ? "text-muted font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Line (for desktop) */}
              {index < steps.length - 1 && (
                <div
                  className="absolute top-1/2 -right-2 sm:-right-4 hidden h-[2px] w-2 sm:w-4 -translate-y-1/2 bg-slate-200 lg:block"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep > step.id ? "bg-brand" : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
