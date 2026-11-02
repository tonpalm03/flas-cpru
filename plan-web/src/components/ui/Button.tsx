import React from "react"
import { Icon, IconName } from "./Icons"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
  icon?: IconName
  iconRight?: IconName
  children?: React.ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"

  // มือถือ: ปุ่มสูงพอให้นิ้วกดได้แม่น (อย่างน้อย 40–48px)
  const sizes = {
    sm: "px-3 py-1.5 text-xs max-lg:min-h-10 max-lg:px-3.5",
    md: "px-4 py-2 text-sm max-lg:min-h-11",
    lg: "px-5 py-2.5 text-base font-semibold max-lg:min-h-12",
  }

  const variants = {
    primary: "bg-brand text-white hover:bg-brand-hover active:bg-brand-strong shadow-sm",
    accent: "bg-accent text-brand hover:bg-accent-hover active:bg-accent-hover font-semibold shadow-sm",
    outline: "border border-line-strong bg-white text-ink hover:bg-surface shadow-xs",
    danger: "bg-[#D76556] text-white hover:bg-[#c95344] active:bg-[#b84537] shadow-sm",
    ghost: "text-ink hover:bg-black/5",
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
    </button>
  )
}
