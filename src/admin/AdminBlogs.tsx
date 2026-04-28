import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { adminApi, type BlogPost } from "@/lib/apiClient";
import { toast } from "sonner";

const emptyPost: Partial<BlogPost> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  author: "",
  tags: "",
  status: "published",
  meta_title: "",
  meta_description: "",
  reading_time: undefined,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await adminApi.getBlogs();
      const list: BlogPost[] = Array.isArray(data) ? data : (data?.blogs || []);
      setBlogs(list);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => blogs.filter((b) => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.slug?.toLowerCase().includes(search.toLowerCase())),
    [blogs, search]
  );

  const openNew = () => { setEditing({ ...emptyPost }); setPreviewMode(false); };
  const openEdit = (b: BlogPost) => {
    setEditing({
      ...b,
      tags: Array.isArray(b.tags) ? b.tags.join(", ") : b.tags || "",
    });
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!editing?.title || !editing?.content) {
      toast.error("Title and content are required");
      return;
    }
    const payload: Partial<BlogPost> = {
      ...editing,
      slug: editing.slug || slugify(editing.title),
      tags: typeof editing.tags === "string"
        ? editing.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : editing.tags,
      reading_time: editing.reading_time
        ? Number(editing.reading_time)
        : Math.max(1, Math.round((editing.content || "").split(/\s+/).length / 200)),
    };
    setSaving(true);
    try {
      if (editing.id) {
        await adminApi.updateBlog(editing.id, payload);
        toast.success("Blog updated");
      } else {
        await adminApi.createBlog(payload);
        toast.success("Blog created");
      }
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: BlogPost) => {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteBlog(b.id);
      toast.success("Deleted");
      setBlogs((prev) => prev.filter((p) => p.id !== b.id));
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Blogs</h1>
          <p className="text-sm text-muted-foreground">Create, edit and publish blog posts.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={16} /> New post
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No blog posts yet. Click "New post" to create one.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-4 p-4 hover:bg-accent/30 transition">
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                  {b.cover_image && <img src={b.cover_image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium truncate">{b.title}</h3>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${b.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {b.status || "published"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">/{b.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link to={`/blog/${b.slug}`} target="_blank" className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="View">
                    <Eye size={16} />
                  </Link>
                  <button onClick={() => openEdit(b)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(b)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between z-10">
              <h2 className="font-heading text-lg">{editing.id ? "Edit post" : "New post"}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
                >
                  {previewMode ? "Edit" : "Preview"}
                </button>
                <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-accent">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Title *">
                  <input
                    value={editing.title || ""}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })}
                    className="input"
                  />
                </Field>
                <Field label="Slug">
                  <input
                    value={editing.slug || ""}
                    onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                    className="input"
                    placeholder="auto-generated"
                  />
                </Field>
              </div>

              <Field label="Excerpt">
                <textarea
                  value={editing.excerpt || ""}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  rows={2}
                  className="input"
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Cover image URL">
                  <input
                    value={editing.cover_image || ""}
                    onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </Field>
                <Field label="Author">
                  <input
                    value={editing.author || ""}
                    onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Tags (comma separated)">
                  <input
                    value={(editing.tags as string) || ""}
                    onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                    className="input"
                    placeholder="health, ai, vitals"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={editing.status || "published"}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                    className="input"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </Field>
                <Field label="Reading time (min)">
                  <input
                    type="number"
                    value={editing.reading_time ?? ""}
                    onChange={(e) => setEditing({ ...editing, reading_time: e.target.value ? Number(e.target.value) : undefined })}
                    className="input"
                    placeholder="auto"
                  />
                </Field>
              </div>

              <Field label="Content (Markdown) *">
                {previewMode ? (
                  <div className="prose prose-neutral max-w-none border border-border rounded-lg p-4 min-h-[300px] bg-background">
                    <ReactMarkdown>{editing.content || "*Nothing to preview*"}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={editing.content || ""}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    rows={14}
                    className="input font-mono text-sm"
                    placeholder="# Heading&#10;&#10;Write in markdown..."
                  />
                )}
              </Field>

              <details className="border border-border rounded-lg">
                <summary className="px-4 py-2 cursor-pointer text-sm font-medium">SEO meta</summary>
                <div className="p-4 space-y-3">
                  <Field label="Meta title">
                    <input
                      value={editing.meta_title || ""}
                      onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })}
                      className="input"
                    />
                  </Field>
                  <Field label="Meta description">
                    <textarea
                      value={editing.meta_description || ""}
                      onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })}
                      rows={2}
                      className="input"
                    />
                  </Field>
                </div>
              </details>
            </div>

            <div className="sticky bottom-0 bg-card border-t border-border px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing.id ? "Save changes" : "Create post"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3); }
      `}</style>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
    {children}
  </label>
);

export default AdminBlogs;
