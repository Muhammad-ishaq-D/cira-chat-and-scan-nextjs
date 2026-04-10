import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LogOut, ScanFace, Sparkles, FileText, UserRound, Star, MapPin, Clock, Phone, Video, Calendar, Search, BadgeCheck, Loader2 } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import { doctorApi } from "@/lib/apiClient";
import { getUser, logout } from "@/lib/auth";
import { toast } from "sonner";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: UserRound, label: "Doctor", id: "doctor" },
];

const specialties = ["All", "General Practice", "Cardiology", "Dermatology", "Neurology", "Orthopedics"];

const Doctor = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const localUser = getUser();
  const initials = localUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  useEffect(() => {
    const load = async () => {
      try {
        const data = await doctorApi.getAll({ specialty: selectedSpecialty, search });
        setDoctors(Array.isArray(data) ? data : data.doctors || []);
      } catch (e: any) {
        console.error("Failed to load doctors:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedSpecialty]);

  const filteredDoctors = doctors.filter((doc: any) => {
    const matchSearch = (doc.name || "").toLowerCase().includes(search.toLowerCase()) || (doc.specialty || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleNav = (id: string) => {
    if (id === "home") navigate("/dashboard");
    else if (id === "chat") navigate("/chat");
    else if (id === "scan") navigate("/vitals-scan");
    else if (id === "reports") navigate("/reports");
    else if (id === "doctor") navigate("/doctor");
  };

  const handleBooking = async (doctorId: string) => {
    setSelectedDoctor(doctorId);
    try {
      await doctorApi.book(doctorId, { type: "video", timestamp: new Date().toISOString() });
      toast.success("Booking request sent!");
    } catch (e: any) {
      toast.error(e.message || "Booking failed");
    } finally {
      setSelectedDoctor(null);
    }
  };

  return (
    <div className="flex bg-background" style={{ height: '100dvh' }}>
      {/* Sidebar */}
      <div className="hidden md:flex w-[72px] border-r border-border bg-card flex-col items-center py-4 shrink-0">
        <div className="mb-6"><img src={ciraLogo} alt="Cira" width={28} height={28} /></div>
        <div className="w-10 h-[1px] bg-border mb-3" />
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => handleNav(item.id)} className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${item.id === "doctor" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                {item.id === "chat" ? <AiSparkleIcon size={18} /> : <Icon size={18} strokeWidth={item.id === "doctor" ? 2 : 1.5} />}
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button onClick={() => { logout(); navigate("/login"); }} className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <LogOut size={18} strokeWidth={1.5} /><span className="text-[9px] font-medium leading-none">Logout</span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium cursor-pointer ring-2 ring-primary/20">{initials}</div>
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
              <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Find a Doctor</h1>
              <p className="text-sm text-muted-foreground font-body">Connect with licensed physicians for virtual consultations</p>
            </div>
            <span className="shrink-0 text-[10px] font-medium px-2.5 py-0.5 rounded-full text-emerald-600 bg-emerald-50 flex items-center gap-1"><BadgeCheck size={12} />All Verified MDs</span>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or specialty..." className="w-full h-10 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" style={{ fontFamily: "'Inter', system-ui, sans-serif" }} />
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {specialties.map((spec) => (
              <button key={spec} onClick={() => setSelectedSpecialty(spec)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium font-body transition-all ${selectedSpecialty === spec ? "bg-primary text-primary-foreground shadow-sm" : "bg-card/80 backdrop-blur-sm text-muted-foreground border border-border/50 hover:border-border hover:text-foreground"}`}>{spec}</button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
          ) : (
            <div className="space-y-3">
              {filteredDoctors.map((doc: any) => (
                <div key={doc.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:shadow-md hover:border-border transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 overflow-hidden">
                      {doc.avatar ? (
                        <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover" />
                      ) : (
                        (doc.name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{doc.name}</h3>
                            {doc.verified && <BadgeCheck size={14} className="text-primary" />}
                          </div>
                          <p className="text-xs text-primary font-medium font-body mt-0.5">{doc.specialty}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{doc.fee}</span>
                          <p className="text-[10px] text-muted-foreground/60">per session</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground font-body">
                        <span className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" />{doc.rating} ({doc.reviews})</span>
                        <span className="flex items-center gap-1"><MapPin size={11} />{doc.location}</span>
                        {doc.languages && <span>🗣️ {Array.isArray(doc.languages) ? doc.languages.join(", ") : doc.languages}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          {doc.nextSlot && <span className="flex items-center gap-1"><Clock size={11} />Next: {doc.nextSlot}</span>}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${doc.available === "Today" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{doc.available}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-accent transition-all"><Phone size={13} /></button>
                          <button className="h-8 w-8 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-accent transition-all"><Video size={13} /></button>
                          <button onClick={() => handleBooking(doc.id)} disabled={selectedDoctor === doc.id} className="h-8 px-3 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60">
                            {selectedDoctor === doc.id ? <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />Booking...</span> : <><Calendar size={12} />Book Now</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredDoctors.length === 0 && (
            <div className="text-center py-16">
              <UserRound size={40} className="text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No doctors found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
            </div>
          )}

          <div className="mt-6 p-4 rounded-xl bg-secondary/30">
            <p className="text-[10px] text-muted-foreground/60 text-center font-body">
              🏥 All listed physicians are licensed and verified. Consultations are conducted through our partner network.
              In an emergency, please call 911 or visit your nearest emergency room.
            </p>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default Doctor;
