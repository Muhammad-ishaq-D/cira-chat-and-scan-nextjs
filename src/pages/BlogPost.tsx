import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { blogsApi, type BlogPost as BlogPostType } from "@/lib/apiClient";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const data: any = await blogsApi.getBySlug(slug);
        const p: BlogPostType = data?.blog || data;
        setPost(p);
        if (p?.title) {
          document.title = `${p.meta_title || p.title} — Cira Blog`;
          const meta = document.querySelector('meta[name="description"]');
          if (meta) meta.setAttribute("content", p.meta_description || p.excerpt || p.title);
        }
      } catch (e: any) {
        setError(e?.message || "Blog post not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const tags = Array.isArray(post?.tags)
    ? post?.tags
    : typeof post?.tags === "string"
      ? post.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="max-w-3xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <Link to="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> All articles
        </Link>
        <button onClick={() => navigate("/")} className="font-heading text-lg">Cira</button>
      </header>

      {loading ? (
        <div className="max-w-3xl mx-auto px-6 py-20 animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded mt-6" />
        </div>
      ) : error || !post ? (
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground mb-4">{error || "Post not found"}</p>
          <Link to="/blog" className="text-primary hover:underline">Browse all posts</Link>
        </div>
      ) : (
        <article className="max-w-3xl mx-auto px-6 pb-20">
          <header className="py-6">
            <h1 className="font-heading text-3xl md:text-5xl leading-tight mb-4">{post.title}</h1>
            {post.excerpt && <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {post.author && (
                <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
              )}
              {post.published_at && (
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(post.published_at).toLocaleDateString()}</span>
              )}
              {post.reading_time ? (
                <span className="flex items-center gap-1.5"><Clock size={14} /> {post.reading_time} min read</span>
              ) : null}
            </div>
          </header>

          {post.cover_image && (
            <div className="rounded-2xl overflow-hidden mb-8 bg-muted">
              <img src={post.cover_image} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          )}

          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-primary">
            <ReactMarkdown>{post.content || ""}</ReactMarkdown>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
              {tags.map((t) => (
                <span key={t} className="text-xs bg-muted px-3 py-1 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </article>
      )}

      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground">
        © 2026 Cira — askainurse.com
      </footer>
    </div>
  );
};

export default BlogPost;
