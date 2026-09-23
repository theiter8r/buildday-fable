import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>

const baseClasses = clsx(
  'h-9 rounded-[var(--radius-sm)] border border-line bg-navy-800 px-3 text-[length:var(--text-body)] text-cream-50',
  'placeholder:text-text-subtle transition-colors duration-[var(--dur-fast)]',
  'hover:border-line-strong focus-visible:border-cobalt-400 focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none',
  'aria-invalid:border-[var(--color-state-error)]',
  'disabled:cursor-not-allowed disabled:opacity-45',
)

export function TextInput({ className, ...rest }: TextInputProps) {
  return <input type="text" className={clsx(baseClasses, className)} {...rest} />
}
