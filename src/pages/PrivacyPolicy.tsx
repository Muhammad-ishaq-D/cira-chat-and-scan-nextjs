import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import { openConsentBanner } from "@/lib/consent";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="Privacy policy — Cira"
        description="How Cira collects, stores, and protects your health and account information. GDPR-compliant privacy notice."
        path="/privacy-policy"
      />
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
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-2">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground mb-3">Last updated: 11 June 2026</p>
          <p className="text-xs italic text-muted-foreground mb-8 border-l-2 border-border pl-3">
            This Privacy Policy is provided in English. Translations are available on request.
          </p>

          <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
            <p>
              This Privacy Policy explains how Cira ("we", "us", "our") collects, uses, stores, shares and
              protects your personal data when you use askainurse.com and related services (the "Service").
              It is written to comply with the EU General Data Protection Regulation (GDPR), the UK GDPR
              and similar privacy laws. Cira is currently in beta and is <strong>not</strong> a licensed
              medical service.
            </p>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">1. Data controller</h2>
              <p>
                The data controller responsible for your personal data is:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Askainurse</strong> (the operator of askainurse.com)</li>
                <li>Registered address: <strong>la boue, Charn Issara Tower 1 - Ground Floor, Bangkok, 41250, Thailand</strong></li>
                <li>Privacy contact / DPO: <a className="underline" href="mailto:privacy@askainurse.com">privacy@askainurse.com</a></li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                If you are an EU/EEA or UK resident and need to reach our representative, use the privacy
                email above.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">2. Information we collect</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account data:</strong> name, email, hashed password, authentication provider (email / Google).</li>
                <li><strong>Health profile:</strong> age, biological sex, height, weight and any other inputs you provide.</li>
                <li><strong>Vitals data:</strong> heart rate, blood pressure, breathing rate, HRV, BMI, stress index and risk indicators derived from the Shen AI face scan. The face video is processed on-device and is <strong>never uploaded</strong>.</li>
                <li><strong>Chat content:</strong> messages you exchange with Cira, including symptoms and AI-generated assessments.</li>
                <li><strong>Usage & device data:</strong> device type, browser, IP address, pages visited, timestamps, anonymous device identifier (<code>cira_device_id</code>) for guest rate-limiting.</li>
                <li><strong>Cookies & local storage:</strong> see Section 9.</li>
                <li><strong>Payment data:</strong> processed by our payment provider; we do not store card numbers.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">3. Purposes & lawful basis</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-border">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-2 border-b border-border">Purpose</th>
                      <th className="text-left p-2 border-b border-border">Data used</th>
                      <th className="text-left p-2 border-b border-border">Lawful basis (GDPR Art. 6 / 9)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 align-top border-b border-border">Provide AI nurse chat and vital scans</td><td className="p-2 align-top border-b border-border">Account, health profile, vitals, chat</td><td className="p-2 align-top border-b border-border">Contract (Art. 6(1)(b)) + explicit consent for health data (Art. 9(2)(a))</td></tr>
                    <tr><td className="p-2 align-top border-b border-border">Generate clinical reports (PDF)</td><td className="p-2 align-top border-b border-border">Health profile, vitals, chat</td><td className="p-2 align-top border-b border-border">Contract + explicit consent</td></tr>
                    <tr><td className="p-2 align-top border-b border-border">Security, rate-limiting, fraud prevention</td><td className="p-2 align-top border-b border-border">Usage, device ID, IP</td><td className="p-2 align-top border-b border-border">Legitimate interest (Art. 6(1)(f))</td></tr>
                    <tr><td className="p-2 align-top border-b border-border">Anonymous analytics (Google Analytics)</td><td className="p-2 align-top border-b border-border">Usage, anonymised IP</td><td className="p-2 align-top border-b border-border">Consent (Art. 6(1)(a)) — via cookie banner</td></tr>
                    <tr><td className="p-2 align-top border-b border-border">Service emails (account, security)</td><td className="p-2 align-top border-b border-border">Email</td><td className="p-2 align-top border-b border-border">Contract</td></tr>
                    <tr><td className="p-2 align-top">Comply with legal obligations</td><td className="p-2 align-top">As required</td><td className="p-2 align-top">Legal obligation (Art. 6(1)(c))</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">4. Sub-processors & sharing</h2>
              <p>We share data only with service providers strictly necessary to operate Cira:</p>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs border border-border">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-2 border-b border-border">Sub-processor</th>
                      <th className="text-left p-2 border-b border-border">Purpose</th>
                      <th className="text-left p-2 border-b border-border">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 border-b border-border">Anthropic (Claude)</td><td className="p-2 border-b border-border">AI chat responses</td><td className="p-2 border-b border-border">USA</td></tr>
                    <tr><td className="p-2 border-b border-border">Shen AI SDK</td><td className="p-2 border-b border-border">On-device biometric processing only — no data leaves your browser</td><td className="p-2 border-b border-border">N/A (client-side)</td></tr>
                    <tr><td className="p-2 border-b border-border">Hosting & MySQL database</td><td className="p-2 border-b border-border">Application hosting, encrypted backups</td><td className="p-2 border-b border-border">EU / Global</td></tr>
                    <tr><td className="p-2 border-b border-border">Google Analytics</td><td className="p-2 border-b border-border">Aggregate usage metrics (only if you consent)</td><td className="p-2 border-b border-border">USA</td></tr>
                    <tr><td className="p-2">Stripe / Paddle</td><td className="p-2">Payment processing</td><td className="p-2">USA / Global</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2">We do <strong>not</strong> sell your personal or health data.</p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">5. International transfers</h2>
              <p>
                When personal data is transferred outside the EU/EEA or UK, we rely on the European
                Commission's Standard Contractual Clauses (SCCs) or, for the UK, the UK International Data
                Transfer Agreement, together with supplementary measures (encryption in transit, access
                controls).
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">6. Data retention</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-border">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-2 border-b border-border">Data</th>
                      <th className="text-left p-2 border-b border-border">Retention</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 border-b border-border">Account & profile</td><td className="p-2 border-b border-border">Until you delete your account</td></tr>
                    <tr><td className="p-2 border-b border-border">Vital scans & reports</td><td className="p-2 border-b border-border">24 months from creation, then anonymised</td></tr>
                    <tr><td className="p-2 border-b border-border">Chat conversations</td><td className="p-2 border-b border-border">12 months, then deleted</td></tr>
                    <tr><td className="p-2 border-b border-border">Security & audit logs</td><td className="p-2 border-b border-border">90 days</td></tr>
                    <tr><td className="p-2">Payment records</td><td className="p-2">As required by tax law (typically 7 years)</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2">
                On account deletion we erase or irreversibly anonymise your data within 30 days, except
                where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">7. Your rights (GDPR)</h2>
              <p>Under GDPR you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Access</strong> the personal data we hold about you (Art. 15).</li>
                <li><strong>Rectify</strong> inaccurate data via your profile page (Art. 16).</li>
                <li><strong>Erasure</strong> ("right to be forgotten") — delete your account from the profile page (Art. 17).</li>
                <li><strong>Restrict</strong> processing in certain circumstances (Art. 18).</li>
                <li><strong>Data portability</strong> — download a machine-readable copy from <em>Profile → Privacy & data → Export my data</em> (Art. 20).</li>
                <li><strong>Object</strong> to processing based on legitimate interests (Art. 21).</li>
                <li><strong>Withdraw consent</strong> at any time via the cookie banner or by deleting your account (Art. 7).</li>
                <li><strong>Lodge a complaint</strong> with your local supervisory authority (e.g. CNIL, ICO, Datatilsynet).</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, use the in-app controls or email{" "}
                <a className="underline" href="mailto:privacy@askainurse.com">privacy@askainurse.com</a>. We respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">8. Automated processing & AI</h2>
              <p>
                Cira uses AI models to generate responses and risk indicators. These outputs are{" "}
                <strong>informational only</strong> and do not constitute a medical diagnosis. They are
                not solely automated decisions with legal or similarly significant effects under GDPR
                Art. 22 — a qualified clinician should review every assessment.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">9. Cookies & local storage</h2>
              <p>We use three categories of cookies / local-storage entries:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Strictly necessary</strong> — JWT auth token, anonymous device ID, consent record. Always on.</li>
                <li><strong>Analytics</strong> — Google Analytics with anonymised IP. Off by default; only loaded after you accept.</li>
                <li><strong>Functional</strong> — language preference, UI state. Off by default.</li>
              </ul>
              <p className="mt-2">
                You can change your choice at any time:{" "}
                <button onClick={openConsentBanner} className="underline">open cookie preferences</button>.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">10. Security</h2>
              <p>
                We use TLS encryption in transit, hashed passwords (bcrypt), JWT-based authentication,
                role-based access controls and encrypted backups. The Shen AI face scan runs entirely
                on-device — your video is never transmitted. No system is 100% secure; you use the Service
                at your own risk while we are in beta.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">11. Children</h2>
              <p>
                Cira is not intended for users under 16 in the EU/EEA and UK. We do not knowingly collect
                data from children.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">12. Breach notification</h2>
              <p>
                In the event of a personal-data breach likely to result in risk to your rights and
                freedoms, we will notify the competent supervisory authority within 72 hours and inform
                affected users without undue delay.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">13. Changes to this policy</h2>
              <p>
                We may update this Privacy Policy. Material changes will be communicated via the app or by
                email. Continued use after changes means you accept the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold mb-2">14. Contact</h2>
              <p>
                Questions or requests:{" "}
                <a className="underline" href="mailto:privacy@askainurse.com">privacy@askainurse.com</a>.
              </p>
            </section>
          </div>
        </article>
      </div>
    </>
  );
};

export default PrivacyPolicy;
