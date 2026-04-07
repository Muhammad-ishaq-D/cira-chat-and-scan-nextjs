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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Sidebar */}
      <aside className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-6 gap-2 shadow-sm">
        <img src={ciraLogo} alt="Cira" className="w-9 h-9 mb-4" />
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all text-[10px] font-medium gap-0.5
              ${item.id === "doctor"
                ? "bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-200"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
          >
            {item.id === "chat" ? (
              <AiSparkleIcon size={20} glowColor={item.id === "doctor" ? "white" : undefined} />
            ) : (
              <item.icon size={20} />
            )}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        <ProfilePopover />
        <button onClick={() => navigate("/login")} className="text-gray-300 hover:text-red-400 transition-colors mt-1">
          <LogOut size={18} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserRound className="text-blue-500" size={28} />
                Find a Doctor
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Connect with licensed physicians for virtual consultations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold flex items-center gap-1">
                <BadgeCheck size={14} />
                All Verified MDs
              </span>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or specialty..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
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
                    ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Cards */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid gap-4">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-blue-100 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md shadow-blue-200/50">
                    {doc.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900 text-base">{doc.name}</h3>
                      {doc.verified && <BadgeCheck size={16} className="text-blue-500" />}
                    </div>
                    <p className="text-sm text-blue-600 font-medium">{doc.specialty}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
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
                    <span className="text-lg font-bold text-gray-900">{doc.fee}</span>
                    <span className="text-[10px] text-gray-400">per consultation</span>
                  </div>
                </div>

                {/* Bottom */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
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
                    <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-all">
                      <Phone size={16} />
                    </button>
                    <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-all">
                      <Video size={16} />
                    </button>
                    <button
                      onClick={() => handleBooking(doc.id)}
                      disabled={selectedDoctor === doc.id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-200/50 transition-all flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {selectedDoctor === doc.id ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
              <div className="text-center py-16 text-gray-400">
                <UserRound size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No doctors found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
            <p className="text-xs text-blue-600/70 text-center">
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
