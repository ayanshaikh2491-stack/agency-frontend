"use client";
import { useEffect } from "react";

export default function OfficeLayout({ children }) {
  // Prevent body scroll when office is full-screen
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>{children}</div>;
}