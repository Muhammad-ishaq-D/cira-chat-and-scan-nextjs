import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <>
      <SEO title="Privacy policy — Cira" description="How Cira collects, stores, and protects your health and account information. Read our full privacy policy." path="/privacy-policy" />
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("pages.back")}
        </button>
        <div className="flex items-center gap-2">
          <img src={ciraLogo} alt="Cira" width={24} height={24} />
          <span className="font-heading text-base font-semibold text-foreground">Cira</span>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 pb-24 font-body text-foreground">
        <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-2">{t("pages.legal.privacyTitle")}</h1>
        <p className="text-xs text-muted-foreground mb-3">{t("pages.legal.lastUpdated")}</p>
        <p className="text-xs italic text-muted-foreground mb-8 border-l-2 border-border pl-3">{t("pages.legal.englishOnly")}</p>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            This Privacy Policy describes how Cira ("we", "us", "our") collects, uses, stores, and shares
            your information when you use our website, mobile experience, and related services
            (collectively, the "Service"). Cira is currently in beta and is <strong>not</strong> a
            licensed medical service or a HIPAA-covered entity.
          </p>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">1. Information we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> name, email, password (hashed), authentication provider.</li>
              <li><strong>Health profile:</strong> age, sex, height, weight, biological inputs you provide.</li>
              <li><strong>Vitals data:</strong> heart rate, blood pressure, breathing rate, HRV, BMI, stress index, and risk indicators derived from the Shen AI face scan. Face video is processed on-device and is <strong>never uploaded</strong>.</li>
              <li><strong>Chat content:</strong> messages you exchange with Cira, including symptoms and AI-generated assessments.</li>
              <li><strong>Usage data:</strong> device type, browser, IP address, pages visited, timestamps.</li>
              <li><strong>Payment data:</strong> processed by our payment provider; we do not store card numbers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">2. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide AI-assisted health guidance and generate your reports.</li>
              <li>To personalize risk indicators using your profile data.</li>
              <li>To maintain account security, prevent abuse, and enforce rate limits.</li>
              <li>To improve the Service, fix bugs, and analyze aggregate usage.</li>
              <li>To communicate service updates and respond to support requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">3. Legal basis (GDPR / PDPA)</h2>
            <p>
              We process your personal and health data based on your <strong>explicit consent</strong>,
              given when you sign up or accept the consent banner. You can withdraw consent at any time
              by deleting your account.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">4. Sharing your data</h2>
            <p>We share data only with service providers strictly necessary to operate Cira:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Hosting & database:</strong> infrastructure providers under standard data-processing terms.</li>
              <li><strong>AI provider:</strong> Anthropic (Claude) processes chat content to generate responses.</li>
              <li><strong>Shen AI SDK:</strong> on-device biometric processing only.</li>
              <li><strong>Analytics:</strong> aggregate, de-identified usage metrics.</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell your personal or health data.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">5. Data retention</h2>
            <p>
              Account, vitals, chats, and reports are retained while your account is active. If you delete
              your account, we erase or de-identify your data within 30 days, except where retention is
              required by law.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">6. Security</h2>
            <p>
              We use TLS encryption in transit, hashed passwords, JWT-based auth, and access controls.
              No system is 100% secure; you use the Service at your own risk while we are in beta.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">7. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data via your profile page.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Withdraw consent at any time.</li>
              <li>Lodge a complaint with your local data-protection authority.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, email <a className="underline" href="mailto:privacy@askainurse.com">privacy@askainurse.com</a>.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">8. Children</h2>
            <p>Cira is not intended for users under 16. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">9. International transfers</h2>
            <p>
              Your data may be processed in countries outside your own. Where required, we rely on
              standard contractual clauses or equivalent safeguards.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy. Material changes will be communicated via the app or by
              email. Continued use after changes means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">11. Contact</h2>
            <p>
              Questions or requests: <a className="underline" href="mailto:privacy@askainurse.com">privacy@askainurse.com</a>.
            </p>
          </section>
        </div>
      </article>
    </div>
    </>
  );
};

export default PrivacyPolicy;
