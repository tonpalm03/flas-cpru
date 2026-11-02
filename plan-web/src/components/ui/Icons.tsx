import React from "react"

export type IconName =
  | "home"
  | "wallet"
  | "folder"
  | "receipt"
  | "report"
  | "settings"
  | "bell"
  | "search"
  | "chevron"
  | "back"
  | "clock"
  | "check"
  | "alert"
  | "calendar"
  | "trend"
  | "close"
  | "plus"
  | "upload"
  | "user"
  | "send"
  | "edit"
  | "return"
  | "lock"
  | "eye"
  | "download"
  | "building"
  | "menu"
  | "trash"
  | "more"
  | "logout"
  | "phone"
  | "share"

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 20, className = "" }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" />
        <path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z" />
      </>
    ),
    folder: <path d="M3 5h6l2 2h10v12H3z" />,
    trash: (
      <>
        <path d="M4 7h16M10 11v6M14 11v6" />
        <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
      </>
    ),
    receipt: (
      <>
        <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    report: (
      <>
        <path d="M5 3h14v18H5z" />
        <path d="M9 16V9M13 16v-4M17 16V7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 9 7L6.6 6 4.5 9.5 6.6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A8 8 0 0 0 10.5 18l.3 2.6h4L15 18a8 8 0 0 0 1.5-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    back: <path d="m15 18-6-6 6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="M12 3 2.8 20h18.4z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    trend: (
      <>
        <path d="m3 17 6-6 4 4 8-9" />
        <path d="M15 6h6v6" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    plus: <path d="M12 5v14M5 12h14" />,
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M4 15v5h16v-5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    send: (
      <>
        <path d="m3 3 18 9-18 9 4-9z" />
        <path d="M7 12h14" />
      </>
    ),
    edit: (
      <>
        <path d="m14 5 5 5L8 21H3v-5z" />
        <path d="m12 7 5 5" />
      </>
    ),
    return: (
      <>
        <path d="M9 8 4 12l5 4" />
        <path d="M4 12h10a6 6 0 0 1 6 6" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v12M7 11l5 5 5-5" />
        <path d="M4 20h16" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1.2" />
        <circle cx="12" cy="12" r="1.2" />
        <circle cx="19" cy="12" r="1.2" />
      </>
    ),
    logout: (
      <>
        <path d="M15 4h4v16h-4" />
        <path d="M10 8l-4 4 4 4M6 12h10" />
      </>
    ),
    phone: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2.5" />
        <path d="M11 18h2" />
      </>
    ),
    share: (
      <>
        <path d="M12 3v12M8 7l4-4 4 4" />
        <path d="M6 11H5v10h14V11h-1" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || paths.home}
    </svg>
  )
}
