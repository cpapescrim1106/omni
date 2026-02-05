"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

const MIN_FREQUENCY_HZ = 125;
const MAX_FREQUENCY_HZ = 8000;
const MIN_DECIBEL = -10;
const MAX_DECIBEL = 120;

const CHART_WIDTH = 520;
const CHART_HEIGHT = 280;
const CHART_PADDING = 32;

type AudiogramPoint = {
  id: string;
  frequencyHz: number;
  decibel: number;
};

type Audiogram = {
  id: string;
  ear: "L" | "R";
  createdAt: string;
  notes?: string | null;
  points: AudiogramPoint[];
};

const EAR_LABEL: Record<Audiogram["ear"], string> = {
  L: "Left",
  R: "Right",
};

function clamp(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function PatientAudiology({ patientId }: { patientId: string }) {
  const [audiograms, setAudiograms] = useState<Audiogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formEar, setFormEar] = useState<Audiogram["ear"]>("L");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formFrequency, setFormFrequency] = useState("");
  const [formDecibel, setFormDecibel] = useState("");
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const loadAudiograms = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/audiograms`);
      if (!response.ok) {
        throw new Error("Unable to load audiograms.");
      }
      const payload = await response.json();
      const data = (payload.audiograms ?? []) as Audiogram[];
      setAudiograms(data);
    } catch {
      setLoadError("Unable to load audiograms.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadAudiograms();
  }, [loadAudiograms]);

  const chartPoints = useMemo(
    () =>
      audiograms.flatMap((audiogram) =>
        (audiogram.points ?? []).map((point) => ({
          ...point,
          ear: audiogram.ear,
          audiogramId: audiogram.id,
        }))
      ),
    [audiograms]
  );

  const plottedPoints = useMemo(
    () =>
      chartPoints.map((point, index) => {
        const normalizedX = clamp(
          (point.frequencyHz - MIN_FREQUENCY_HZ) / (MAX_FREQUENCY_HZ - MIN_FREQUENCY_HZ)
        );
        const normalizedY = clamp(
          (point.decibel - MIN_DECIBEL) / (MAX_DECIBEL - MIN_DECIBEL)
        );
        const x = CHART_PADDING + normalizedX * (CHART_WIDTH - CHART_PADDING * 2);
        const y = CHART_HEIGHT - CHART_PADDING - normalizedY * (CHART_HEIGHT - CHART_PADDING * 2);
        return {
          ...point,
          x,
          y,
          key: `${point.audiogramId}-${point.frequencyHz}-${point.decibel}-${index}`,
        };
      }),
    [chartPoints]
  );

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setFormEar("L");
    setFormDate("");
    setFormNotes("");
    setFormFrequency("");
    setFormDecibel("");
    setFormNotice(null);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormNotice("Audiogram saving is coming soon. This form is a stub.");
  }, []);

  return (
    <section className="card p-6" data-testid="audiology-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Audiology</div>
          <div className="text-sm text-ink-muted">Track audiograms and hearing thresholds.</div>
        </div>
        <button
          className="rounded-full border border-transparent bg-brand-blue/10 px-4 py-2 text-xs font-semibold text-brand-ink"
          type="button"
          onClick={openModal}
          data-testid="audiology-add"
        >
          Add audiogram
        </button>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-ink-muted">Loading audiograms...</div>
      ) : loadError ? (
        <div className="mt-6 text-sm text-danger">{loadError}</div>
      ) : audiograms.length === 0 ? (
        <div
          className="mt-6 rounded-2xl border border-dashed border-surface-3 bg-white/70 px-4 py-6 text-sm text-ink-muted"
          data-testid="audiology-empty"
        >
          No audiograms recorded yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
              <span>Frequency (Hz) vs dB HL</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand-blue)" }} />
                  Left ear
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand-orange)" }} />
                  Right ear
                </span>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2 bg-white">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="h-64 w-full"
                role="img"
                aria-label="Audiogram chart"
                data-testid="audiology-chart"
              >
                <rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} fill="white" />
                <line
                  x1={CHART_PADDING}
                  y1={CHART_PADDING}
                  x2={CHART_PADDING}
                  y2={CHART_HEIGHT - CHART_PADDING}
                  stroke="var(--surface-3)"
                  strokeWidth="1"
                />
                <line
                  x1={CHART_PADDING}
                  y1={CHART_HEIGHT - CHART_PADDING}
                  x2={CHART_WIDTH - CHART_PADDING}
                  y2={CHART_HEIGHT - CHART_PADDING}
                  stroke="var(--surface-3)"
                  strokeWidth="1"
                />
                {plottedPoints.map((point) => (
                  <circle
                    key={point.key}
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill={point.ear === "L" ? "var(--brand-blue)" : "var(--brand-orange)"}
                    data-testid="audiology-chart-point"
                    data-ear={point.ear}
                    data-frequency={point.frequencyHz}
                    data-decibel={point.decibel}
                  />
                ))}
              </svg>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-2 bg-white/80">
            <div className="px-4 pt-4 text-xs font-semibold text-ink-muted">Audiograms</div>
            <div className="mt-2 divide-y divide-surface-2">
              {audiograms.map((audiogram) => (
                <div
                  key={audiogram.id}
                  className="flex flex-col gap-2 px-4 py-4"
                  data-testid="audiology-audiogram"
                  data-ear={audiogram.ear}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-ink-strong">
                        {EAR_LABEL[audiogram.ear]} ear audiogram
                      </div>
                      <div className="text-xs text-ink-muted">
                        {dayjs(audiogram.createdAt).format("MMM D, YYYY")} ·{" "}
                        {audiogram.points?.length ?? 0} points
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        audiogram.ear === "L" ? "bg-brand-blue/10" : "bg-brand-orange/10"
                      }`}
                    >
                      {audiogram.ear}
                    </span>
                  </div>
                  {audiogram.notes ? (
                    <div className="text-xs text-ink-soft">{audiogram.notes}</div>
                  ) : (
                    <div className="text-xs text-ink-soft">No notes.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="audiology-modal"
        >
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink-strong">Add audiogram</div>
                <div className="text-xs text-ink-muted">Capture a new hearing test.</div>
              </div>
              <button
                type="button"
                className="text-xs text-ink-muted"
                onClick={closeModal}
                data-testid="audiology-modal-close"
              >
                Close
              </button>
            </div>

            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-xs text-ink-muted" htmlFor="audiology-modal-ear">
                Ear
                <select
                  id="audiology-modal-ear"
                  data-testid="audiology-modal-ear"
                  className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-sm"
                  value={formEar}
                  onChange={(event) => setFormEar(event.target.value as Audiogram["ear"])}
                >
                  <option value="L">Left</option>
                  <option value="R">Right</option>
                </select>
              </label>
              <label className="grid gap-2 text-xs text-ink-muted" htmlFor="audiology-modal-date">
                Test date
                <input
                  id="audiology-modal-date"
                  data-testid="audiology-modal-date"
                  type="date"
                  className="rounded-xl border border-surface-3 px-3 py-2 text-sm"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-xs text-ink-muted" htmlFor="audiology-modal-notes">
                Notes
                <textarea
                  id="audiology-modal-notes"
                  data-testid="audiology-modal-notes"
                  className="min-h-[90px] rounded-xl border border-surface-3 px-3 py-2 text-sm"
                  placeholder="Add notes about this test."
                  value={formNotes}
                  onChange={(event) => setFormNotes(event.target.value)}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-xs text-ink-muted" htmlFor="audiology-modal-frequency">
                  Frequency (Hz)
                  <input
                    id="audiology-modal-frequency"
                    data-testid="audiology-modal-frequency"
                    className="rounded-xl border border-surface-3 px-3 py-2 text-sm"
                    placeholder="500"
                    value={formFrequency}
                    onChange={(event) => setFormFrequency(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-xs text-ink-muted" htmlFor="audiology-modal-decibel">
                  dB HL
                  <input
                    id="audiology-modal-decibel"
                    data-testid="audiology-modal-decibel"
                    className="rounded-xl border border-surface-3 px-3 py-2 text-sm"
                    placeholder="20"
                    value={formDecibel}
                    onChange={(event) => setFormDecibel(event.target.value)}
                  />
                </label>
              </div>

              {formNotice ? (
                <div
                  className="rounded-2xl bg-brand-blue/10 px-3 py-2 text-xs text-brand-ink"
                  data-testid="audiology-modal-notice"
                >
                  {formNotice}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full border border-surface-3 px-4 py-2 text-xs font-semibold text-ink-muted"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full border border-transparent bg-brand-blue/10 px-4 py-2 text-xs font-semibold text-brand-ink"
                  data-testid="audiology-modal-submit"
                >
                  Save audiogram
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
