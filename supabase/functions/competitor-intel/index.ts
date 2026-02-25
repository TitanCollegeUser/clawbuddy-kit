import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPETITOR_HANDLES = [
  "@mkbhd", "@LinusTechTips", "@MrBeast", "@veritasium", "@ColdFusion",
  "@PolyMatter", "@WendoverProductions", "@RealEngineering", "@TomScott", "@3Blue1Brown",
  "@SmarterEveryDay", "@Kurzgesagt", "@JohnnyHarris", "@ThoughtEmporium", "@BranchEducation",
  "@NotJustBikes", "@ClimateTown", "@NeoExplains", "@slidebean", "@MagnatesMedia",
  "@AliAbdaal",
];

interface ChannelData {
  handle: string;
  title: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  recentVideos: { title: string; viewCount: number; publishedAt: string; videoId: string }[];
  medianViews: number;
  outlierVideos: { title: string; viewCount: number; outlierScore: number; videoId: string }[];
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
  const subscribrApiKey = Deno.env.get("SUBSCRIBR_API_KEY");

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const channelResults: ChannelData[] = [];
    const viralAlerts: { handle: string; title: string; viewCount: number; outlierScore: number; videoId: string }[] = [];

    if (youtubeApiKey) {
      // Process each competitor
      for (const handle of COMPETITOR_HANDLES) {
        try {
          // Search for channel by handle
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${youtubeApiKey}&maxResults=1`;
          const searchRes = await fetch(searchUrl);
          if (!searchRes.ok) continue;
          const searchData = await searchRes.json();
          const channelId = searchData.items?.[0]?.snippet?.channelId || searchData.items?.[0]?.id?.channelId;
          if (!channelId) continue;

          // Get channel stats
          const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${youtubeApiKey}`;
          const channelRes = await fetch(channelUrl);
          if (!channelRes.ok) continue;
          const channelData = await channelRes.json();
          const ch = channelData.items?.[0];
          if (!ch) continue;

          // Get recent uploads
          const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&publishedAfter=${thirtyDaysAgo}&key=${youtubeApiKey}&maxResults=10`;
          const videosRes = await fetch(videosUrl);
          const videosData = await videosRes.json();
          const videoIds = (videosData.items || []).map((v: any) => v.id?.videoId).filter(Boolean);

          let recentVideos: { title: string; viewCount: number; publishedAt: string; videoId: string }[] = [];
          if (videoIds.length > 0) {
            const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}&key=${youtubeApiKey}`;
            const statsRes = await fetch(statsUrl);
            const statsData = await statsRes.json();
            recentVideos = (statsData.items || []).map((v: any) => ({
              title: v.snippet?.title || "",
              viewCount: parseInt(v.statistics?.viewCount || "0"),
              publishedAt: v.snippet?.publishedAt || "",
              videoId: v.id,
            }));
          }

          const views = recentVideos.map(v => v.viewCount);
          const med = median(views);
          const outlierVideos = recentVideos
            .filter(v => med > 0 && v.viewCount / med > 3)
            .map(v => ({ title: v.title, viewCount: v.viewCount, outlierScore: Math.round((v.viewCount / med) * 10) / 10, videoId: v.videoId }));

          channelResults.push({
            handle,
            title: ch.snippet?.title || handle,
            subscriberCount: parseInt(ch.statistics?.subscriberCount || "0"),
            viewCount: parseInt(ch.statistics?.viewCount || "0"),
            videoCount: parseInt(ch.statistics?.videoCount || "0"),
            recentVideos,
            medianViews: med,
            outlierVideos,
          });

          // Add viral alerts
          for (const ov of outlierVideos) {
            if (ov.outlierScore >= 5) {
              viralAlerts.push({ handle, ...ov });
            }
          }
        } catch (chErr) {
          console.error(`Error processing ${handle}:`, chErr);
        }
      }
    }

    // Trending topics via Subscribr
    let trendingHtml = '<p style="color:#888;">Subscribr API not configured</p>';
    if (subscribrApiKey) {
      try {
        const trendRes = await fetch("https://api.subscribr.ai/api/v1/trends", {
          headers: { "Authorization": `Bearer ${subscribrApiKey}` },
        });
        if (trendRes.ok) {
          const trends = await trendRes.json();
          const topTrends = (trends.data || trends.results || []).slice(0, 5);
          if (topTrends.length > 0) {
            trendingHtml = topTrends.map((t: any) =>
              `<div style="padding:8px 12px;margin:4px 0;background:#16213e;border-radius:4px;color:#ccc;">
                🔥 ${t.topic || t.title || t.name || JSON.stringify(t).substring(0, 80)}
              </div>`
            ).join("");
          }
        }
      } catch (e) {
        console.error("Subscribr error:", e);
      }
    }

    // Build HTML
    const viralHtml = viralAlerts.length > 0
      ? viralAlerts.slice(0, 5).map(v =>
        `<div style="padding:12px 16px;margin:8px 0;background:#2d1b1b;border-left:3px solid #e94560;border-radius:6px;">
          <div style="color:#e94560;font-weight:bold;font-size:14px;">🚨 ${v.handle} — ${v.outlierScore}x outlier</div>
          <div style="color:#eee;margin-top:4px;">${v.title}</div>
          <div style="color:#888;font-size:12px;margin-top:4px;">${v.viewCount.toLocaleString()} views</div>
        </div>`
      ).join("")
      : '<p style="color:#888;">No viral alerts today</p>';

    const channelTableHtml = channelResults.length > 0
      ? `<table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="color:#4ecca3;text-align:left;">
            <th style="padding:8px;">Channel</th>
            <th style="padding:8px;">Subs</th>
            <th style="padding:8px;">Median</th>
            <th style="padding:8px;">Videos (30d)</th>
          </tr>
          ${channelResults.slice(0, 15).map(ch =>
            `<tr style="border-top:1px solid #222;">
              <td style="padding:8px;color:#ccc;">${ch.title}</td>
              <td style="padding:8px;color:#888;">${(ch.subscriberCount / 1000000).toFixed(1)}M</td>
              <td style="padding:8px;color:#888;">${ch.medianViews > 0 ? (ch.medianViews / 1000).toFixed(0) + "K" : "—"}</td>
              <td style="padding:8px;color:#888;">${ch.recentVideos.length}</td>
            </tr>`
          ).join("")}
        </table>`
      : '<p style="color:#888;">No YouTube data available (check API key)</p>';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f23;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:20px 0;">
    <h1 style="color:#e94560;margin:0;font-size:28px;">🔍 Competitor Intel</h1>
    <p style="color:#888;margin:8px 0 0;">${dateStr}</p>
    <p style="color:#666;font-size:12px;">${channelResults.length} channels analyzed</p>
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#e94560;font-size:16px;text-transform:uppercase;letter-spacing:2px;">🚨 Viral Alerts</h2>
    ${viralHtml}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">📊 Channel Overview</h2>
    ${channelTableHtml}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">🔥 Trending Topics</h2>
    ${trendingHtml}
  </div>

  <div style="text-align:center;padding:20px 0;color:#555;font-size:12px;">
    Sent by Sherlock 🔍 via ClawBuddy Automations
  </div>
</div></body></html>`;

    const subject = `🔍 Competitor Intel — ${dateStr}`;
    const text = `Competitor Intel — ${dateStr}\n${channelResults.length} channels analyzed\n${viralAlerts.length} viral alerts`;

    return new Response(JSON.stringify({ html, subject, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Competitor intel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
