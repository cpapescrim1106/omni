"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  leading?: React.ReactNode;
  sendLabel?: string;
  hint?: string;
  showSendButton?: boolean;
};

function useAutosizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    // Hide scrollbars/grip unless we hit the max height.
    const maxPx = 160;
    el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resize();
  }, [resize, value]);

  return { ref, resize };
}

export function MessageResponseBar({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Write a message...",
  leading,
  sendLabel = "Send",
  hint = "Enter to send · Shift+Enter for a new line",
  showSendButton = true,
}: Props) {
  const { ref, resize } = useAutosizeTextarea(value);
  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="border-t border-surface-2 bg-white/70 p-4">
      <div className="rounded-2xl border border-surface-2 bg-surface-1/60 p-2">
        <div className="flex items-end gap-2">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          <div className="min-w-0 flex-1">
            <textarea
              ref={ref}
              rows={1}
              className="max-h-[160px] w-full resize-none appearance-none overflow-y-hidden rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm text-ink-strong placeholder:text-ink-soft focus:border-surface-3 focus:bg-white focus:outline-none"
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                resize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) onSend();
                }
              }}
            />
          </div>
          {showSendButton ? (
            <button
              type="button"
              aria-label="Send message"
              className="grid h-8 w-8 place-items-center rounded-full bg-brand-blue text-white shadow-sm transition hover:bg-brand-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSend}
              onClick={onSend}
              title={sendLabel}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 4l6 6-1.41 1.41L13 7.83V20h-2V7.83L7.41 11.41 6 10l6-6z"
                />
              </svg>
            </button>
          ) : null}
        </div>
        {hint ? <div className="px-3 pb-1 pt-1 text-[11px] text-ink-soft">{hint}</div> : null}
      </div>
    </div>
  );
}
