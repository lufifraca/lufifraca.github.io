// Global site metadata. Imported across pages, RSS, and sitemap.

export const SITE_TITLE = "Luca Ficano Latimer — Developer Relations at Archil";
export const SITE_DESCRIPTION =
  "Developer Relations at Archil. Previously forward-deployed engineering at The Sandbox and game design at 505 Games, plus side quests: shipped products and games.";

export const SITE_AUTHOR = "Luca Ficano Latimer";
export const SITE_TAGLINE = "Archil by day. Side quests by night.";

// Three role-specific resumes. Drop the PDFs in /public at these paths.
// Falls back to /cv.pdf if a role-specific one isn't present.
//   - Product: hero CTA + Header resume on product-world pages (/, /studio, /projects/*)
//   - Design:  Header resume on /arcade + any arcade hero CTA
//   - SWE:     inline link inside the bio paragraph on the landing page
export const RESUME_PRODUCT = "/cv-product.pdf";
export const RESUME_DESIGN = "/cv-design.pdf";
export const RESUME_SWE = "/cv-swe.pdf";
export const RESUME_FALLBACK = "/cv.pdf";
