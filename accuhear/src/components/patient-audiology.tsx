"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <section className="card p-4" data-testid="audiology-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title">Audiology</div>
          <div className="text-sm text-ink-muted">Review audiograms and diagnostic data.</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="seg-tabs-inner">
          {TABS.map((tab) => (
            <Button
              key={tab}
              type="button"
              variant="ghost"
              size="micro"
              className={cn("seg-tab", activeTab === tab && "active")}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>
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
          <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] overflow-hidden p-4">
            <div className="text-xs font-semibold text-ink-muted">Audiological history</div>
            <div className="mt-3 grid gap-2">
              {audiograms.length === 0 ? (
                <div className="text-xs text-ink-muted" data-testid="audiology-empty">No audiograms recorded yet.</div>
              ) : (
                audiograms.map((audiogram) => (
                  <div
                    key={audiogram.id}
                    data-testid="audiology-audiogram"
                    data-ear={audiogram.ear}
                    className="rounded-[8px] border border-[var(--surface-3)] bg-white px-3 py-2 text-xs"
                  >
                    {dayjs(audiogram.createdAt).format("MM/DD/YYYY")} - {EAR_LABEL[audiogram.ear]} ear
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm">Hide documents</Button>
              <Button type="button" variant="secondary" size="sm">Hide journal entries</Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] overflow-hidden p-4">
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
                <Badge variant="orange">Right: Mild</Badge>
                <Badge variant="orange">Sensorineural</Badge>
                <Badge variant="orange">Sloping</Badge>
                <Badge variant="blue">Left: Moderately severe</Badge>
                <Badge variant="blue">Sensorineural</Badge>
                <Badge variant="blue">Sloping</Badge>
              </div>
            </div>

            <div className="rounded-[12px] bg-[var(--surface-1)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", fontWeight: 600 }}>
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
              <div className="mt-4 rounded-[8px] border border-[var(--surface-3)] bg-white" style={{ overflow: "hidden" }}>
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

            <div className="rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] overflow-hidden p-4">
              <div className="text-xs font-semibold text-ink-muted">Diagnostic codes</div>
              <div className="mt-2 rounded-xl border border-dashed border-surface-3 bg-white/70 px-3 py-4 text-xs text-ink-muted">
                Diagnostic codes will appear here.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" data-testid="audiology-add">Create new</Button>
              <Button type="button" variant="secondary" size="sm">Edit</Button>
              <Button type="button" variant="secondary" size="sm">Delete</Button>
              <Button type="button" variant="secondary" size="sm">Refresh</Button>
              <Button type="button" variant="secondary" size="sm">Reports</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
