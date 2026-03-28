import ciraSpark from "@/assets/cira-spark.png";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={ciraSpark} alt="Cira" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
        </button>
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors font-body"
        >
          Log out
        </button>
      </nav>

      <main className="max-w-xl mx-auto px-6 pt-12 pb-24">
        <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">Your dashboard</h1>
        <p className="text-muted-foreground text-base font-body mb-10">Your vitals and history in one place.</p>

        {/* Scan history */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Scan history</h2>
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm font-body">No scans yet. Run your first scan to see results here.</p>
          </div>
        </section>

        {/* Vitals over time */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Vitals over time</h2>
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm font-body">Your vitals will appear here after your first scan.</p>
          </div>
        </section>

        {/* Doctor report */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Doctor report</h2>
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <p className="text-muted-foreground text-sm font-body">No reports generated yet.</p>
          </div>
        </section>

        {/* Scan again */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="bg-primary text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body"
          >
            Scan yourself again →
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
