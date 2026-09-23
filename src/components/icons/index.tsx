import type { ReactNode } from 'react'

/**
 * Shared prop contract for every icon in this module.
 * `title` supplies an accessible name; when omitted the icon is
 * marked `aria-hidden` so screen readers skip purely decorative glyphs.
 */
export type IconProps = {
  size?: number
  className?: string
  title?: string
}

type BaseProps = IconProps & { children: ReactNode }

function IconBase({ size = 24, className, title, children }: BaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export function TriggerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </IconBase>
  )
}

export function ConditionIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12 9 7l5 5-5 5-5-5Z" />
      <path d="M14 12h3M17 12l3-4M17 12l3 4" />
    </IconBase>
  )
}

export function ActionIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </IconBase>
  )
}

export function ApprovalIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 19 6v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6Z" />
      <path d="M9 12l2 2 4-4" />
    </IconBase>
  )
}

export function ResolutionIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </IconBase>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 4l13 8-13 8V4Z" />
    </IconBase>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 4v16M16 4v16" />
    </IconBase>
  )
}

export function StepForwardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 4l10 8-10 8V4Z" />
      <path d="M18 4v16" />
    </IconBase>
  )
}

export function ResetIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </IconBase>
  )
}

export function UndoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h11a5 5 0 0 1 0 10h-2" />
    </IconBase>
  )
}

export function RedoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15 7l5 5-5 5" />
      <path d="M20 12H9a5 5 0 0 0 0 10h2" />
    </IconBase>
  )
}

export function FitViewIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 9V4h5" />
      <path d="M15 4h5v5" />
      <path d="M20 15v5h-5" />
      <path d="M9 20H4v-5" />
    </IconBase>
  )
}

export function ZoomInIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M11 8v6M8 11h6" />
    </IconBase>
  )
}

export function ZoomOutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M8 11h6" />
    </IconBase>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </IconBase>
  )
}

export function UploadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21V9" />
      <path d="M7 14l5-5 5 5" />
      <path d="M4 19h16" />
    </IconBase>
  )
}

export function ClipboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </IconBase>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6M14 11v6" />
    </IconBase>
  )
}

export function DuplicateIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </IconBase>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconBase>
  )
}

export function WarningIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 22 20H2Z" />
      <path d="M12 9v5" />
      <path d="M12 17v.01" />
    </IconBase>
  )
}

export function ErrorIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </IconBase>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8v.01" />
    </IconBase>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 13l4 4 10-10" />
    </IconBase>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l4 2" />
    </IconBase>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 9l6 6 6-6" />
    </IconBase>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 6l6 6-6 6" />
    </IconBase>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconBase>
  )
}

export function PaletteIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconBase>
  )
}

export function InspectorIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h3M12 6h8" />
      <circle cx="9" cy="6" r="2" />
      <path d="M4 12h9M18 12h2" />
      <circle cx="15" cy="12" r="2" />
      <path d="M4 18h1M10 18h10" />
      <circle cx="7" cy="18" r="2" />
    </IconBase>
  )
}

export function TimelineIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
    </IconBase>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </IconBase>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1" />
      <path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" />
    </IconBase>
  )
}

/** Workflow node categories that pair with `NodeTypeIcon`. */
export type NodeType = 'trigger' | 'condition' | 'action' | 'approval' | 'resolution'

const NODE_TYPE_ICON_MAP: Record<NodeType, (props: IconProps) => ReactNode> = {
  trigger: TriggerIcon,
  condition: ConditionIcon,
  action: ActionIcon,
  approval: ApprovalIcon,
  resolution: ResolutionIcon,
}

export function NodeTypeIcon({ type, ...props }: IconProps & { type: NodeType }) {
  const Icon = NODE_TYPE_ICON_MAP[type]
  return <Icon {...props} />
}

/** Stable list of every icon name exported by this module, for galleries/tests. */
export const ICON_NAMES = [
  'TriggerIcon',
  'ConditionIcon',
  'ActionIcon',
  'ApprovalIcon',
  'ResolutionIcon',
  'PlayIcon',
  'PauseIcon',
  'StepForwardIcon',
  'ResetIcon',
  'UndoIcon',
  'RedoIcon',
  'FitViewIcon',
  'ZoomInIcon',
  'ZoomOutIcon',
  'DownloadIcon',
  'UploadIcon',
  'ClipboardIcon',
  'TrashIcon',
  'DuplicateIcon',
  'PlusIcon',
  'CloseIcon',
  'WarningIcon',
  'ErrorIcon',
  'InfoIcon',
  'CheckIcon',
  'ClockIcon',
  'ChevronDownIcon',
  'ChevronRightIcon',
  'MenuIcon',
  'PaletteIcon',
  'InspectorIcon',
  'TimelineIcon',
  'SearchIcon',
  'LinkIcon',
] as const
