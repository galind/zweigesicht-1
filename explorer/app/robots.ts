import { ORIGIN } from '@/src/content/seo';
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${ORIGIN}/sitemap.xml`,
  };
}
