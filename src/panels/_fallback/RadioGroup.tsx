/** Minimal typed local fallback for the shared `RadioGroup` primitive (see docs/lane-notes/panels.md). */
export interface RadioOption {
  value: string
  label: string
  helper?: string
}

export interface RadioGroupProps {
  name: string
  label: string
  options: readonly RadioOption[]
  value: string
  onChange: (value: string) => void
}

export function RadioGroup({ name, label, options, value, onChange }: RadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-label font-medium text-cream-200">{label}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="flex cursor-pointer items-start gap-2 rounded-sm border border-line bg-navy-800 p-2.5 has-[:checked]:border-line-strong"
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="mt-0.5 accent-[var(--color-gold-400)] focus-visible:outline-none"
              />
              <span className="flex flex-col">
                <span className="text-body text-cream-100">{option.label}</span>
                {option.helper ? (
                  <span className="text-meta text-text-muted">{option.helper}</span>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
