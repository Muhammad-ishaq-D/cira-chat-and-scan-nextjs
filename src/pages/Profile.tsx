import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Calendar, Ruler, Weight, Save, Loader2, LogOut, Trash2 } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import { userApi } from "@/lib/apiClient";
import { getUser, logout } from "@/lib/auth";
import { toast } from "sonner";
import MobileBottomNav from "@/components/MobileBottomNav";

type Sex = "male" | "female" | "";

const Profile = () => {
  const navigate = useNavigate();
  const localUser = getUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState<Sex>("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await userApi.getProfile();
        setName(p.name || localUser?.name || "");
        setEmail(p.email || localUser?.email || "");
        setAge(p.age ? String(p.age) : "");
        setHeight(p.height ? String(p.height) : "");
        setWeight(p.weight ? String(p.weight) : "");
        setSex(p.biological_sex || "");
      } catch {
        setName(localUser?.name || "");
        setEmail(localUser?.email || "");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (age && (Number(age) < 10 || Number(age) > 120)) {
      toast.error("Age must be between 10 and 120");
      return;
    }
    if (height && (Number(height) < 50 || Number(height) > 300)) {
      toast.error("Height must be between 50 and 300 cm");
      return;
    }
    if (weight && (Number(weight) < 10 || Number(weight) > 500)) {
      toast.error("Weight must be between 10 and 500 kg");
      return;
    }

    setSaving(true);
    try {
      await userApi.updateProfile({
        name: name.trim(),
        ...(age ? { age: Number(age) } : {}),
        ...(height ? { height: Number(height) } : {}),
        ...(weight ? { weight: Number(weight) } : {}),
        ...(sex ? { biological_sex: sex } : {}),
      });
      toast.success("Profile updated!");
      setDirty(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      await userApi.deleteAccount();
      logout();
      navigate("/login");
      toast.success("Account deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const markDirty = () => setDirty(true);

  const initials = (name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-heading text-lg font-semibold text-foreground">Profile Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-semibold">
            {initials}
          </div>
          <p className="text-sm text-muted-foreground font-body">{email}</p>
        </div>

        {/* Personal Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground font-heading flex items-center gap-2">
            <User size={16} className="text-primary" /> Personal Information
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); markDirty(); }}
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                required
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block flex items-center gap-1">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-muted text-muted-foreground font-body text-sm cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground font-heading flex items-center gap-2">
            <Ruler size={16} className="text-primary" /> Health Metrics
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Biological Sex</label>
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => { setSex(option); markDirty(); }}
                    className={`py-2.5 px-4 rounded-xl border-2 text-sm font-medium font-body transition-all ${
                      sex === option
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/30"
                    }`}
                  >
                    {option === "male" ? "♂ Male" : "♀ Female"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block flex items-center gap-1">
                  <Calendar size={12} /> Age
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => { setAge(e.target.value); markDirty(); }}
                    placeholder="28"
                    min={10}
                    max={120}
                    className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">yrs</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block flex items-center gap-1">
                  <Ruler size={12} /> Height
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={height}
                    onChange={(e) => { setHeight(e.target.value); markDirty(); }}
                    placeholder="175"
                    min={50}
                    max={300}
                    className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">cm</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block flex items-center gap-1">
                  <Weight size={12} /> Weight
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => { setWeight(e.target.value); markDirty(); }}
                    placeholder="70"
                    min={10}
                    max={500}
                    className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {/* Danger Zone */}
        <div className="border border-destructive/20 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-destructive font-heading">Danger Zone</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-foreground text-sm font-medium font-body hover:bg-accent transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Sign Out
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex-1 py-2.5 px-4 rounded-xl border border-destructive/30 text-destructive text-sm font-medium font-body hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Delete Account
            </button>
          </div>
        </div>
      </div>

      <MobileBottomNav active="home" />
    </div>
  );
};

export default Profile;