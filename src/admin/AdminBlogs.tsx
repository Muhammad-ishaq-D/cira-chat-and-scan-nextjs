import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Search, Eye, Upload, Image as ImageIcon, Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Link2, AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";
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

// Compress an uploaded image to a JPEG data URL (max 1600px wide, ~0.82 quality)
function compressCoverImage(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file"));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const useJpeg = file.type !== "image/png";
      resolve(canvas.toDataURL(useJpeg ? "image/jpeg" : "image/png", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [viewing, setViewing] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleCoverFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large (max 8 MB)");
      return;
    }
    setUploadingCover(true);
    try {
      const dataUrl = await compressCoverImage(file);
      setEditing((prev) => (prev ? { ...prev, cover_image: dataUrl } : prev));
      toast.success("Cover image ready");
    } catch (e: any) {
      toast.error(e?.message || "Failed to process image");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
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

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-8 flex justify-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No blog posts yet. Click "New post" to create one.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {filtered.map((b) => {
            const preview = b.excerpt || (b.content ? b.content.replace(/[#*`_>\-]/g, "").replace(/\s+/g, " ").trim() : "");
            return (
              <div key={b.id} className="flex items-center gap-4 p-3 sm:p-4 hover:bg-accent/30 transition group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
                  {b.cover_image ? (
                    <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium truncate">{b.title}</h3>
                    <span className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded shrink-0 ${b.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {b.status || "published"}
                    </span>
                  </div>
                  {preview && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{preview}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setViewing(b)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="View">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => openEdit(b)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(b)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setViewing(null)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between z-10">
              <div className="min-w-0">
                <h2 className="font-heading text-lg truncate">Preview</h2>
                <p className="text-xs text-muted-foreground truncate">/{viewing.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { const b = viewing; setViewing(null); openEdit(b); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent inline-flex items-center gap-1.5"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-accent">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-5 md:p-8">
              {viewing.cover_image && (
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted mb-6">
                  <img src={viewing.cover_image} alt={viewing.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded ${viewing.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                  {viewing.status || "published"}
                </span>
                {viewing.author && <span className="text-xs text-muted-foreground">By {viewing.author}</span>}
                {viewing.reading_time && <span className="text-xs text-muted-foreground">· {viewing.reading_time} min read</span>}
              </div>
              <h1 className="font-heading text-2xl md:text-3xl mb-3">{viewing.title}</h1>
              {viewing.excerpt && <p className="text-base text-muted-foreground mb-6">{viewing.excerpt}</p>}
              <div className="prose prose-neutral max-w-none">
                <ReactMarkdown>{viewing.content || ""}</ReactMarkdown>
              </div>
              {Array.isArray(viewing.tags) && viewing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-border">
                  {viewing.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full max-w-4xl h-[100dvh] md:h-auto md:max-h-[95vh] flex flex-col overflow-hidden">
            <div className="bg-card border-b border-border px-4 md:px-5 py-3 flex items-center justify-between shrink-0">
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

            <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
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
                <Field label="Cover image">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverFile(e.target.files?.[0])}
                    className="hidden"
                  />
                  {editing.cover_image ? (
                    <div className="flex items-stretch gap-3">
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                        <img src={editing.cover_image} alt="cover preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingCover}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {uploadingCover ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing({ ...editing, cover_image: "" })}
                          className="text-xs px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="w-full h-24 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-accent/30 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition disabled:opacity-50"
                    >
                      {uploadingCover ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Processing image...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={18} />
                          <span>Click to upload cover image</span>
                          <span className="text-[10px]">JPG, PNG, WEBP — max 8 MB</span>
                        </>
                      )}
                    </button>
                  )}
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

            <div className="bg-card border-t border-border px-4 md:px-5 py-3 flex justify-end gap-2 shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
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
