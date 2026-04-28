import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { blogsApi, type BlogPost } from "@/lib/apiClient";

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Blog — Cira AI Health Nurse";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Insights on AI-powered health, vitals scanning, and preventive wellness from the Cira team.");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await blogsApi.getAll();
        const list: BlogPost[] = Array.isArray(data) ? data : (data?.blogs || []);
        setPosts(list.filter((p) => (p.status ?? "published") === "published"));
      } catch (e: any) {
        setError(e?.message || "Failed to load blogs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Home
        </button>
        <span className="font-heading text-lg">Cira</span>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-10 text-center">
        <h1 className="font-heading text-4xl md:text-5xl mb-3">The Cira Journal</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Notes on AI-assisted health, face-scan vitals, and the science behind preventive care.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-20">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">No blog posts yet. Check back soon.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all"
              >
                {post.cover_image ? (
                  <div className="h-44 overflow-hidden bg-muted">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <div className="p-5">
                  <h2 className="font-heading text-lg leading-snug mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(post.published_at).toLocaleDateString()}
                      </span>
                    )}
                    {post.reading_time ? (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.reading_time} min
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground">
        © 2026 Cira — askainurse.com
      </footer>
    </div>
  );
};

export default Blog;
