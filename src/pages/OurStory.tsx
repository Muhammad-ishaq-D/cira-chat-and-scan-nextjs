import ciraLogo from "@/assets/cira-logo.svg";
import LandingMenu from "@/components/LandingMenu";
import founderPhoto from "@/assets/founder-jeanmarc.jpg";
import realScan from "@/assets/real-scan.webp";
import { useNavigate } from "react-router-dom";

const OurStory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-8 max-w-4xl mx-auto">
        <LandingMenu />
        <div className="flex items-center gap-3">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Our Story</span>
        </div>
        <div className="w-10" />
      </nav>

      <main className="max-w-[640px] mx-auto px-6 pb-24">
        {/* Label */}
        <p className="text-xs text-primary text-center font-body mb-4 tracking-wide uppercase">
          Why Cira exists
        </p>

        {/* H1 */}
        <h1 className="font-heading text-[44px] font-semibold text-foreground leading-tight text-center mb-10">
          I built Cira<br />
          because I have a problem.
        </h1>

        {/* Founder photo */}
        <div className="flex flex-col items-center mb-12">
          <img
            src={founderPhoto}
            alt="Jean-Marc, Founder of Cira"
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
          <p className="text-sm text-muted-foreground font-body text-center">
            Jean-Marc — Founder, Cira<br />
            Bangkok, Thailand
          </p>
        </div>

        {/* Story */}
        <div className="max-w-[580px] mx-auto text-[17px] text-foreground font-body leading-[1.8] mb-16 whitespace-pre-line">
          {`I have high blood pressure.
I have high cholesterol.
I've been managing both for years.

Every few months I sit down with my doctor.
He asks how I've been.
I try to remember.

Did my pressure spike last week?
Was it the stress or the food?
I don't know.
I have no data.
I have no record.
Just my memory — which is unreliable
when it matters most.

He takes one reading in the office.
That one number becomes the basis
for decisions about my health.

Meanwhile — between appointments —
nobody is watching.

Last week I scanned myself with Cira.

Pulse: 102.
Blood pressure: 135/86.

Elevated. Not an emergency.
But something my doctor should know about.
Something that would have disappeared
into my memory before Cira existed.

Now it's saved. Documented. Ready to show him.

That's why I built this.
Not for the technology.
Not for the business.

For that moment.

The moment when you finally arrive
at your doctor's office
with something real in your hands.`}
        </div>

        {/* Real scan screenshot */}
        <div className="max-w-[320px] mx-auto mb-4">
          <img
            src={realScan}
            alt="Real scan — PULSE 102 bpm, SBP 135 mmHg, DBP 86 mmHg"
            className="w-full rounded-2xl shadow-lg"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center font-body mb-10">
          My real scan. My real numbers.<br />
          March 2026.
        </p>

        {/* Cira response */}
        <div className="border-l-4 border-primary bg-primary/5 rounded-r-2xl p-6 max-w-[560px] mx-auto text-left mb-16">
          <p className="text-sm text-foreground font-body leading-relaxed italic whitespace-pre-line">
            {`"Your blood pressure is elevated at 135/86
and your pulse is 102.

Tell me — how long have you
been feeling this way?"`}
          </p>
          <p className="text-xs text-primary font-body mt-3 font-medium">— Cira</p>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-16" />

        {/* User wall */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-[36px] font-semibold text-foreground leading-tight mb-6">
            This wall belongs<br />
            to our users.
          </h2>

          <p className="text-base text-muted-foreground leading-relaxed max-w-[480px] mx-auto font-body whitespace-pre-line mb-10">
            {`When people use Cira and want to share
what happened — their story lives here.

No invented testimonials.
No marketing copy.
Just real people.
Real moments.
Real health.

The first story is mine.
The rest will be yours.`}
          </p>

          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body"
          >
            Talk to Cira — free →
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground space-y-2 font-body">
        <p>Cira does not replace professional medical advice.</p>
        <p>© 2026 Cira — askainurse.com</p>
      </footer>
    </div>
  );
};

export default OurStory;
