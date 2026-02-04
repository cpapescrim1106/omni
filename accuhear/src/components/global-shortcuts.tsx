"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const SEQUENCE_TIMEOUT_MS = 800;
const PATIENT_SEARCH_FOCUS_KEY = "accuhear:patient-search-focus";

function isEditableTarget(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function GlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const lastKeyRef = useRef<{ key: string; time: number } | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const now = Date.now();
      const last = lastKeyRef.current;

      if (key === "p") {
        lastKeyRef.current = { key: "p", time: now };
        return;
      }

      if (key === "s") {
        if (last?.key === "p" && now - last.time <= SEQUENCE_TIMEOUT_MS) {
          event.preventDefault();
          lastKeyRef.current = null;
          if (pathname === "/patients") {
            window.dispatchEvent(new CustomEvent("patient-search:focus"));
          } else {
            window.sessionStorage.setItem(PATIENT_SEARCH_FOCUS_KEY, "1");
            router.push("/patients");
          }
          return;
        }
      }

      lastKeyRef.current = null;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return null;
}

export function consumePatientSearchFocusFlag() {
  if (typeof window === "undefined") return false;
  const hasFlag = window.sessionStorage.getItem(PATIENT_SEARCH_FOCUS_KEY) === "1";
  if (hasFlag) {
    window.sessionStorage.removeItem(PATIENT_SEARCH_FOCUS_KEY);
  }
  return hasFlag;
}
