import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export default function Button({ variant = "secondary", className = "", children, ...props }: ButtonProps) {
  const variants = {
    primary: "border-blue-500 bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-950/15",
    secondary: "border-line bg-surface text-foreground hover:bg-navbar",
    ghost: "border-transparent text-muted hover:bg-foreground/5 hover:text-foreground",
    danger: "border-red-400/20 bg-red-400/10 text-red-400 hover:bg-red-400/20 light:text-red-600",
  };
  return <button type="button" className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors disabled:opacity-35 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}