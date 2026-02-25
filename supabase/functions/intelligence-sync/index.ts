import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const webhookSecret = req.headers.get("x-webhook-secret");
    const apiKey = req.headers.get("x-api-key");
    const secret = webhookSecret || apiKey;

    if (!secret) {
      return new Response(JSON.stringify({ error: "Missing authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("webhook_secret", secret)
      .maybeSingle();

    let userId = userData?.id;

    if (!userId) {
      const { data: agentData } = await supabase
        .from("ai_agents")
        .select("id, user_id")
        .eq("webhook_secret", secret)
        .maybeSingle();
      if (agentData) userId = agentData.user_id;
    }

    if (!userId) {
      const configuredKey = Deno.env.get("AI_TASKS_API_KEY");
      if (!configuredKey || secret !== configuredKey) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { action, workspace_id } = body;

    if (!userId && body.user_id) userId = body.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Could not resolve user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: unknown;

    switch (action) {
      case "sync_competitors": {
        const { competitors } = body;
        if (!competitors?.length) {
          return new Response(JSON.stringify({ error: "No competitors provided" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const rows = competitors.map((c: Record<string, unknown>) => ({
          workspace_id, user_id: userId, channel_id: c.channel_id,
          subscribr_id: c.subscribr_id, handle: c.handle, title: c.title,
          subscriber_count: c.subscriber_count ?? 0, video_count: c.video_count ?? 0,
          view_count: c.view_count ?? 0, thumbnail_url: c.thumbnail_url,
          country: c.country, last_synced_at: new Date().toISOString(),
        }));
        const { data, error } = await supabase
          .from("intelligence_competitors")
          .upsert(rows, { onConflict: "workspace_id,channel_id" })
          .select();
        if (error) throw error;
        result = { synced: data?.length ?? 0 };
        break;
      }

      case "sync_videos": {
        const { videos } = body;
        if (!videos?.length) {
          return new Response(JSON.stringify({ error: "No videos provided" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const rows = videos.map((v: Record<string, unknown>) => ({
          workspace_id, user_id: userId, video_id: v.video_id,
          channel_id: v.channel_id, channel_title: v.channel_title, title: v.title,
          published_at: v.published_at, view_count: v.view_count ?? 0,
          like_count: v.like_count ?? 0, comment_count: v.comment_count ?? 0,
          duration: v.duration, outlier_score: v.outlier_score,
          thumbnail_url: v.thumbnail_url, views_per_hour: v.views_per_hour,
          is_outlier: v.is_outlier ?? ((v.outlier_score as number) >= 3.0),
          last_synced_at: new Date().toISOString(),
        }));
        const { data, error } = await supabase
          .from("intelligence_videos")
          .upsert(rows, { onConflict: "workspace_id,video_id" })
          .select();
        if (error) throw error;
        result = { synced: data?.length ?? 0 };
        break;
      }

      case "push_digest": {
        const { digest_date, title, summary_html, competitor_highlights, top_performers, insights, metrics } = body;
        const { data, error } = await supabase
          .from("intelligence_digests")
          .upsert({ workspace_id, user_id: userId, digest_date, title, summary_html, competitor_highlights, top_performers, insights, metrics }, { onConflict: "workspace_id,digest_date" })
          .select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "push_insight": {
        const { insight_type, title, content, data: insightData, priority } = body;
        const { data, error } = await supabase
          .from("intelligence_insights")
          .insert({ workspace_id, user_id: userId, insight_type: insight_type ?? "observation", title, content, data: insightData, priority: priority ?? "medium" })
          .select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "sync_ideas": {
        const { ideas } = body;
        if (!ideas?.length) {
          return new Response(JSON.stringify({ error: "No ideas provided" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const rows = ideas.map((i: Record<string, unknown>) => ({
          workspace_id, user_id: userId,
          subscribr_idea_id: i.subscribr_idea_id, title: i.title,
          topic: i.topic, angle: i.angle, suggested_length: i.suggested_length,
          thumbnail_concept: i.thumbnail_concept,
          source_type: i.source_type ?? "ai_generated",
          source_reference: i.source_reference,
          status: i.status ?? "longlist",
          priority: i.priority ?? 0,
          sherlock_insights: i.sherlock_insights,
          outlier_score: i.outlier_score,
          category: i.category,
          idea_number: i.idea_number,
          is_banger: i.is_banger ?? false,
          community_gate: i.community_gate,
        }));
        const { data, error } = await supabase
          .from("intelligence_ideas").insert(rows).select();
        if (error) throw error;
        result = { synced: data?.length ?? 0 };
        break;
      }

      case "sync_scripts": {
        const { scripts } = body;
        if (!scripts?.length) {
          return new Response(JSON.stringify({ error: "No scripts provided" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const rows = scripts.map((s: Record<string, unknown>) => ({
          workspace_id, user_id: userId, idea_id: s.idea_id,
          subscribr_script_id: s.subscribr_script_id, title: s.title,
          topic: s.topic, angle: s.angle, word_count: s.word_count,
          status: s.status ?? "draft", production_status: s.production_status,
          canvas_url: s.canvas_url, has_outline: s.has_outline ?? false,
          has_script: s.has_script ?? false, content_preview: s.content_preview,
        }));
        const { data, error } = await supabase
          .from("intelligence_scripts").insert(rows).select();
        if (error) throw error;
        result = { synced: data?.length ?? 0 };
        break;
      }

      case "update_idea": {
        const { idea_id, ...updates } = body;
        delete updates.action; delete updates.workspace_id; delete updates.user_id;
        updates.updated_at = new Date().toISOString();
        const { data, error } = await supabase
          .from("intelligence_ideas").update(updates).eq("id", idea_id).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "update_script": {
        const { script_id, ...updates } = body;
        delete updates.action; delete updates.workspace_id; delete updates.user_id;
        updates.updated_at = new Date().toISOString();
        const { data, error } = await supabase
          .from("intelligence_scripts").update(updates).eq("id", script_id).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "idea_feedback": {
        const { idea_id, ai_response, feedback_entry } = body;
        if (!idea_id || !ai_response) {
          return new Response(JSON.stringify({ error: "Missing idea_id or ai_response" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Get current feedback_history
        const { data: current, error: fetchErr } = await supabase
          .from("intelligence_ideas").select("feedback_history").eq("id", idea_id).single();
        if (fetchErr) throw fetchErr;
        const history = Array.isArray(current.feedback_history) ? current.feedback_history : [];
        if (feedback_entry) history.push(feedback_entry);

        const { data, error } = await supabase
          .from("intelligence_ideas")
          .update({
            ai_response,
            feedback_history: history,
            updated_at: new Date().toISOString(),
          })
          .eq("id", idea_id).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "check_pending_feedback": {
        if (!workspace_id) {
          return new Response(JSON.stringify({ error: "Missing workspace_id" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase
          .from("intelligence_ideas")
          .select("*")
          .eq("workspace_id", workspace_id)
          .not("user_feedback", "is", null)
          .is("ai_response", null);
        if (error) throw error;
        result = data;
        break;
      }

      case "confirm_banger": {
        const { idea_id, is_banger: bangerVal } = body;
        if (!idea_id) {
          return new Response(JSON.stringify({ error: "Missing idea_id" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const updates: Record<string, unknown> = {
          is_banger: bangerVal ?? true,
          updated_at: new Date().toISOString(),
        };
        if (bangerVal !== false) {
          updates.banger_confirmed_at = new Date().toISOString();
        } else {
          updates.banger_confirmed_at = null;
        }
        const { data, error } = await supabase
          .from("intelligence_ideas").update(updates).eq("id", idea_id).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "evolve_idea": {
        const { idea_id, field, new_value, reason } = body;
        const allowedFields = ['title', 'thumbnail_concept', 'sherlock_insights', 'angle', 'community_gate', 'category'];
        if (!idea_id || !field || !new_value) {
          return new Response(JSON.stringify({ error: "Missing idea_id, field, or new_value" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!allowedFields.includes(field)) {
          return new Response(JSON.stringify({ error: `Invalid field: ${field}. Allowed: ${allowedFields.join(', ')}` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: currentIdea, error: fetchErr } = await supabase
          .from("intelligence_ideas").select("*").eq("id", idea_id).single();
        if (fetchErr) throw fetchErr;

        const evolutionHistory = Array.isArray(currentIdea.evolution_history) ? currentIdea.evolution_history : [];
        evolutionHistory.push({
          field,
          old_value: currentIdea[field] ?? '',
          new_value,
          changed_by: 'sherlock',
          reason: reason ?? '',
          timestamp: new Date().toISOString(),
        });

        const { data, error } = await supabase
          .from("intelligence_ideas")
          .update({
            [field]: new_value,
            evolution_history: evolutionHistory,
            updated_at: new Date().toISOString(),
          })
          .eq("id", idea_id).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("intelligence-sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
