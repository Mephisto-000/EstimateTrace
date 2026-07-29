import type { ReactNode } from "react";

type CalloutProps = {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning" | "neutral";
};

export function Callout({ title, children, tone = "neutral" }: CalloutProps) {
  return (
    <aside className={`callout callout--${tone}`}>
      <p className="callout__title">{title}</p>
      <div>{children}</div>
    </aside>
  );
}
