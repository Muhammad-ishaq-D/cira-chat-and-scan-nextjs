import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, Mail, Calendar, Ruler, Weight, Save, Loader2, LogOut, Trash2, Camera } from "lucide-react";
import { userApi } from "@/lib/apiClient";
import { getUser, logout, updateUserAvatar } from "@/lib/auth";
import { toast } from "sonner";
import MobileBottomNav from "@/components/MobileBottomNav";

type Sex = "male" | "female" | "";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [avatar, setAvatar] = useState<string | undefined>(localUser?.avatar);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);

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
        if (p.avatar) setAvatar(p.avatar);
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
      toast.error(t("profile.errors.nameRequired"));
      return;
    }
    if (age && (Number(age) < 10 || Number(age) > 120)) {
      toast.error(t("profile.errors.ageRange"));
      return;
    }
    if (height && (Number(height) < 50 || Number(height) > 300)) {
      toast.error(t("profile.errors.heightRange"));
      return;
    }
    if (weight && (Number(weight) < 10 || Number(weight) > 500)) {
      toast.error(t("profile.errors.weightRange"));
      return;
    }

    setSaving(true);
    try {
      if (pendingAvatarFile) {
        const result = await userApi.uploadAvatar(pendingAvatarFile);
        setAvatar(result.avatar);
        updateUserAvatar(result.avatar);
        setPendingAvatarFile(null);
        setPendingAvatarPreview(null);
      }

      await userApi.updateProfile({
        name: name.trim(),
        ...(age ? { age: Number(age) } : {}),
        ...(height ? { height: Number(height) } : {}),
        ...(weight ? { weight: Number(weight) } : {}),
        ...(sex ? { biological_sex: sex } : {}),
      });
      toast.success(t("profile.toast.updated"));
      setDirty(false);
    } catch (err: any) {
      toast.error(err.message || t("profile.errors.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t("profile.confirmDelete"))) return;
    try {
      await userApi.deleteAccount();
      logout();
      navigate("/login");
      toast.success(t("profile.toast.deleted"));
    } catch (err: any) {
      toast.error(err.message || t("profile.errors.deleteFailed"));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const markDirty = () => setDirty(true);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.errors.imageType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("profile.errors.imageSize"));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarFile(file);
    setPendingAvatarPreview(previewUrl);
    setDirty(true);
  };

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
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-heading text-lg font-semibold text-foreground">{t("profile.title")}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-semibold overflow-hidden">
              {(pendingAvatarPreview || avatar) ? (
                <img src={pendingAvatarPreview || avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={20} className="text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-muted-foreground font-body">{t("profile.tapToChange")}</p>
          <p className="text-sm text-muted-foreground font-body">{email}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground font-heading flex items-center gap-2">
            <User size={16} className="text-primary" /> {t("profile.personal")}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">{t("profile.fullName")}</label>
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
                <Mail size={12} /> {t("profile.email")}
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-muted text-muted-foreground font-body text-sm cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{t("profile.emailLocked")}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground font-heading flex items-center gap-2">
            <Ruler size={16} className="text-primary" /> {t("profile.health")}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">{t("profile.biologicalSex")}</label>
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
                    {t(`profile.${option}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block flex items-center gap-1">
                  <Calendar size={12} /> {t("profile.age")}
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
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{t("profile.ageUnit")}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block flex items-center gap-1">
                  <Ruler size={12} /> {t("profile.height")}
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
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{t("profile.heightUnit")}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block flex items-center gap-1">
                  <Weight size={12} /> {t("profile.weight")}
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
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{t("profile.weightUnit")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? t("profile.saving") : t("profile.saveChanges")}
        </button>

        <div className="border border-destructive/20 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-destructive font-heading">{t("profile.dangerZone")}</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-foreground text-sm font-medium font-body hover:bg-accent transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> {t("profile.signOut")}
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex-1 py-2.5 px-4 rounded-xl border border-destructive/30 text-destructive text-sm font-medium font-body hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> {t("profile.deleteAccount")}
            </button>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Profile;
