import ciraSpark from "@/assets/cira-spark.png";
import doctor1 from "@/assets/doctor-1.jpg";
import doctor2 from "@/assets/doctor-2.jpg";
import { useNavigate } from "react-router-dom";

const chips = [
  "My heart is racing",
  "I have pain",
  "I feel unwell",
  "I'm worried",
];

const specialties = ["GP", "Pediatrics", "Psychology", "Sexology", "Weight loss", "Cardiology"];

const Index = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={ciraSpark} alt="Cira" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => scrollTo("scan")}
            className="text-muted-foreground text-sm hover:text-foreground transition-colors font-body"
          >
            Scan yourself
          </button>
          <button
            onClick={() => scrollTo("doctor")}
            className="text-muted-foreground text-sm hover:text-foreground transition-colors font-body"
          >
            Book a doctor
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground text-sm hover:text-foreground transition-colors font-body"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-xl mx-auto px-6 pt-12 pb-24 text-center">
        <div className="flex items-center justify-center mb-10">
          <img src={doctor1} alt="Doctor" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-background" />
          <img src={ciraSpark} alt="Cira" width={44} height={44} className="w-11 h-11 -ml-2 z-10" />
          <img src={doctor2} alt="Doctor" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-background -ml-2" />
        </div>

        <h1 className="font-heading text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-6">
          Hi, I'm Cira.<br />
          Tell me what's wrong.
        </h1>

        <div className="text-base text-muted-foreground leading-relaxed mb-10 space-y-1">
          <p>I'll ask you questions about what you're feeling.</p>
          <p>I'll scan your vitals through your camera if I need to.</p>
          <p>Then we decide together what to do next.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 text-left mb-4">
          <input
            type="text"
            placeholder="Tell me how you're feeling..."
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none mb-4 font-body"
            readOnly
          />
          <div className="flex flex-wrap gap-2 mb-5">
            {chips.map((chip) => (
              <button
                key={chip}
                className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-body"
              >
                {chip}
              </button>
            ))}
          </div>
          <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body">
            Talk to Cira →
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          🔒 Private · Free · Available 24/7
        </p>
      </main>

      {/* Scan yourself */}
      <section id="scan" className="max-w-xl mx-auto px-6 pb-20 pt-16 text-center">
        <h2 className="font-heading text-[38px] font-semibold text-foreground leading-tight mb-6">
          See what your body is actually saying.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-[480px] mx-auto mb-8 font-body whitespace-pre-line">
          {"Cira uses Shen AI — clinically validated\ncamera technology — to read 30+ vital signs\nfrom your face in 30 seconds.\n\nBlood pressure. Heart rate. HRV.\nStress index. Breathing rate.\nNo hardware. No wearables.\nJust your camera."}
        </p>

        <button className="bg-primary text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body mb-3">
          Start your scan →
        </button>

        <p className="text-xs text-muted-foreground mt-3 font-body">
          All processing on your device.<br />
          Nothing stored without your permission.
        </p>

        <div className="border-t border-border my-10" />

        <p className="text-[15px] text-muted-foreground leading-relaxed font-body whitespace-pre-line mb-4">
          {"Want to keep your results over time?\nSave your 30 vitals to a personal dashboard.\nTrack your patterns. Generate a report\nfor your doctor in one click."}
        </p>

        <a href="#" className="text-primary text-sm hover:opacity-80 transition-opacity font-body">
          Learn about health history tracking →
        </a>
      </section>

      {/* Book a doctor */}
      <section id="doctor" className="max-w-xl mx-auto px-6 pb-20 pt-16 text-center">
        <h2 className="font-heading text-[38px] font-semibold text-foreground leading-tight mb-6">
          See a real doctor.<br />
          Today. Anywhere.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-[480px] mx-auto mb-8 font-body">
          Choose the specialist you need.<br />
          A licensed doctor will take care of you.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {specialties.map((s) => (
            <span
              key={s}
              className="px-4 py-1.5 rounded-full border border-border text-sm text-muted-foreground font-body"
            >
              {s}
            </span>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-8 font-body">
          Satisfaction guaranteed or reimbursed.
        </p>

        <button className="bg-primary text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body mb-3">
          Book a doctor now →
        </button>

        <p className="text-xs text-muted-foreground mt-3 font-body">
          Powered by Air Doctor ·<br />
          Licensed physicians · Available globally 24/7
        </p>
      </section>


      {/* Footer */}
      <footer className="max-w-xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground space-y-2 font-body">
        <p>Cira does not replace professional medical advice.</p>
        <p>Vitals: Shen AI · Doctors: Air Doctor</p>
        <p>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          {" · "}
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        </p>
        <p>© 2026 Cira — askainurse.com</p>
      </footer>
    </div>
  );
};

export default Index;
