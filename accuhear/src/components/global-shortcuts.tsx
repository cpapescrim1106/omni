"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  const [isShortcutMenuOpen, setIsShortcutMenuOpen] = useState(false);

  const shortcuts = [
    { keys: ["P", "P"], label: "Patient search" },
    { keys: ["P", "N"], label: "New patient" },
    { keys: ["P", "S"], label: "Scheduling" },
    { keys: ["P", "M"], label: "Marketing" },
    { keys: ["P", "R"], label: "Recalls" },
    { keys: ["P", "I"], label: "Messages inbox" },
    { keys: ["?", "?"], label: "Shortcuts menu" },
  ];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const now = Date.now();
      const last = lastKeyRef.current;
      const withinSequence = last && now - last.time <= SEQUENCE_TIMEOUT_MS;

      if (isShortcutMenuOpen) {
        if (key === "escape") {
          event.preventDefault();
          setIsShortcutMenuOpen(false);
          lastKeyRef.current = null;
        }
        return;
      }

      if (key === "?") {
        if (last?.key === "?" && withinSequence) {
          event.preventDefault();
          lastKeyRef.current = null;
          setIsShortcutMenuOpen(true);
          return;
        }
        lastKeyRef.current = { key: "?", time: now };
        return;
      }

      if (key === "p") {
        if (last?.key === "p" && withinSequence) {
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
        lastKeyRef.current = { key: "p", time: now };
        return;
      }

      if (key === "s") {
        if (last?.key === "p" && withinSequence) {
          event.preventDefault();
          lastKeyRef.current = null;
          if (pathname !== "/scheduling") {
            router.push("/scheduling");
          }
          return;
        }
      }

      if (key === "n") {
        if (last?.key === "p" && withinSequence) {
          event.preventDefault();
          lastKeyRef.current = null;
          if (pathname !== "/patients/new") {
            router.push("/patients/new");
          }
          return;
        }
      }

      if (key === "m") {
        if (last?.key === "p" && withinSequence) {
          event.preventDefault();
          lastKeyRef.current = null;
          if (pathname !== "/marketing") {
            router.push("/marketing");
          }
          return;
        }
      }

      if (key === "r") {
        if (last?.key === "p" && withinSequence) {
          event.preventDefault();
          lastKeyRef.current = null;
          if (pathname !== "/recalls") {
            router.push("/recalls");
          }
          return;
        }
      }

      if (key === "i") {
        if (last?.key === "p" && withinSequence) {
          event.preventDefault();
          lastKeyRef.current = null;
          if (pathname !== "/messages") {
            router.push("/messages");
          }
          return;
        }
      }

      lastKeyRef.current = null;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutMenuOpen, pathname, router]);

  return (
    <>
      {isShortcutMenuOpen ? (
        <div
          className="shortcut-modal-overlay"
          role="dialog"
          aria-modal="true"
          data-testid="shortcut-menu"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsShortcutMenuOpen(false);
              lastKeyRef.current = null;
            }
          }}
        >
          <div className="shortcut-modal-card">
            <div className="shortcut-modal-header">
              <div>
                <div className="section-title text-xs text-brand-ink">Keyboard shortcuts</div>
                <div className="text-sm text-ink-muted">Press ? then ? to open this menu.</div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsShortcutMenuOpen(false);
                  lastKeyRef.current = null;
                }}
              >
                Close
              </Button>
            </div>
            <div className="shortcut-modal-list">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.label} className="shortcut-modal-row">
                  <div className="shortcut-modal-keys">
                    {shortcut.keys.map((keyLabel, index) => (
                      <span key={`${shortcut.label}-${keyLabel}-${index}`} className="shortcut-key">
                        {keyLabel}
                      </span>
                    ))}
                  </div>
                  <div className="shortcut-modal-label">{shortcut.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function consumePatientSearchFocusFlag() {
  if (typeof window === "undefined") return false;
  const hasFlag = window.sessionStorage.getItem(PATIENT_SEARCH_FOCUS_KEY) === "1";
  if (hasFlag) {
    window.sessionStorage.removeItem(PATIENT_SEARCH_FOCUS_KEY);
  }
  return hasFlag;
}
