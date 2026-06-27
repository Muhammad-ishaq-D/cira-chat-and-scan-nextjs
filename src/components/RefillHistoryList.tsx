"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pill, Mail, Calendar, Hash, Inbox } from "lucide-react";

type RefillHistoryItem = {
  ref: string;
  date: string;
  drug: string;
  strength: string;
  email: string;
  priceCents: number;
  status?: "sent" | "failed";
};

type RefundRecord = {
  ref: string;
  submittedAt: string;
  status?: "requested" | "approved";
};

type EnrichedItem = RefillHistoryItem & {
  derivedStatus: "sent" | "failed" | "refund_requested" | "refunded";
};

const PAGE_SIZE = 5;

const maskEmail = (email: string) => {
  if (!email || !email.includes("@")) return email || "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0] || ""}*@${domain}`;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
};

const StatusBadge = ({ status }: { status: EnrichedItem["derivedStatus"] }) => {
  const { t } = useTranslation();
  const map: Record<EnrichedItem["derivedStatus"], { label: string; cls: string }> = {
    sent: {
      label: t("pages.prescriptionRefill.history.status.sent"),
      cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    },
    failed: {
      label: t("pages.prescriptionRefill.history.status.failed"),
      cls: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    },
    refund_requested: {
      label: t("pages.prescriptionRefill.history.status.refundRequested"),
      cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    refunded: {
      label: t("pages.prescriptionRefill.history.status.refunded"),
      cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
  };
  const v = map[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${v.cls}`}
    >
      {v.label}
    </span>
  );
};

const SkeletonRow = () => (
  <li className="rounded-2xl border border-border/60 bg-card/50 p-4 animate-pulse">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="h-4 w-40 bg-muted rounded" />
      <div className="h-5 w-16 bg-muted rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-32 bg-muted rounded" />
      <div className="h-3 w-44 bg-muted rounded" />
      <div className="h-3 w-28 bg-muted rounded" />
    </div>
  </li>
);

const RefillHistoryList = ({ reloadKey = 0 }: { reloadKey?: number }) => {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setVisible(PAGE_SIZE);

    // Simulated fetch against existing storage-backed API.
    const run = async () => {
      try {
        await new Promise((r) => setTimeout(r, 450));
        if (cancelled) return;
        const rawHistory = window.globalThis?.localStorage?.getItem("cira_refill_history");
        const rawRefunds = window.globalThis?.localStorage?.getItem("cira_refund_requests");
        const history: RefillHistoryItem[] = rawHistory ? JSON.parse(rawHistory) : [];
        const refunds: RefundRecord[] = rawRefunds ? JSON.parse(rawRefunds) : [];
        const refundMap = new Map<string, RefundRecord>();
        refunds.forEach((r) => {
          if (!refundMap.has(r.ref)) refundMap.set(r.ref, r);
        });

        const enriched: EnrichedItem[] = history.map((h) => {
          let derived: EnrichedItem["derivedStatus"] = h.status === "failed" ? "failed" : "sent";
          const rf = refundMap.get(h.ref);
          if (rf) derived = rf.status === "approved" ? "refunded" : "refund_requested";
          return { ...h, derivedStatus: derived };
        });

        setItems(enriched);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <section className="border-t border-border pt-8" aria-labelledby="refill-history-heading">
      <h2
        id="refill-history-heading"
        className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 text-center"
      >
        {t("pages.prescriptionRefill.history.title")}
      </h2>

      {loading ? (
        <ul className="space-y-2">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </ul>
      ) : error ? (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("pages.prescriptionRefill.history.error")}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/60 mb-3">
            <Inbox className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t("pages.prescriptionRefill.history.emptyLine1")}{" "}
            {t("pages.prescriptionRefill.history.emptyLine2")}
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.slice(0, visible).map((h) => {
              const dateStr = new Date(h.date).toLocaleDateString(i18n.language, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <li
                  key={h.ref}
                  className="rounded-2xl border border-border/60 bg-card/50 p-4 transition hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex items-start gap-2">
                      <Pill className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={1.75} />
                      <p className="text-sm font-semibold text-foreground truncate">
                        {[h.drug, h.strength].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <StatusBadge status={h.derivedStatus} />
                  </div>
                  <dl className="space-y-1 text-xs text-muted-foreground pl-6">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                      <dd>{dateStr}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                      <dd className="font-mono tracking-wider">{h.ref}</dd>
                    </div>
                    {h.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <dd className="truncate">{maskEmail(h.email)}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>

          {visible < items.length && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-5 h-12 min-h-[48px] rounded-full border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition"
              >
                {t("pages.prescriptionRefill.history.loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default RefillHistoryList;
