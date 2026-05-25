import { getAllFieldErrors, getErrorMessage } from '../services/api-error'

type ActionErrorPanelProps = {
  error: unknown
  actionLabel: string
  fieldLabels?: Record<string, string>
  className?: string
}

type FieldErrorTextProps = {
  messages: string[]
}

export function ActionErrorPanel({ error, actionLabel, fieldLabels, className }: ActionErrorPanelProps) {
  if (!error) return null

  const errorMessage = getErrorMessage(error)
  const fieldErrors = getAllFieldErrors(error)

  return (
    <div className={`rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)] ${className ?? ''}`}>
      <p className="font-semibold">{actionLabel} failed.</p>
      <p className="mt-1">{errorMessage}</p>
      {fieldErrors.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          {fieldErrors.map(([field, messages]) => (
            <li key={field}>
              <span className="font-semibold">{fieldLabels?.[field] ?? field}:</span> {messages.join(' ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FieldErrorText({ messages }: FieldErrorTextProps) {
  if (messages.length === 0) return null

  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10px] font-medium text-[var(--status-danger-text)]">
      {messages.map((message, index) => (
        <li key={`${message}-${index}`}>{message}</li>
      ))}
    </ul>
  )
}
