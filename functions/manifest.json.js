export async function onRequestGet() {
  const manifest = {
    name: "SOVA GIVE 100",
    short_name: "SOVAHUB",
    description: "Nền tảng tuần hoàn công cụ sinh kế tử tế đạt chuẩn Enterprise ACID 10/10",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0b1120",
    theme_color: "#0b1120",
    icons: [
      {
        src: "/logo.svg",
        sizes: "192x192 512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ],
    categories: ["social", "lifestyle", "productivity"],
    lang: "vi"
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}
