import React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = "", ...props }: CardProps) {
  // ส่งสีพื้นมาเอง (เช่น bg-brand-strong) → ไม่ใส่พื้นขาว เพราะ class ของ Tailwind ไม่ได้ทับกันตามลำดับที่เขียน
  const background = /(^|\s)bg-/.test(className) ? "" : "bg-white"
  return (
    <div
      className={`rounded-2xl border border-line ${background} shadow-[0_2px_12px_rgba(16,47,43,0.04)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
