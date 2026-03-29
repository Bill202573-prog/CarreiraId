import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Decode HTML entities like &#xe7; &quot; &#x2013; etc.
function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timeout);

    const html = await response.text();

    // Extract OG meta tags
    const getMetaContent = (property: string): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return decodeHtmlEntities(match[1]);
      }
      return null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const rawImage = getMetaContent("og:image") || getMetaContent("twitter:image") || null;
    // Instagram CDN images often block direct embedding; keep only reliable ones
    const image = rawImage && !rawImage.includes("scontent") ? rawImage : null;

    // Detect Instagram URLs and build a useful preview even when OG tags are sparse
    const isInstagram = /instagram\.com/i.test(url);
    const ogTitle = getMetaContent("og:title") || getMetaContent("twitter:title") || (titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1].trim()) : null);
    const ogDescription = getMetaContent("og:description") || getMetaContent("twitter:description") || getMetaContent("description") || null;

    const preview = {
      url,
      title: ogTitle || (isInstagram ? "Publicação no Instagram" : null),
      description: ogDescription || (isInstagram ? "Veja esta publicação no Instagram" : null),
      image,
      site_name: getMetaContent("og:site_name") || (isInstagram ? "Instagram" : new URL(url).hostname.replace("www.", "").toUpperCase()),
      type: isInstagram ? "instagram" : null,
    };

    return new Response(JSON.stringify(preview), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
