"use client";

import { useEffect } from "react";

/**
 * Makes the ⌘K badge on Home's search field real rather than decorative —
 * Cmd/Ctrl+K focuses the search input from anywhere on the page.
 */
export function SearchShortcut() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const el = document.querySelector<HTMLInputElement>(".home-search .search");
        if (el) {
          e.preventDefault();
          el.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
