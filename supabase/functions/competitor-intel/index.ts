import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Fallback if no competitors in OpsCenter yet — replace with your competitor handles
const FALLBACK_HANDLES = [
  "@competitor1", "@competitor2",
];

// Replace with your Competitors block ID from Creator Command OpsCenter app
const COMPETITORS_BLOCK_ID = "YOUR_COMPETITORS_BLOCK_ID";

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

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
  const subscribrApiKey = Deno.env.get("SUBSCRIBR_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Step 1: Load competitors from OpsCenter ──
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: opsCompetitors } = await supabase
      .from("ops_data")
      .select("data")
      .eq("block_id", COMPETITORS_BLOCK_ID);

    // Build competitor list: use OpsCenter data (with channel_id) or fallback handles
    interface CompetitorEntry {
      handle: string;
      channelId?: string;
      channelName?: string;
    }

    const competitors: CompetitorEntry[] = [];
    if (opsCompetitors && opsCompetitors.length > 0) {
      for (const row of opsCompetitors) {
        const d = row.data as any;
        if (d?.type === "competitor" && d?.handle) {
          competitors.push({
            handle: d.handle,
            channelId: d.channel_id || undefined,
            channelName: d.channel_name || d.handle,
          });
        }
      }
    }

    // If no OpsCenter competitors, use fallback
    if (competitors.length === 0) {
      for (const h of FALLBACK_HANDLES) {
        competitors.push({ handle: h });
      }
    }

    console.log(`Processing ${competitors.length} competitors from ${opsCompetitors?.length ? "OpsCenter" : "fallback list"}`);

    const channelResults: ChannelData[] = [];
    const viralAlerts: { handle: string; title: string; viewCount: number; outlierScore: number; videoId: string }[] = [];

    if (youtubeApiKey) {
      for (const comp of competitors) {
        try {
          let channelId = comp.channelId;

          // If we don't have a channel ID from OpsCenter, search by handle
          if (!channelId) {
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(comp.handle)}&key=${youtubeApiKey}&maxResults=1`;
            const searchRes = await fetch(searchUrl);
            if (!searchRes.ok) continue;
            const searchData = await searchRes.json();
            channelId = searchData.items?.[0]?.snippet?.channelId || searchData.items?.[0]?.id?.channelId;
            if (!channelId) continue;
          }

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
            handle: comp.handle,
            title: ch.snippet?.title || comp.channelName || comp.handle,
            subscriberCount: parseInt(ch.statistics?.subscriberCount || "0"),
            viewCount: parseInt(ch.statistics?.viewCount || "0"),
            videoCount: parseInt(ch.statistics?.videoCount || "0"),
            recentVideos,
            medianViews: med,
            outlierVideos,
          });

          // Add viral alerts (3x+ outlier)
          for (const ov of outlierVideos) {
            if (ov.outlierScore >= 3) {
              viralAlerts.push({ handle: comp.handle, ...ov });
            }
          }
        } catch (chErr) {
          console.error(`Error processing ${comp.handle}:`, chErr);
        }
      }
    }

    // ── Step 2: Trending videos via Subscribr ──
    const SUBSCRIBR_BASE = "https://subscribr.ai/api/v1";
    let trendingHtml = '<p style="color:#888;">Subscribr API not configured</p>';
    if (subscribrApiKey) {
      try {
        // Search for trending videos in our niche
        const trendRes = await fetch(`${SUBSCRIBR_BASE}/intel/videos/search`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${subscribrApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: "AI agents automation", limit: 5 }),
        });
        if (trendRes.ok) {
          const trendData = await trendRes.json();
          const videos = trendData.data?.videos || trendData.videos || trendData.data || [];
          if (Array.isArray(videos) && videos.length > 0) {
            trendingHtml = videos.slice(0, 5).map((v: any) =>
              `<div style="padding:8px 12px;margin:4px 0;background:#16213e;border-radius:4px;color:#ccc;">
                <div style="color:#eee;font-size:13px;">&#128293; ${v.title || v.name || "Untitled"}</div>
                <div style="color:#888;font-size:11px;margin-top:2px;">${v.channel_title || v.channel || ""} ${v.view_count ? "&middot; " + Number(v.view_count).toLocaleString() + " views" : ""}</div>
              </div>`
            ).join("");
          } else {
            trendingHtml = '<p style="color:#888;">No trending videos found</p>';
          }
        } else {
          const errText = await trendRes.text();
          console.error("Subscribr API error:", trendRes.status, errText);
          trendingHtml = `<p style="color:#888;">Subscribr: ${trendRes.status} error</p>`;
        }
      } catch (e) {
        console.error("Subscribr error:", e);
        trendingHtml = '<p style="color:#888;">Subscribr connection failed</p>';
      }
    }

    // ── Step 3: Build HTML ──
    const viralHtml = viralAlerts.length > 0
      ? viralAlerts.sort((a, b) => b.outlierScore - a.outlierScore).slice(0, 8).map(v =>
        `<div style="padding:12px 16px;margin:8px 0;background:#2d1b1b;border-left:3px solid #e94560;border-radius:6px;">
          <div style="color:#e94560;font-weight:bold;font-size:14px;">&#128680; ${v.handle} &mdash; ${v.outlierScore}x outlier</div>
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
          ${channelResults.map(ch =>
            `<tr style="border-top:1px solid #222;">
              <td style="padding:8px;color:#ccc;">${ch.title}</td>
              <td style="padding:8px;color:#888;">${formatNum(ch.subscriberCount)}</td>
              <td style="padding:8px;color:#888;">${ch.medianViews > 0 ? formatNum(ch.medianViews) : "&mdash;"}</td>
              <td style="padding:8px;color:#888;">${ch.recentVideos.length}</td>
            </tr>`
          ).join("")}
        </table>`
      : '<p style="color:#888;">No YouTube data available (check API key)</p>';

    // Top performing videos section
    const allVideos = channelResults.flatMap(ch =>
      ch.recentVideos.map(v => ({ ...v, channelTitle: ch.title, handle: ch.handle }))
    ).sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

    const topVideosHtml = allVideos.length > 0
      ? allVideos.map((v, i) =>
        `<div style="padding:10px 14px;margin:6px 0;background:#1a1a2e;border-radius:6px;display:flex;gap:12px;align-items:center;">
          <div style="color:#4ecca3;font-size:18px;font-weight:bold;min-width:24px;">#${i + 1}</div>
          <div>
            <div style="color:#eee;font-size:13px;">${v.title}</div>
            <div style="color:#888;font-size:11px;margin-top:2px;">${v.channelTitle} &middot; ${v.viewCount.toLocaleString()} views</div>
          </div>
        </div>`
      ).join("")
      : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f23;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:20px 0;">
    <h1 style="color:#e94560;margin:0;font-size:28px;">&#128269; Competitor Intel</h1>
    <p style="color:#888;margin:8px 0 0;">${dateStr}</p>
    <p style="color:#666;font-size:12px;">${channelResults.length} competitors analyzed</p>
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#e94560;font-size:16px;text-transform:uppercase;letter-spacing:2px;">&#128680; Viral Alerts</h2>
    ${viralHtml}
  </div>

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">&#128200; Channel Overview</h2>
    ${channelTableHtml}
  </div>

  ${topVideosHtml ? `<div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">&#127942; Top Performing Videos</h2>
    ${topVideosHtml}
  </div>` : ""}

  <div style="margin:24px 0;">
    <h2 style="color:#4ecca3;font-size:16px;text-transform:uppercase;letter-spacing:2px;">&#128293; Trending in AI/Automation</h2>
    ${trendingHtml}
  </div>

  <div style="text-align:center;padding:20px 0;color:#555;font-size:12px;">
    Sent by Sherlock &#128269; via ClawBuddy Automations
  </div>
</div></body></html>`;

    const subject = `Competitor Intel — ${dateStr}`;
    const text = `Competitor Intel — ${dateStr}\n${channelResults.length} competitors analyzed\n${viralAlerts.length} viral alerts`;

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
