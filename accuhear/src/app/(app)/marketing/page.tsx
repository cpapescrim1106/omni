"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OUTCOME_OPTIONS = [
  { value: "all", label: "All outcomes" },
  { value: "scheduled", label: "Scheduled" },
  { value: "no_answer", label: "No Answer" },
  { value: "callback", label: "Callback" },
  { value: "not_interested", label: "Not Interested" },
];

const CHANNEL_OPTIONS = [
  { value: "all", label: "All channels" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "mail", label: "Mail" },
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
];

const OUTCOME_LABELS = new Map(OUTCOME_OPTIONS.map((option) => [option.value, option.label]));
const CHANNEL_LABELS = new Map(CHANNEL_OPTIONS.map((option) => [option.value, option.label]));

function outcomeBadgeVariant(outcome: string): NonNullable<Parameters<typeof Badge>[0]["variant"]> {
  switch (outcome) {
    case "scheduled":
      return "success";
    case "callback":
      return "blue";
    case "no_answer":
      return "warning";
    case "not_interested":
      return "neutral";
    default:
      return "neutral";
  }
}

type MarketingContact = {
  id: string;
  campaignName: string;
  channel: string;
  contactDate: string;
  outcome: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    preferredName?: string | null;
  };
};

export default function MarketingPage() {
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (outcomeFilter !== "all") params.set("outcome", outcomeFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const loadContacts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/marketing-contacts?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setContacts([]);
          return;
        }
        const payload = await response.json();
        setContacts(payload.contacts ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setContacts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    };

    void loadContacts();
    return () => controller.abort();
  }, [outcomeFilter, startDate, endDate]);

  const filteredContacts = useMemo(() => {
    if (channelFilter === "all") return contacts;
    return contacts.filter((contact) => contact.channel === channelFilter);
  }, [channelFilter, contacts]);

  const handleRowClick = (patientId: string) => {
    window.open(`/patients/${patientId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="section-title text-xs text-brand-ink">Marketing Contacts</div>
            <div className="text-sm text-ink-muted">Latest outreach and referral touchpoints.</div>
          </div>
          <div className="text-xs text-ink-muted">{loading ? "Loading..." : `${filteredContacts.length} contacts`}</div>
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-surface-2 bg-white/80 p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <Label className="flex items-center gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
              <span>Outcome</span>
              <Select value={outcomeFilter} onValueChange={(value) => value && setOutcomeFilter(value)}>
                <SelectTrigger className="w-[160px] bg-white text-xs" data-testid="marketing-filter-outcome">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {OUTCOME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </Label>
            <Label className="flex items-center gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
              <span>Channel</span>
              <Select value={channelFilter} onValueChange={(value) => value && setChannelFilter(value)}>
                <SelectTrigger className="w-[160px] bg-white text-xs" data-testid="marketing-filter-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {CHANNEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </Label>
            <Label className="flex items-center gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
              <span>From</span>
              <input
                type="date"
                className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
                value={startDate}
                data-testid="marketing-filter-start"
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Label>
            <Label className="flex items-center gap-2 font-body text-xs font-normal normal-case tracking-normal text-ink-muted">
              <span>To</span>
              <input
                type="date"
                className="rounded-xl border border-surface-3 bg-white px-3 py-2 text-xs"
                value={endDate}
                data-testid="marketing-filter-end"
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Label>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2">
          <table className="table" data-testid="marketing-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Channel</th>
                <th>Campaign</th>
                <th>Date</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length ? (
                filteredContacts.map((contact) => {
                  const displayName = `${contact.patient.lastName}, ${contact.patient.firstName}${
                    contact.patient.preferredName ? ` (${contact.patient.preferredName})` : ""
                  }`;
                  return (
                    <tr
                      key={contact.id}
                      data-testid="marketing-row"
                      className="cursor-pointer transition-colors hover:bg-surface-1"
                      onClick={() => handleRowClick(contact.patient.id)}
                    >
                      <td className="font-medium text-ink-strong">{displayName}</td>
                      <td>{CHANNEL_LABELS.get(contact.channel) ?? contact.channel}</td>
                      <td>{contact.campaignName}</td>
                      <td>{dayjs(contact.contactDate).format("MMM D, YYYY")}</td>
                      <td>
                        <Badge variant={outcomeBadgeVariant(contact.outcome)}>
                          {OUTCOME_LABELS.get(contact.outcome) ?? contact.outcome}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : hasLoaded ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-sm text-ink-muted" data-testid="marketing-empty">
                    No marketing contacts match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="glass-panel flex flex-col gap-4 p-5">
        <div>
          <div className="section-title text-xs text-brand-ink">Referral Setup</div>
          <div className="text-xs text-ink-muted">Admin-configurable lists.</div>
        </div>
        <div className="rounded-2xl bg-white/80 p-4 text-sm">
          <div className="font-semibold text-ink-strong">Referral types</div>
          <div className="mt-2 text-xs text-ink-muted">Patient Referral, Digital Ads, Direct Mail, Provider</div>
        </div>
        <div className="rounded-2xl bg-white/80 p-4 text-sm">
          <div className="font-semibold text-ink-strong">Referral sources</div>
          <div className="mt-2 text-xs text-ink-muted">YouTube, Click2Mail Campaign A, HearUSA</div>
        </div>
      </aside>
    </div>
  );
}
