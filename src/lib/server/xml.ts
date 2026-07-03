export function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function stripHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toBacklinkUrl(siteOrigin: string, blogId: string, logNo: string): string {
  return `${siteOrigin.replace(/\/$/, '')}/nb/${encodeURIComponent(blogId)}/${encodeURIComponent(logNo)}`;
}

export function toNaverPostUrl(blogId: string, logNo: string): string {
  return `https://blog.naver.com/${encodeURIComponent(blogId)}/${encodeURIComponent(logNo)}`;
}
