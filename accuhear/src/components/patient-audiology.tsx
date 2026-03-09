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

const TABS = ["Pure tone", "Speech", "Impedance"] as const;

type TabKey = (typeof TABS)[number];

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
  const [activeTab, setActiveTab] = useState<TabKey>("Pure tone");

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
        const normalizedY = clamp((point.decibel - MIN_DECIBEL) / (MAX_DECIBEL - MIN_DECIBEL));
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

  return (
    <section className="card p-6" data-testid="audiology-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Audiology</div>
          <div className="text-sm text-ink-muted">Review audiograms and diagnostic data.</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className="tab-pill"
            data-active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-ink-muted">Loading audiograms...</div>
      ) : loadError ? (
        <div className="mt-6 text-sm text-danger">{loadError}</div>
      ) : activeTab !== "Pure tone" ? (
        <div className="mt-6 rounded-2xl border border-dashed border-surface-3 bg-white/70 px-4 py-6 text-sm text-ink-muted">
          {activeTab} details will be available here.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
            <div className="text-xs font-semibold text-ink-muted">Audiological history</div>
            <div className="mt-3 grid gap-2">
              {audiograms.length === 0 ? (
                <div className="text-xs text-ink-muted">No audiograms recorded yet.</div>
              ) : (
                audiograms.map((audiogram) => (
                  <div
                    key={audiogram.id}
                    className="rounded-xl border border-surface-2 bg-white px-3 py-2 text-xs"
                  >
                    {dayjs(audiogram.createdAt).format("MM/DD/YYYY")} - {EAR_LABEL[audiogram.ear]} ear
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="tab-pill bg-surface-2 text-xs">Hide documents</button>
              <button type="button" className="tab-pill bg-surface-2 text-xs">Hide journal entries</button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
              <div className="grid gap-3 sm:grid-cols-2 text-xs text-ink-muted">
                <div>
                  <div className="font-semibold text-ink-strong">Provider</div>
                  <div>Chris Pape</div>
                </div>
                <div>
                  <div className="font-semibold text-ink-strong">Test method</div>
                  <div>Not specified</div>
                </div>
                <div>
                  <div className="font-semibold text-ink-strong">Device</div>
                  <div>Avant A2D+</div>
                </div>
                <div>
                  <div className="font-semibold text-ink-strong">Calibration date</div>
                  <div>07/01/2025</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <div className="rounded-full bg-brand-orange/10 px-3 py-1 text-brand-ink">Right: Mild</div>
                <div className="rounded-full bg-brand-orange/10 px-3 py-1 text-brand-ink">Sensorineural</div>
                <div className="rounded-full bg-brand-orange/10 px-3 py-1 text-brand-ink">Sloping</div>
                <div className="rounded-full bg-brand-blue/10 px-3 py-1 text-brand-ink">Left: Moderately severe</div>
                <div className="rounded-full bg-brand-blue/10 px-3 py-1 text-brand-ink">Sensorineural</div>
                <div className="rounded-full bg-brand-blue/10 px-3 py-1 text-brand-ink">Sloping</div>
              </div>
            </div>

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

            <div className="rounded-2xl border border-surface-2 bg-white/80 p-4">
              <div className="text-xs font-semibold text-ink-muted">Diagnostic codes</div>
              <div className="mt-2 rounded-xl border border-dashed border-surface-3 bg-white/70 px-3 py-4 text-xs text-ink-muted">
                Diagnostic codes will appear here.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="tab-pill bg-surface-2 text-xs">Create new</button>
              <button type="button" className="tab-pill bg-surface-2 text-xs">Edit</button>
              <button type="button" className="tab-pill bg-surface-2 text-xs">Delete</button>
              <button type="button" className="tab-pill bg-surface-2 text-xs">Refresh</button>
              <button type="button" className="tab-pill bg-surface-2 text-xs">Reports</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
