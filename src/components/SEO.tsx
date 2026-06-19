import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SITE_URL, sitewideJsonLd, getRouteSEO } from "@/config/seo";

const DEFAULT_OG_IMAGE = "https://askainurse.com/og-image.jpg";

interface SEOProps {
  path: string; // e.g. "/", "/pricing"
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
  type?: "website" | "article";
}

const SEO = ({ title, description, path, image, noindex, jsonLd, type = "website" }: SEOProps) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];
  const url = `${SITE_URL}${path}`;

  // Fall back to centralized config when caller doesn't override.
  const fallback = getRouteSEO(path);
  const resolvedTitle = title ?? fallback?.title ?? "Cira — your AI health nurse";
  const resolvedDesc =
    description ?? fallback?.description ?? "Cira is your AI health nurse, anytime.";
  const resolvedNoindex = noindex ?? fallback?.noindex ?? false;
  const resolvedJsonLd = jsonLd ?? fallback?.jsonLd;

  const ogImage = image || DEFAULT_OG_IMAGE;
  const safeTitle = resolvedTitle.length > 60 ? resolvedTitle.slice(0, 57) + "..." : resolvedTitle;
  const safeDesc = resolvedDesc.length > 160 ? resolvedDesc.slice(0, 157) + "..." : resolvedDesc;
  const routeLdArray = resolvedJsonLd ? (Array.isArray(resolvedJsonLd) ? resolvedJsonLd : [resolvedJsonLd]) : [];
  const ldArray = [...sitewideJsonLd, ...routeLdArray];

  return (
    <Helmet prioritizeSeoTags>
      <html lang={lang} />
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <meta name="robots" content={resolvedNoindex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Cira AI Nurse" />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={lang} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@askainurse" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      <meta name="twitter:image" content={ogImage} />

      {ldArray.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
