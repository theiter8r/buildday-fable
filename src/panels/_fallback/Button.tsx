/**
 * Minimal typed local fallback for the shared `Button` primitive
 * (ARCHITECTURE.md §2 lists it under `src/components`, owned by the
 * components lane and being written concurrently). Swap the import in the
 * panels that use this for `@/components/Button` once it lands — see
 * `docs/lane-notes/panels.md`.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
export type ButtonSize = 'default' | 'compact' | 'touch'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-cobalt-600 text-cream-50 hover:bg-cobalt-500',
  secondary: 'bg-navy-700 text-cream-100 border border-line hover:border-line-strong',
  ghost: 'bg-transparent text-cream-200 hover:bg-navy-800',
  danger:
    'bg-transparent text-[var(--color-state-error)] border border-[var(--color-state-error)] hover:bg-[rgb(255_143_130_/_0.12)]',
  gold: 'bg-gold-400 text-[var(--color-on-gold)] hover:bg-gold-300',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'h-9 px-3 text-body',
  compact: 'h-8 px-2.5 text-meta',
  touch: 'h-11 px-4 text-body',
}

export function Button({
  variant = 'secondary',
  size = 'default',
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-[background-color] duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)] disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim()}
      disabled={disabled}
      {...rest}
    />
  )
}
