import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

const SITE_URL = "https://askainurse.com";
const DEFAULT_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/79f99a8b-3f4e-4ecf-a1d4-22d65314359f/id-preview-e35fc074--394ea854-8adf-4e5d-9a7c-bdae5eafddc9.lovable.app-1774687898031.png";

interface SEOProps {
  title: string;
  description: string;
  path: string; // e.g. "/", "/pricing"
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SEO = ({ title, description, path, image, noindex, jsonLd }: SEOProps) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];
  const url = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;
  const safeTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
  const safeDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <html lang={lang} />
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={lang} />

      <meta name="twitter:card" content="summary_large_image" />
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
