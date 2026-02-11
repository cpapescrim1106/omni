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
};

function useAutosizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
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
}: Props) {
  const { ref, resize } = useAutosizeTextarea(value);
  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="border-t border-surface-2 bg-white/80 p-4">
      <div className="flex items-end gap-3">
        {leading ? <div className="shrink-0 pb-1">{leading}</div> : null}
        <div className="min-w-0 flex-1">
          <textarea
            ref={ref}
            rows={1}
            className="max-h-[160px] w-full resize-none overflow-hidden rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm"
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
          <div className="mt-2 text-xs text-ink-muted">Enter to send. Shift+Enter for a new line.</div>
        </div>
        <button type="button" className="tab-pill text-xs" disabled={!canSend} onClick={onSend}>
          {sendLabel}
        </button>
      </div>
    </div>
  );
}

