import type { TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={clsx(
        'min-h-24 resize-y rounded-[var(--radius-sm)] border border-line bg-navy-800 px-3 py-2 text-[length:var(--text-body)] text-cream-50',
        'placeholder:text-text-subtle transition-colors duration-[var(--dur-fast)]',
        'hover:border-line-strong focus-visible:border-cobalt-400 focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none',
        'aria-invalid:border-[var(--color-state-error)]',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...rest}
    />
  )
}
