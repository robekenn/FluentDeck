import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-white text-slate-950 hover:scale-[1.02]",
  secondary: "border border-white/10 text-slate-200 hover:bg-white/10",
  success: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
  danger: "border border-red-400/30 text-red-200 hover:bg-red-500/10",
  ghost: "text-slate-300 hover:bg-white/10",
};

export default function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-2xl px-4 py-2.5 text-sm font-bold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}