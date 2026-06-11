import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { blogsApi, type BlogPost as BlogPostType } from "@/lib/apiClient";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";

const blogContentClassName = "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-primary [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_li]:my-1 [&_li]:pl-1";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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
        setError(e?.message || t("blog.notFound"));
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, t]);

  const tags = Array.isArray(post?.tags)
    ? post?.tags
    : typeof post?.tags === "string"
      ? post.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  const seoTitle = post?.meta_title || post?.title || "Cira Blog";
  const seoDesc = post?.meta_description || post?.excerpt || "Read the latest from Cira — AI health & wellbeing articles.";
  const seoPath = `/blog/${slug || ""}`;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={seoPath}
        image={post?.cover_image || undefined}
        type="article"
        jsonLd={post ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt || undefined,
          image: post.cover_image || undefined,
          datePublished: post.published_at || undefined,
          author: post.author ? { "@type": "Person", name: post.author } : undefined,
        } : undefined}
      />
    <div className="min-h-screen bg-background font-body">
      <header className="max-w-3xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <Link to="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> {t("blog.allArticles")}
        </Link>
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={ciraLogo} alt="Cira" width={24} height={24} />
          <span className="font-heading text-base font-semibold text-foreground">Cira</span>
        </button>
      </header>

      {loading ? (
        <div className="max-w-3xl mx-auto px-6 py-20 animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded mt-6" />
        </div>
      ) : error || !post ? (
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground mb-4">{error || t("blog.notFound")}</p>
          <Link to="/blog" className="text-primary hover:underline">{t("blog.browseAll")}</Link>
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
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(post.published_at).toLocaleDateString(i18n.language)}</span>
              )}
              {post.reading_time ? (
                <span className="flex items-center gap-1.5"><Clock size={14} /> {t("blog.minReadFull", { count: post.reading_time })}</span>
              ) : null}
            </div>
          </header>

          {post.cover_image && (
            <div className="rounded-2xl overflow-hidden mb-8 bg-muted">
              <img src={post.cover_image} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          )}

          <div className={blogContentClassName}>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{post.content || ""}</ReactMarkdown>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
              {tags.map((tag) => (
                <span key={tag} className="text-xs bg-muted px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </article>
      )}

      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground">
        {t("blog.footer")}
      </footer>
    </div>
    </>
  );
};

export default BlogPost;
