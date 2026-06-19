import type { ReactNode } from "react";

export default function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-5">
        <h2 className="text-xl font-black">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>

      {children}
    </section>
  );
}