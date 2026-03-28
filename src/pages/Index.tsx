import ciraSpark from "@/assets/cira-spark.png";
import doctor1 from "@/assets/doctor-1.jpg";
import doctor2 from "@/assets/doctor-2.jpg";

const chips = [
  "My heart is racing",
  "I have pain",
  "I feel unwell",
  "I'm worried",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={ciraSpark} alt="Cira" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
        </div>
        <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
          Sign in
        </a>
      </nav>

      {/* Hero */}
      <main className="max-w-xl mx-auto px-6 pt-12 pb-24 text-center">
        {/* Avatar cluster */}
        <div className="flex items-center justify-center gap-[-8px] mb-10">
          <img
            src={doctor1}
            alt="Doctor"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border-2 border-background"
          />
          <img
            src={ciraSpark}
            alt="Cira"
            width={44}
            height={44}
            className="w-11 h-11 -ml-2 z-10"
          />
          <img
            src={doctor2}
            alt="Doctor"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border-2 border-background -ml-2"
          />
        </div>

        {/* H1 */}
        <h1 className="font-heading text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-6">
          Hi, I'm Cira.<br />
          Tell me what's wrong.
        </h1>

        {/* Subtitle */}
        <div className="text-base text-muted-foreground leading-relaxed mb-10 space-y-1">
          <p>I'll ask you questions about what you're feeling.</p>
          <p>I'll scan your vitals through your camera if I need to.</p>
          <p>Then we decide together what to do next.</p>
        </div>

        {/* Chat card */}
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

      {/* Three steps */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center md:text-left">
          <div>
            <p className="text-sm text-muted-foreground mb-1 font-body">1</p>
            <p className="text-foreground font-body">You tell Cira<br />what's wrong</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1 font-body">2</p>
            <p className="text-foreground font-body">She scans your<br />vitals if needed</p>
            <p className="text-sm text-muted-foreground mt-1 font-body">30 seconds · Real data</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1 font-body">3</p>
            <p className="text-foreground font-body">Book a doctor<br />or keep talking</p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground italic mt-12 font-body">
          If you need a doctor — connected in under an hour, anywhere in the world.
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
