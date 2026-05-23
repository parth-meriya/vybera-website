import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'VYBERA';
const SITE_URL = 'https://vybera.shop';
const DEFAULT_OG_IMAGE = `${SITE_URL}/vybera-og.png`;

/**
 * Reusable SEO head component for every page.
 * Sets title, meta description, keywords, Open Graph, Twitter Cards, and canonical URL.
 *
 * @param {object} props
 * @param {string} props.title      — Page title (appended with " | VYBERA")
 * @param {string} props.description — Meta description (max ~155 chars for SERP)
 * @param {string} [props.keywords]  — Comma-separated keywords
 * @param {string} [props.path]      — URL path for canonical (e.g. "/shop")
 * @param {string} [props.image]     — Open Graph image URL
 * @param {string} [props.type]      — OG type, default "website"
 */
const SEO = ({
  title,
  description,
  keywords = '',
  path = '',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — The Era of Vibes`;
  const canonicalUrl = `${SITE_URL}${path}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      <meta name="theme-color" content="#111111" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Extras */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="VYBERA" />
    </Helmet>
  );
};

export default SEO;
