// Reusable FAQPage JSON-LD builder.
// Pass an array of { q, a } pairs from any page (translations, CMS, hard-coded)
// and drop the result into <SEO jsonLd={[...]}>. Produces a schema that
// passes Google's Rich Results validation for the FAQ rich snippet.

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqSchemaOptions {
  /** Optional canonical URL for the FAQ page (becomes @id). */
  url?: string;
}

export const buildFaqJsonLd = (faqs: FaqItem[], options: FaqSchemaOptions = {}) => {
  const cleaned = faqs.filter((f) => f && f.q && f.a);
  if (cleaned.length === 0) return null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cleaned.map((f) => ({
      "@type": "Question",
      name: String(f.q).trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: String(f.a).trim(),
      },
    })),
  };

  if (options.url) schema["@id"] = `${options.url}#faq`;
  return schema;
};
