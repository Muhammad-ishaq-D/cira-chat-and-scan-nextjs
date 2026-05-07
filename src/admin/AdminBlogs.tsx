import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Search, Eye, Upload, Image as ImageIcon, Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Link2, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Undo, Redo, Palette } from "lucide-react";
import { Link } from "react-router-dom";
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

const listBlockSelector = "p,div,h1,h2,h3,h4,h5,h6,li,blockquote,pre";

const hasMeaningfulContent = (node: Node) =>
  Boolean(node.textContent?.replace(/\u00a0/g, " ").trim()) ||
  (node instanceof Element && Boolean(node.querySelector("img,video,iframe")));

const cloneChildrenInto = (target: HTMLElement, source: Node) => {
  if (source instanceof HTMLElement) {
    Array.from(source.childNodes).forEach((child) => target.appendChild(child.cloneNode(true)));
  } else {
    target.appendChild(source.cloneNode(true));
  }
};

const createListItemsFromRange = (range: Range) => {
  const container = document.createElement("div");
  container.appendChild(range.cloneContents());
  const items: HTMLLIElement[] = [];
  let inlineItem = document.createElement("li");

  const flushInlineItem = () => {
    if (hasMeaningfulContent(inlineItem)) items.push(inlineItem);
    inlineItem = document.createElement("li");
  };

  const pushBlockItem = (element: HTMLElement) => {
    if (element.querySelector("br")) {
      let splitItem = document.createElement("li");
      Array.from(element.childNodes).forEach((child) => {
        if (child.nodeName === "BR") {
          if (hasMeaningfulContent(splitItem)) items.push(splitItem);
          splitItem = document.createElement("li");
        } else {
          splitItem.appendChild(child.cloneNode(true));
        }
      });
      if (hasMeaningfulContent(splitItem)) items.push(splitItem);
      return;
    }

    const item = document.createElement("li");
    cloneChildrenInto(item, element);
    if (hasMeaningfulContent(item)) items.push(item);
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = (node.textContent || "").split(/\r?\n/);
      parts.forEach((part, index) => {
        if (index > 0) flushInlineItem();
        if (part.trim()) inlineItem.appendChild(document.createTextNode(part));
      });
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    if (node.nodeName === "BR") {
      flushInlineItem();
      return;
    }

    if (node.matches(listBlockSelector)) {
      flushInlineItem();
      const nestedBlocks = Array.from(node.children).some(
        (child) => child instanceof HTMLElement && (child.matches(listBlockSelector) || Boolean(child.querySelector(listBlockSelector)))
      );
      if (nestedBlocks && node.nodeName === "DIV") {
        Array.from(node.childNodes).forEach(walk);
      } else {
        pushBlockItem(node);
      }
      return;
    }

    inlineItem.appendChild(node.cloneNode(true));
  };

  Array.from(container.childNodes).forEach(walk);
  flushInlineItem();
  return items;
};

const sanitizeBlogHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());
  doc.body.querySelectorAll("*").forEach((node) => {
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || ((name === "href" || name === "src") && value.startsWith("javascript:"))) {
        node.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
};

const normalizeBlogForEditor = (post: Partial<BlogPost> | null | undefined): Partial<BlogPost> => {
  const raw = (post || {}) as Partial<BlogPost> & Record<string, any>;
  const tagsArr = Array.isArray(raw.tags)
    ? raw.tags
    : typeof raw.tags === "string" && raw.tags
      ? raw.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  return {
    ...raw,
    tags: tagsArr as any,
    content: raw.content ?? raw.body ?? "",
    meta_title: raw.meta_title ?? raw.metaTitle ?? raw.seo_title ?? raw.seoTitle ?? "",
    meta_description: raw.meta_description ?? raw.metaDescription ?? raw.seo_description ?? raw.seoDescription ?? "",
  };
};

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
  const [tagInput, setTagInput] = useState("");
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastLoadedContentRef = useRef<string | null>(null);
  const slugManuallyEditedRef = useRef<boolean>(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [currentFont, setCurrentFont] = useState<string>("");
  const [currentSize, setCurrentSize] = useState<string>("");

  const fontOptions = [
    { value: "Inter, sans-serif", label: "Inter" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "'Playfair Display', serif", label: "Playfair" },
    { value: "'Times New Roman', serif", label: "Times New Roman" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "'Courier New', monospace", label: "Courier" },
  ];
  const sizeOptions = [
    { value: "12px", label: "Small" },
    { value: "16px", label: "Normal" },
    { value: "20px", label: "Large" },
    { value: "28px", label: "XL" },
    { value: "36px", label: "XXL" },
  ];

  const normalizeFont = (raw: string) => raw.replace(/["']/g, "").replace(/\s+/g, "").toLowerCase();
  const matchFont = (fontFamily: string): string => {
    if (!fontFamily) return "";
    const first = normalizeFont(fontFamily.split(",")[0] || "");
    const found = fontOptions.find((o) => {
      const optFirst = normalizeFont(o.value.split(",")[0] || "");
      return optFirst === first;
    });
    return found?.value || "";
  };
  const matchSize = (px: string): string => {
    if (!px) return "";
    const n = parseFloat(px);
    if (!isFinite(n)) return "";
    let best = "";
    let bestDiff = Infinity;
    for (const o of sizeOptions) {
      const diff = Math.abs(parseFloat(o.value) - n);
      if (diff < bestDiff) { bestDiff = diff; best = o.value; }
    }
    return bestDiff <= 2 ? best : "";
  };

  const detectCurrentStyles = () => {
    const el = contentRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    let node: Node | null = range.startContainer;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    if (!(node instanceof Element)) return;
    const cs = window.getComputedStyle(node as Element);
    setCurrentFont(matchFont(cs.fontFamily || ""));
    setCurrentSize(matchSize(cs.fontSize || ""));
  };

  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [activeBlock, setActiveBlock] = useState<string>("");
  const [activeAlign, setActiveAlign] = useState<string>("");

  const detectActiveFormats = () => {
    const el = contentRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!el.contains(sel.anchorNode)) return;
    const q = (cmd: string) => { try { return document.queryCommandState(cmd); } catch { return false; } };
    setActiveFormats({
      bold: q("bold"),
      italic: q("italic"),
      underline: q("underline"),
      strikeThrough: q("strikeThrough"),
      insertUnorderedList: q("insertUnorderedList"),
      insertOrderedList: q("insertOrderedList"),
    });
    setActiveAlign(
      q("justifyLeft") ? "left" :
      q("justifyCenter") ? "center" :
      q("justifyRight") ? "right" :
      q("justifyFull") ? "full" : ""
    );
    let node: Node | null = sel.getRangeAt(0).startContainer;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    let block = "";
    while (node && node !== el) {
      if (node instanceof HTMLElement) {
        const tag = node.tagName;
        if (/^(H1|H2|H3|H4|H5|H6|P|BLOCKQUOTE|PRE)$/.test(tag)) { block = tag; break; }
      }
      node = node.parentNode;
    }
    setActiveBlock(block);
  };

  useEffect(() => {
    if (!editing) return;
    const handler = () => { detectCurrentStyles(); detectActiveFormats(); };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [editing]);

  const editorContainsRange = (range: Range) => {
    const el = contentRef.current;
    return !!el && el.contains(range.commonAncestorContainer);
  };

  const getCurrentEditorRange = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    return editorContainsRange(range) ? range : null;
  };

  const getEditorRange = () => {
    const currentRange = getCurrentEditorRange();
    if (currentRange) return currentRange;
    restoreSelection();
    return getCurrentEditorRange();
  };

  // Save the current selection range if it's inside the editor
  const saveSelection = () => {
    const el = contentRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  // Restore the saved selection back into the editor
  const restoreSelection = () => {
    const el = contentRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const currentRange = getCurrentEditorRange();
    if (currentRange) return;
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    } else {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  // Run a document.execCommand on the editor's current selection
  const exec = (command: string, value?: string) => {
    const el = contentRef.current;
    if (!el) return;
    restoreSelection();
    const useCss = command !== "insertUnorderedList" && command !== "insertOrderedList";
    try {
      document.execCommand("styleWithCSS", false, useCss ? "true" : "false");
    } catch {
      // Some browsers ignore styleWithCSS; the formatting command can still run.
    }
    document.execCommand(command, false, value);
    saveSelection();
    syncContentFromDom();
  };

  const replaceSelectionWithBlock = (tagName: "ul" | "ol" | "blockquote" | "pre") => {
    const range = getEditorRange();
    if (!range) return;
    const listCommand = tagName === "ul" ? "insertUnorderedList" : tagName === "ol" ? "insertOrderedList" : null;
    if (listCommand && document.queryCommandEnabled(listCommand)) {
      exec(listCommand);
      return;
    }
    const selectedText = range.toString();
    const block = document.createElement(tagName);

    if (tagName === "ul" || tagName === "ol") {
      const items = createListItemsFromRange(range);
      if (!items.length) items.push(document.createElement("li"));
      items.forEach((li) => {
        if (!hasMeaningfulContent(li)) li.appendChild(document.createElement("br"));
        block.appendChild(li);
      });
    } else if (tagName === "pre") {
      const code = document.createElement("code");
      code.textContent = selectedText || " ";
      block.appendChild(code);
    } else {
      block.textContent = selectedText || " ";
    }

    range.deleteContents();
    range.insertNode(block);
    const nextRange = document.createRange();
    nextRange.selectNodeContents(block);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    syncContentFromDom();
  };

  const syncContentFromDom = () => {
    const el = contentRef.current;
    if (!el) return;
    const html = el.innerHTML;
    setEditing((prev) => (prev ? { ...prev, content: html } : prev));
  };

  // Wrap current selection in an inline span with the given inline style.
  // Preserves the selection so the user sees the result applied.
  const wrapSelectionWithStyle = (style: string) => {
    const el = contentRef.current;
    if (!el) return;
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement("span");
    span.setAttribute("style", style);
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    } catch {
      toast.error("Select text inside the content field first");
    }
    syncContentFromDom();
  };

  const addTag = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setEditing((prev) => {
      if (!prev) return prev;
      const current = Array.isArray(prev.tags) ? (prev.tags as string[]) : [];
      const merged = [...current];
      for (const p of parts) if (!merged.includes(p)) merged.push(p);
      return { ...prev, tags: merged as any };
    });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const current = Array.isArray(prev.tags) ? (prev.tags as string[]) : [];
      return { ...prev, tags: current.filter((t) => t !== tag) as any };
    });
  };

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

  const openNew = () => {
    lastLoadedContentRef.current = null;
    slugManuallyEditedRef.current = false;
    setEditing({ ...emptyPost, tags: [] as any });
    setPreviewMode(false);
  };
  const openEdit = async (b: BlogPost) => {
    lastLoadedContentRef.current = null;
    slugManuallyEditedRef.current = true;
    setPreviewMode(false);
    setEditing(normalizeBlogForEditor(b));

    try {
      const res: any = await adminApi.getBlog(b.id);
      const full = (res?.blog ?? res) as BlogPost;
      if (full) {
        lastLoadedContentRef.current = null;
        setEditing(normalizeBlogForEditor({ ...b, ...full }));
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load full post content");
    }
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
            const preview = b.excerpt || (b.content ? b.content.replace(/[-#*`_>]/g, "").replace(/\s+/g, " ").trim() : "");
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
                  <button onClick={async () => {
                    setViewing(b);
                    try {
                      const res: any = await adminApi.getBlog(b.id);
                      const full = (res?.blog ?? res) as BlogPost;
                      if (full && (full.content || "").length >= (b.content || "").length) {
                        setViewing(full);
                      }
                    } catch {}
                  }} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="View">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => { void openEdit(b); }} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Edit">
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
                  onClick={() => { const b = viewing; setViewing(null); void openEdit(b); }}
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
              <div
                className="prose prose-neutral max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(viewing.content || "") }}
              />
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
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditing({
                        ...editing,
                        title: newTitle,
                        slug: slugManuallyEditedRef.current ? editing.slug : slugify(newTitle),
                      });
                    }}
                    className="input"
                    placeholder="e.g. 5 ways AI is changing preventive healthcare"
                  />
                </Field>
                <Field label="Slug">
                  <input
                    value={editing.slug || ""}
                    onChange={(e) => {
                      slugManuallyEditedRef.current = true;
                      setEditing({ ...editing, slug: slugify(e.target.value) });
                    }}
                    className="input"
                    placeholder="auto-generated from title"
                  />
                </Field>
              </div>

              <Field label="Excerpt">
                <textarea
                  value={editing.excerpt || ""}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  rows={2}
                  className="input"
                  placeholder="A short summary (1-2 sentences) shown on the blog list and in social previews"
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
                <Field label="Tags">
                  <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-lg bg-background border border-border focus-within:ring-2 focus-within:ring-primary/30 min-h-[40px]">
                    {(Array.isArray(editing.tags) ? (editing.tags as string[]) : []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="rounded-full hover:bg-primary/20 p-0.5"
                          aria-label={`Remove ${tag}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v.endsWith(",")) {
                          addTag(v);
                        } else {
                          setTagInput(v);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Tab") {
                          if (tagInput.trim()) {
                            e.preventDefault();
                            addTag(tagInput);
                          }
                        } else if (e.key === "Backspace" && !tagInput) {
                          const arr = Array.isArray(editing.tags) ? (editing.tags as string[]) : [];
                          if (arr.length) removeTag(arr[arr.length - 1]);
                        }
                      }}
                      onBlur={() => tagInput.trim() && addTag(tagInput)}
                      placeholder={(Array.isArray(editing.tags) && editing.tags.length) ? "" : "Type and press Enter"}
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
                    />
                  </div>
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

              <Field label="Content *">
                {previewMode ? (
                  <div
                    className="prose prose-neutral max-w-none border border-border rounded-lg p-4 min-h-[300px] bg-background"
                    dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(editing.content || "<p><em>Nothing to preview</em></p>") }}
                  />
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden bg-background">
                    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/40">
                      <ToolbarBtn title="Heading 1" onClick={() => exec("formatBlock", "H1")}><Heading1 size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Heading 2" onClick={() => exec("formatBlock", "H2")}><Heading2 size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Heading 3" onClick={() => exec("formatBlock", "H3")}><Heading3 size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Paragraph" onClick={() => exec("formatBlock", "P")}><Type size={14} /></ToolbarBtn>
                      <ToolbarSep />
                      <ToolbarBtn title="Bold" onClick={() => exec("bold")}><Bold size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Italic" onClick={() => exec("italic")}><Italic size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Underline" onClick={() => exec("underline")}><Underline size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Strikethrough" onClick={() => exec("strikeThrough")}><Strikethrough size={14} /></ToolbarBtn>
                      <ToolbarSep />
                      <ToolbarBtn title="Bulleted list" onClick={() => replaceSelectionWithBlock("ul")}><List size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Numbered list" onClick={() => replaceSelectionWithBlock("ol")}><ListOrdered size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Quote" onClick={() => replaceSelectionWithBlock("blockquote")}><Quote size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Code block" onClick={() => replaceSelectionWithBlock("pre")}><Code size={14} /></ToolbarBtn>
                      <ToolbarSep />
                      <ToolbarBtn title="Align left" onClick={() => exec("justifyLeft")}><AlignLeft size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Align center" onClick={() => exec("justifyCenter")}><AlignCenter size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Align right" onClick={() => exec("justifyRight")}><AlignRight size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Justify" onClick={() => exec("justifyFull")}><AlignJustify size={14} /></ToolbarBtn>
                      <ToolbarSep />
                      <ToolbarBtn title="Link" onClick={() => {
                        const url = window.prompt("Enter URL", "https://");
                        if (url) exec("createLink", url);
                      }}><Link2 size={14} /></ToolbarBtn>
                      <ToolbarBtn title="Image" onClick={() => {
                        const url = window.prompt("Image URL", "https://");
                        if (url) exec("insertImage", url);
                      }}><ImageIcon size={14} /></ToolbarBtn>
                      <ToolbarSep />
                      <select
                        title="Font family"
                        value={currentFont}
                        onMouseDown={saveSelection}
                        onChange={(e) => {
                          const ff = e.target.value;
                          if (!ff) return;
                          exec("fontName", ff);
                          setCurrentFont(ff);
                        }}
                        className="text-xs bg-background border border-border rounded px-1.5 py-1 hover:bg-accent cursor-pointer"
                      >
                        <option value="">Font</option>
                        {fontOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <select
                        title="Text size"
                        value={currentSize}
                        onMouseDown={saveSelection}
                        onChange={(e) => {
                          const fs = e.target.value;
                          if (!fs) return;
                          wrapSelectionWithStyle(`font-size:${fs}`);
                          setCurrentSize(fs);
                        }}
                        className="text-xs bg-background border border-border rounded px-1.5 py-1 hover:bg-accent cursor-pointer"
                      >
                        <option value="">Size</option>
                        {sizeOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <label className="inline-flex items-center gap-1 text-xs px-1.5 py-1 rounded hover:bg-accent cursor-pointer" title="Text color">
                        <Palette size={14} />
                        <input
                          type="color"
                          onMouseDown={() => saveSelection()}
                          onChange={(e) => {
                            exec("foreColor", e.target.value);
                            e.target.value = "#000000";
                          }}
                          className="w-4 h-4 border-0 bg-transparent cursor-pointer p-0"
                        />
                      </label>
                      <ToolbarBtn title="Clear formatting" onClick={() => exec("removeFormat")}><X size={14} /></ToolbarBtn>
                    </div>
                    <div
                      ref={(el) => {
                        contentRef.current = el;
                        if (el && lastLoadedContentRef.current !== (editing.content || "")) {
                          el.innerHTML = editing.content || "";
                          lastLoadedContentRef.current = editing.content || "";
                        }
                      }}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() => {
                        const el = contentRef.current;
                        if (!el) return;
                        lastLoadedContentRef.current = el.innerHTML;
                        saveSelection();
                        syncContentFromDom();
                      }}
                      onMouseUp={saveSelection}
                      onKeyUp={saveSelection}
                      onBlur={saveSelection}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData("text/plain");
                        document.execCommand("insertText", false, text);
                      }}
                      data-placeholder="Start writing your post... Select text and use the toolbar to format."
                      className="prose prose-neutral max-w-none w-full px-3 py-3 bg-background outline-none text-sm min-h-[320px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
                    />
                  </div>
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

const ToolbarBtn = ({ children, onClick, title, active }: { children: React.ReactNode; onClick: () => void; title: string; active?: boolean }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    aria-pressed={active ? true : undefined}
    className={`p-1.5 rounded transition ${active ? "bg-primary/15 text-primary" : "hover:bg-accent text-foreground/80 hover:text-foreground"}`}
  >
    {children}
  </button>
);

const ToolbarSep = () => <div className="w-px h-5 bg-border mx-1" />;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
    {children}
  </label>
);

export default AdminBlogs;
