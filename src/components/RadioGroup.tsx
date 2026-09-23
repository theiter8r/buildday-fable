import { useId } from 'react'
import clsx from 'clsx'

export interface RadioOption {
  value: string
  label: string
  helper?: string
}

export interface RadioGroupProps {
  legend: string
  options: readonly RadioOption[]
  value: string
  onChange: (value: string) => void
  name?: string
  orientation?: 'vertical' | 'horizontal'
}

export function RadioGroup({
  legend,
  options,
  value,
  onChange,
  name,
  orientation = 'vertical',
}: RadioGroupProps) {
  const groupName = useId()
  const resolvedName = name ?? groupName

  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
      <legend className="text-[length:var(--text-label)] tracking-[0.01em] text-cream-200">
        {legend}
      </legend>
      <div className={clsx('flex gap-2', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>
        {options.map((opt) => {
          const inputId = `${resolvedName}-${opt.value}`
          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={clsx(
                'flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] border p-2 transition-colors',
                value === opt.value ? 'border-cobalt-400 bg-navy-800' : 'border-line hover:border-line-strong',
              )}
            >
              <input
                id={inputId}
                type="radio"
                name={resolvedName}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 size-4 accent-[var(--color-gold-400)] focus-visible:shadow-[var(--glow-focus)]"
              />
              <span className="flex flex-col">
                <span className="text-[length:var(--text-body)] text-cream-100">{opt.label}</span>
                {opt.helper && (
                  <span className="text-[length:var(--text-meta)] text-text-muted">{opt.helper}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
