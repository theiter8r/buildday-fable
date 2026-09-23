/** Builds the `aria-describedby` value for a field's control from its helper/error ids. */
export function fieldDescribedBy(id: string, helper?: string, error?: string): string | undefined {
  const ids = [helper ? `${id}-helper` : null, error ? `${id}-error` : null].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}
