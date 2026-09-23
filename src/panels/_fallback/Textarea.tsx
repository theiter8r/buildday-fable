/** Minimal typed local fallback for the shared `Textarea` primitive (see docs/lane-notes/panels.md). */
import type { TextareaHTMLAttributes } from 'react'
import { TEXTAREA_CLASSES } from './inputClasses'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className = '', ...rest }: TextareaProps) {
  return <textarea className={`${TEXTAREA_CLASSES} ${className}`.trim()} {...rest} />
}
