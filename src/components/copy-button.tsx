"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this link:", text);
        }
      }}
      className="shrink-0 rounded-lg bg-honey px-3 py-2 text-sm font-semibold text-honey-ink"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
