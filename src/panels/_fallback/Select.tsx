/** Minimal typed local fallback for the shared `Select` primitive (see docs/lane-notes/panels.md). */
import type { SelectHTMLAttributes } from 'react'
import { INPUT_CLASSES } from './inputClasses'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly SelectOption[]
}

export function Select({ options, className = '', ...rest }: SelectProps) {
  return (
    <select className={`${INPUT_CLASSES} ${className}`.trim()} {...rest}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
