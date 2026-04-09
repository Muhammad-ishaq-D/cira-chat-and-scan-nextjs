import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LogOut, ScanFace, Sparkles, FileText, Download, Eye, Calendar, Search, UserRound, Loader2 } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import { reportsApi } from "@/lib/apiClient";
import { getUser, logout } from "@/lib/auth";
import { downloadReportPdf } from "@/lib/reportPdf";
import { toast } from "sonner";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: UserRound, label: "Doctor", id: "doctor" },
];

const Reports = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const localUser = getUser();
  const initials = localUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  useEffect(() => {
    const load = async () => {
      try {
        const data = await reportsApi.getAll();
        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch (e: any) {
        console.error("Failed to load reports:", e);
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredReports = reports.filter((r: any) =>
    (r.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (report: any) => {
    try {
      downloadReportPdf(report);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error("PDF generation failed:", e);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="flex bg-background" style={{ height: '100dvh' }}>
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex w-[72px] border-r border-border bg-card flex-col items-center py-4 shrink-0">
        <div className="mb-4">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
        </div>
        <div className="w-10 h-[1px] bg-border mb-3" />
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "home") navigate("/dashboard");
                  if (item.id === "chat") navigate("/chat");
                  if (item.id === "scan") navigate("/vitals-scan");
                  if (item.id === "reports") navigate("/reports");
                  if (item.id === "doctor") navigate("/doctor");
                }}
                className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  item.id === "reports"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.id === "chat" ? (
                  <AiSparkleIcon size={18} />
                ) : (
                  <Icon size={18} strokeWidth={item.id === "reports" ? 2 : 1.5} />
                )}
                <span className="text-[9px] font-body font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-body font-medium leading-none">Logout</span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer ring-2 ring-primary/20">
              {initials}
            </div>
          </ProfilePopover>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="fixed inset-0 pointer-events-none md:left-[72px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Reports
              </h1>
              <p className="text-sm text-muted-foreground font-body">View, download, and manage your health reports</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-body">{filteredReports.length} reports</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports..."
                className="w-full h-10 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report: any) => (
                <div
                  key={report.id}
                  className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:shadow-md hover:border-border transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0">📋</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                          {report.title}
                        </h3>
                        <span className="shrink-0 text-[10px] font-medium px-2.5 py-0.5 rounded-full text-purple-600 bg-purple-50">
                          {report.type || "Detailed Assessment"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{report.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={12} />{report.date || report.created_at}</span>
                          {report.size && <span>{report.size}</span>}
                          <span className="text-emerald-600 font-medium">{report.status || "Ready"}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setPreviewId(previewId === report.id ? null : report.id)}
                            className="h-8 px-3 rounded-lg border border-border/60 text-xs font-medium text-foreground hover:bg-accent transition-all flex items-center gap-1.5"
                          >
                            <Eye size={13} />Preview
                          </button>
                          <button
                            onClick={() => handleDownload(report)}
                            className="h-8 px-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                          >
                            <Download size={13} />Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {previewId === report.id && (
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <div className="bg-secondary/30 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={14} className="text-muted-foreground" />
                          <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Report Preview</p>
                        </div>
                        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                          <p><span className="font-medium text-foreground">Report ID:</span> {report.id}</p>
                          <p><span className="font-medium text-foreground">Type:</span> {report.type || "Detailed Assessment"}</p>
                          <p><span className="font-medium text-foreground">Generated:</span> {report.date || report.created_at}</p>
                          <p><span className="font-medium text-foreground">Summary:</span> {report.summary}</p>
                          <p className="pt-2 text-[10px] text-muted-foreground/60">⚕️ This report was generated by Cira AI Health Nurse.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filteredReports.length === 0 && (
            <div className="text-center py-16">
              <FileText size={40} className="text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No reports found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Complete a detailed assessment to generate your first report</p>
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default Reports;
