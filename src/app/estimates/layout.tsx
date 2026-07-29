import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./workspace.css";

export const metadata: Metadata = {
  title: "我的估算",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function EstimatesLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <div className="estimate-area">{children}</div>;
}
