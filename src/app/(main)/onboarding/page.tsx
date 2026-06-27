"use client";

import { useState } from "react";
import { useNavigate } from '@/lib/react-router-compat';
import { useTranslation } from "react-i18next";
import { userApi } from "@/lib/apiClient";
import { consumePostAuthRedirect } from "@/lib/authFlow";
import ciraLogo from "@/assets/cira-logo.svg";
import { toast } from "sonner";
import { ChevronRight, Ruler, Weight, Calendar, User } from "lucide-react";

type Sex = "male" | "female" | "";

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState<Sex>("");
  const [saving, setSaving] = useState(false);

  const steps = [
    { key: "sex", label: t("onboarding.sex.label"), sub: t("onboarding.sex.sub"), icon: User },
    { key: "age", label: t("onboarding.age.label"), sub: t("onboarding.age.sub"), icon: Calendar },
    { key: "height", label: t("onboarding.height.label"), sub: t("onboarding.height.sub"), icon: Ruler },
    { key: "weight", label: t("onboarding.weight.label"), sub: t("onboarding.weight.sub"), icon: Weight },
  ];

  const completeOnboarding = () => {
    navigate(consumePostAuthRedirect() || "/dashboard");
  };

  const canProceed = () => {
    if (step === 0) return sex !== "";
    if (step === 1) return age !== "" && Number(age) >= 10 && Number(age) <= 120;
    if (step === 2) return height !== "" && Number(height) >= 50 && Number(height) <= 300;
    if (step === 3) return weight !== "" && Number(weight) >= 10 && Number(weight) <= 500;
    return false;
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    // Final step — save
    setSaving(true);
    try {
      await userApi.updateProfile({
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        biological_sex: sex,
      });
      toast.success(t("onboarding.toastSuccess"));
      completeOnboarding();
    } catch (err: any) {
      console.error("Profile save error:", err);
      toast.error(err.message || t("onboarding.toastError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <img src={ciraLogo.src} alt="Cira" width={28} height={28} />
            <span className="font-heading text-lg font-semibold text-foreground">Cira</span>
          </div>

          {/* Step icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <StepIcon size={24} className="text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-heading text-xl font-semibold text-foreground text-center mb-1">
            {currentStep.label}
          </h1>
          <p className="text-sm text-muted-foreground text-center font-body mb-8">
            {currentStep.sub}
          </p>

          {/* Input area */}
          <div className="mb-8">
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {(["male", "female"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSex(option)}
                    className={`py-4 px-4 rounded-xl border-2 text-sm font-medium font-body transition-all ${sex === option
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/30"
                      }`}
                  >
                    {option === "male" ? t("onboarding.sex.male") : t("onboarding.sex.female")}
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t("onboarding.age.placeholder")}
                  min={10}
                  max={120}
                  autoFocus
                  className="w-full py-4 px-4 rounded-xl border-2 border-border bg-card text-foreground font-body text-lg text-center outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-body">{t("onboarding.age.unit")}</span>
              </div>
            )}

            {step === 2 && (
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={t("onboarding.height.placeholder")}
                  min={50}
                  max={300}
                  autoFocus
                  className="w-full py-4 px-4 rounded-xl border-2 border-border bg-card text-foreground font-body text-lg text-center outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-body">{t("onboarding.height.unit")}</span>
              </div>
            )}

            {step === 3 && (
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={t("onboarding.weight.placeholder")}
                  min={10}
                  max={500}
                  autoFocus
                  className="w-full py-4 px-4 rounded-xl border-2 border-border bg-card text-foreground font-body text-lg text-center outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-body">{t("onboarding.weight.unit")}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? t("common.saving") : step < 3 ? t("common.continue") : t("common.finish")}
            {!saving && <ChevronRight size={16} />}
          </button>

          <button
            onClick={handleSkip}
            className="w-full mt-3 py-2 text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
          >
            {t("common.skip")}
          </button>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-border"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
