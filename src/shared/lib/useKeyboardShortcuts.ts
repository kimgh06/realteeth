import { useEffect, useRef } from "react";

export function useKeyboardShortcuts(onSearchOpen: () => void) {
  const callbackRef = useRef(onSearchOpen);
  callbackRef.current = onSearchOpen;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !isInputFocused()) {
        e.preventDefault();
        callbackRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}

function isInputFocused(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    (active as HTMLElement)?.isContentEditable === true
  );
}
