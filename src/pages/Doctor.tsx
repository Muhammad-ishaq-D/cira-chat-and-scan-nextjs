import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LogOut, ScanFace, Sparkles, FileText, UserRound, Star, MapPin, Clock, Phone, Video, Calendar, ChevronRight, Search, Filter, BadgeCheck } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: UserRound, label: "Doctor", id: "doctor" },
];

const specialties = ["All", "General Practice", "Cardiology", "Dermatology", "Neurology", "Orthopedics"];

const mockDoctors = [
  {
    id: "1",
    name: "Dr. Sarah Mitchell",
    specialty: "General Practice",
    rating: 4.9,
    reviews: 342,
    location: "New York, NY",
    available: "Today",
    avatar: "SM",
    fee: "$45",
    languages: ["English", "Spanish"],
    nextSlot: "2:30 PM",
    verified: true,
  },
  {
    id: "2",
    name: "Dr. James Chen",
    specialty: "Cardiology",
    rating: 4.8,
    reviews: 218,
    location: "San Francisco, CA",
    available: "Today",
    avatar: "JC",
    fee: "$65",
    languages: ["English", "Mandarin"],
    nextSlot: "3:00 PM",
    verified: true,
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialty: "Dermatology",
    rating: 4.7,
    reviews: 156,
    location: "Los Angeles, CA",
    available: "Tomorrow",
    avatar: "ER",
    fee: "$55",
    languages: ["English", "Portuguese"],
    nextSlot: "9:00 AM",
    verified: true,
  },
  {
    id: "4",
    name: "Dr. Michael Park",
    specialty: "Neurology",
    rating: 4.9,
    reviews: 289,
    location: "Chicago, IL",
    available: "Today",
    avatar: "MP",
    fee: "$70",
    languages: ["English", "Korean"],
    nextSlot: "4:15 PM",
    verified: true,
  },
  {
    id: "5",
    name: "Dr. Lisa Thompson",
    specialty: "Orthopedics",
    rating: 4.6,
    reviews: 198,
    location: "Houston, TX",
    available: "Wed, Apr 9",
    avatar: "LT",
    fee: "$60",
    languages: ["English"],
    nextSlot: "10:30 AM",
    verified: false,
  },
];

const Doctor = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  const filteredDoctors = mockDoctors.filter((doc) => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || doc.specialty.toLowerCase().includes(search.toLowerCase());
    const matchSpec = selectedSpecialty === "All" || doc.specialty === selectedSpecialty;
    return matchSearch && matchSpec;
  });

  const handleNav = (id: string) => {
    if (id === "home") navigate("/dashboard");
    else if (id === "chat") navigate("/chat");
    else if (id === "scan") navigate("/vitals-scan");
    else if (id === "reports") navigate("/reports");
    else if (id === "doctor") navigate("/doctor");
  };

  const handleBooking = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    // Mock booking - in production would redirect to Air Doctor or partner API
    setTimeout(() => {
      setSelectedDoctor(null);
      alert("Demo: Booking request sent! In production, this would connect to a licensed physician network.");
    }, 1200);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Slim icon sidebar */}
      <div className="w-[72px] border-r border-border bg-card flex flex-col items-center py-4 shrink-0">
        <div className="mb-6">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
        </div>
        <div className="w-10 h-[1px] bg-border mb-3" />
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  item.id === "doctor"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.id === "chat" ? (
                  <AiSparkleIcon size={18} />
                ) : (
                  <Icon size={18} strokeWidth={item.id === "doctor" ? 2 : 1.5} />
                )}
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-medium leading-none">Logout</span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium cursor-pointer ring-2 ring-primary/20">
              AX
            </div>
          </ProfilePopover>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                <UserRound className="text-primary" size={26} />
                Find a Doctor
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Connect with licensed physicians for virtual consultations</p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1">
              <BadgeCheck size={14} />
              All Verified MDs
            </span>
          </div>

          {/* Search */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or specialty..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Specialty Pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedSpecialty === spec
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground border border-border/60 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Cards */}
        <div className="flex-1 overflow-y-auto px-8 pb-6">
          <div className="grid gap-4">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-card rounded-2xl border border-border/60 p-5 hover:shadow-lg hover:border-primary/20 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0 shadow-md">
                    {doc.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-foreground text-base">{doc.name}</h3>
                      {doc.verified && <BadgeCheck size={16} className="text-primary" />}
                    </div>
                    <p className="text-sm text-primary font-medium">{doc.specialty}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {doc.rating} ({doc.reviews})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {doc.location}
                      </span>
                      <span className="flex items-center gap-1">
                        🗣️ {doc.languages.join(", ")}
                      </span>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-lg font-bold text-foreground">{doc.fee}</span>
                    <span className="text-[10px] text-muted-foreground">per consultation</span>
                  </div>
                </div>

                {/* Bottom */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Next: {doc.nextSlot}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      doc.available === "Today" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {doc.available}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                      <Phone size={16} />
                    </button>
                    <button className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                      <Video size={16} />
                    </button>
                    <button
                      onClick={() => handleBooking(doc.id)}
                      disabled={selectedDoctor === doc.id}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {selectedDoctor === doc.id ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                          Booking...
                        </span>
                      ) : (
                        <>
                          <Calendar size={14} />
                          Book Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredDoctors.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <UserRound size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No doctors found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground text-center">
              🏥 All listed physicians are licensed and verified. Consultations are conducted through our partner network.
              In an emergency, please call 911 or visit your nearest emergency room.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Doctor;
