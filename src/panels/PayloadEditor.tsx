/**
 * The incident payload editor: a Form/JSON segmented toggle, three presets,
 * and a JSON textarea validated live via `parseIncidentPayload`
 * (ARCHITECTURE.md §2, CONTENT.md §5).
 */
import { useState } from 'react'
import { SEVERITIES } from '@/domain/types'
import type { Severity } from '@/domain/types'
import { parseIncidentPayload } from '@/domain/schema'
import { useOpsflowStore } from '@/store'
import { Field } from '@/components/Field'
import { Select } from '@/components/Select'
import { Button } from '@/components/Button'
import { Tabs } from '@/components/Tabs'
import { INPUT_CLASSES, TEXTAREA_CLASSES } from './_fallback/inputClasses'
import { PAYLOAD_CONTENT } from './content'
import { PAYLOAD_PRESETS } from './payloadPresets'

const SEVERITY_OPTIONS = SEVERITIES.map((s) => ({ value: s, label: s[0]?.toUpperCase() + s.slice(1) }))

type Mode = 'form' | 'json'

export function PayloadEditor() {
  const payload = useOpsflowStore((s) => s.payload)
  const setPayload = useOpsflowStore((s) => s.setPayload)
  const updatePayloadField = useOpsflowStore((s) => s.updatePayloadField)
  const [mode, setMode] = useState<Mode>('form')
  const [jsonText, setJsonText] = useState(() => JSON.stringify(payload, null, 2))
  const [jsonError, setJsonError] = useState<string | undefined>(undefined)

  function changeMode(next: Mode) {
    if (next === 'json') {
      setJsonText(JSON.stringify(payload, null, 2))
      setJsonError(undefined)
    }
    setMode(next)
  }

  function onJsonChange(text: string) {
    setJsonText(text)
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setJsonError(PAYLOAD_CONTENT.jsonMode.errorInvalid)
      return
    }
    const result = parseIncidentPayload(parsed)
    if (!result.ok) {
      setJsonError(`${PAYLOAD_CONTENT.jsonMode.errorSchema} ${result.errors.join('; ')}`)
      return
    }
    setJsonError(undefined)
    setPayload(result.payload)
  }

  return (
    <section
      aria-label={PAYLOAD_CONTENT.title}
      data-testid="payload-editor"
      className="flex flex-col gap-3"
    >
      <div>
        <h3 className="text-title font-semibold text-cream-50">{PAYLOAD_CONTENT.title}</h3>
        <p className="text-meta text-text-muted">{PAYLOAD_CONTENT.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PAYLOAD_PRESETS.map((preset, index) => (
          <Button
            key={preset.name}
            variant="secondary"
            size="compact"
            data-testid={`payload-preset-${index}`}
            onClick={() => setPayload(preset.build())}
          >
            {preset.name}
          </Button>
        ))}
      </div>

      <Tabs
        label="Payload editing mode"
        value={mode}
        onChange={(id) => changeMode(id as Mode)}
        items={[
          {
            id: 'form',
            label: PAYLOAD_CONTENT.jsonMode.fieldsModeToggle,
            panel: (
              <div className="flex flex-col gap-3">
                <Field label={PAYLOAD_CONTENT.fields.title.label}>
                  <input
                    id="payload-field-title"
                    data-testid="payload-field-title"
                    className={INPUT_CLASSES}
                    placeholder={PAYLOAD_CONTENT.fields.title.placeholder}
                    value={payload.title}
                    onChange={(e) => updatePayloadField('title', e.target.value)}
                  />
                </Field>
                <Field label={PAYLOAD_CONTENT.fields.service.label}>
                  <input
                    id="payload-field-service"
                    data-testid="payload-field-service"
                    className={INPUT_CLASSES}
                    placeholder={PAYLOAD_CONTENT.fields.service.placeholder}
                    value={payload.service}
                    onChange={(e) => updatePayloadField('service', e.target.value)}
                  />
                </Field>
                <Field
                  label={PAYLOAD_CONTENT.fields.severity.label}
                  helper={PAYLOAD_CONTENT.fields.severity.helper}
                >
                  <Select
                    id="payload-field-severity"
                    data-testid="payload-field-severity"
                    options={SEVERITY_OPTIONS}
                    value={payload.severity}
                    onChange={(e) => updatePayloadField('severity', e.target.value as Severity)}
                  />
                </Field>
                <Field
                  label={PAYLOAD_CONTENT.fields.errorRate.label}
                  helper={PAYLOAD_CONTENT.fields.errorRate.helper}
                >
                  <input
                    id="payload-field-errorRate"
                    data-testid="payload-field-errorRate"
                    type="number"
                    min={0}
                    max={100}
                    className={INPUT_CLASSES}
                    value={Math.round(payload.errorRate * 1000) / 10}
                    onChange={(e) => updatePayloadField('errorRate', Number(e.target.value) / 100)}
                  />
                </Field>
                <Field label={PAYLOAD_CONTENT.fields.region.label}>
                  <input
                    id="payload-field-region"
                    data-testid="payload-field-region"
                    className={INPUT_CLASSES}
                    placeholder={PAYLOAD_CONTENT.fields.region.placeholder}
                    value={payload.region}
                    onChange={(e) => updatePayloadField('region', e.target.value)}
                  />
                </Field>
                <Field
                  label={PAYLOAD_CONTENT.fields.affectedUsers.label}
                  helper={PAYLOAD_CONTENT.fields.affectedUsers.helper}
                >
                  <input
                    id="payload-field-affectedUsers"
                    data-testid="payload-field-affectedUsers"
                    type="number"
                    min={0}
                    className={INPUT_CLASSES}
                    value={payload.affectedUsers}
                    onChange={(e) => updatePayloadField('affectedUsers', Number(e.target.value))}
                  />
                </Field>
                <Field
                  label={PAYLOAD_CONTENT.fields.source.label}
                  helper={PAYLOAD_CONTENT.fields.source.helper}
                >
                  <input
                    id="payload-field-source"
                    data-testid="payload-field-source"
                    className={INPUT_CLASSES}
                    value={payload.source}
                    onChange={(e) => updatePayloadField('source', e.target.value)}
                  />
                </Field>
                <Field
                  label={PAYLOAD_CONTENT.fields.detectedAt.label}
                  helper={PAYLOAD_CONTENT.fields.detectedAt.helper}
                >
                  <input
                    id="payload-field-detectedAt"
                    data-testid="payload-field-detectedAt"
                    type="datetime-local"
                    className={INPUT_CLASSES}
                    value={toLocalInputValue(payload.detectedAt)}
                    onChange={(e) => updatePayloadField('detectedAt', fromLocalInputValue(e.target.value))}
                  />
                </Field>
              </div>
            ),
          },
          {
            id: 'json',
            label: PAYLOAD_CONTENT.jsonMode.toggle,
            panel: (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="payload-json" className="sr-only">
                  Workflow payload JSON
                </label>
                <textarea
                  id="payload-json"
                  data-testid="payload-json-textarea"
                  className={`${TEXTAREA_CLASSES} min-h-48 font-[family-name:var(--font-mono)]`}
                  aria-invalid={Boolean(jsonError)}
                  aria-describedby="payload-json-status"
                  value={jsonText}
                  onChange={(e) => onJsonChange(e.target.value)}
                />
                <p
                  id="payload-json-status"
                  role={jsonError ? 'alert' : 'status'}
                  className={`text-meta ${jsonError ? 'text-[var(--color-state-error)]' : 'text-[var(--color-state-success)]'}`}
                >
                  {jsonError ?? 'Valid payload'}
                </p>
                <p className="text-meta text-text-muted">{PAYLOAD_CONTENT.jsonMode.helper}</p>
              </div>
            ),
          },
        ]}
      />
    </section>
  )
}

function toLocalInputValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInputValue(local: string): string {
  const date = new Date(local)
  return Number.isNaN(date.getTime()) ? local : date.toISOString()
}
