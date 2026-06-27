"use client";

import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { doctorApi, doctorAuth } from "@/lib/doctorApi";

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-heading font-semibold">{value}</p>
    </div>
  </div>
);

const DoctorOverview = () => {
  const doctor = doctorAuth.current();
  const [stats, setStats] = useState({ pending: 0, approved_today: 0, rejected_today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, pending] = await Promise.all([
          doctorApi.getStats().catch(() => null),
          doctorApi.getPendingRefills().catch(() => ({ refills: [] })),
        ]);
        if (s && (s.pending || s.approved_today || s.rejected_today)) setStats(s);
        else setStats((prev) => ({ ...prev, pending: pending.refills?.length || 0 }));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      <h1 className="font-heading text-2xl font-semibold mb-1">Welcome back, Dr. {doctor?.name?.split(" ")[0] || ""}</h1>
      <p className="text-sm text-muted-foreground mb-6">Here's your prescription review queue at a glance.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="Pending Reviews" value={loading ? "—" : stats.pending} color="bg-amber-50 text-amber-700" />
        <StatCard icon={CheckCircle2} label="Approved Today" value={loading ? "—" : stats.approved_today} color="bg-emerald-50 text-emerald-700" />
        <StatCard icon={XCircle} label="Rejected Today" value={loading ? "—" : stats.rejected_today} color="bg-red-50 text-red-700" />
      </div>
    </div>
  );
};

export default DoctorOverview;
