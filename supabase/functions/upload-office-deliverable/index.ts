import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  json: "application/json",
  md: "text/markdown",
  txt: "text/plain",
  html: "text/html",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function inferMime(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return MIME_MAP[ext] || "application/octet-stream";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Dual auth: x-api-key OR x-webhook-secret
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("AI_TASKS_API_KEY");
    const webhookSecret = req.headers.get("x-webhook-secret");

    let authenticated = false;

    if (apiKey && apiKey === expectedKey) {
      authenticated = true;
    } else if (webhookSecret) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("webhook_secret", webhookSecret)
        .single();
      if (userData && !userError) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let office_id: string;
    let task_id: string;
    let agent_name: string;
    let file_name: string;
    let description: string | null = null;
    let fileData: Uint8Array;
    let fileMime: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      office_id = formData.get("office_id") as string;
      task_id = formData.get("task_id") as string;
      agent_name = formData.get("agent_name") as string;
      description = (formData.get("description") as string) || null;
      const file = formData.get("file") as File;
      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      file_name = file.name;
      fileData = new Uint8Array(await file.arrayBuffer());
      fileMime = file.type || inferMime(file_name);
    } else {
      const body = await req.json();
      office_id = body.office_id;
      task_id = body.task_id;
      agent_name = body.agent_name;
      file_name = body.file_name;
      description = body.description || null;

      if (body.file_base64) {
        const binary = atob(body.file_base64);
        fileData = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          fileData[i] = binary.charCodeAt(i);
        }
        fileMime = body.content_type || inferMime(file_name);
      } else if (body.file_url) {
        const resp = await fetch(body.file_url);
        if (!resp.ok) throw new Error(`Failed to fetch file from URL: ${resp.status}`);
        fileData = new Uint8Array(await resp.arrayBuffer());
        fileMime = resp.headers.get("content-type") || inferMime(file_name);
      } else if (body.content) {
        const encoder = new TextEncoder();
        fileData = encoder.encode(body.content);
        fileMime = body.content_type || inferMime(file_name);
      } else {
        return new Response(
          JSON.stringify({ error: "Provide file_base64, file_url, or content" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!office_id || !task_id || !agent_name || !file_name) {
      return new Response(
        JSON.stringify({
          error: "office_id, task_id, agent_name, and file_name are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Upload to storage
    const storagePath = `${office_id}/${task_id}/${agent_name}/${file_name}`;
    const { error: uploadError } = await supabase.storage
      .from("office-deliverables")
      .upload(storagePath, fileData, {
        contentType: fileMime,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("office-deliverables")
      .getPublicUrl(storagePath);

    const ext = file_name.split(".").pop()?.toLowerCase() || "";
    let fileType = "document";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) fileType = "image";
    else if (["mp4", "webm"].includes(ext)) fileType = "video";
    else if (["json"].includes(ext)) fileType = "json";
    else if (["md"].includes(ext)) fileType = "markdown";
    else if (["html"].includes(ext)) fileType = "html";

    const { data: deliverable, error: dbError } = await supabase
      .from("office_deliverables")
      .insert({
        office_id,
        task_id,
        agent_name,
        file_name,
        file_type: fileType,
        file_url: publicUrl,
        description,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    await supabase.from("office_activity_log").insert({
      office_id,
      agent_name,
      action: `Delivered: ${file_name}`,
      log_type: "completion",
      task_id,
    });

    return new Response(
      JSON.stringify({ success: true, deliverable }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
