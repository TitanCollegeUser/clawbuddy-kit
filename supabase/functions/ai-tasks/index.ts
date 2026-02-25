import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret",
};

// Column name mapping (case-insensitive)
const columnMapping: Record<string, string> = {
  "to do": "To Do",
  "todo": "To Do",
  "doing": "Doing",
  "in progress": "Doing",
  "needs input": "Needs Input",
  "blocked": "Needs Input",
  "canceled": "Canceled",
  "cancelled": "Canceled",
  "done": "Done",
  "complete": "Done",
};

// ============ SKILL VALIDATION HELPERS ============

type BujjiStatus = "pending" | "processing" | "accepted" | "needs_info" | "rejected";

interface ValidationResult {
  valid: string[];
  issues: string[];
}

interface OperationsAnalysisResult {
  valid: string[];
  issues: string[];
  suggestions: string[];
}

interface NotesExtractionResult {
  extracted: Record<string, string>;
  helpful: boolean;
}

// Validate REST configuration
function validateRestConfig(config: Record<string, unknown>, skill: Record<string, unknown>): ValidationResult {
  const valid: string[] = [];
  const issues: string[] = [];

  // URL validation from connection_config or api_base_url
  const baseUrl = (config.base_url as string) || (skill.api_base_url as string);
  if (baseUrl) {
    try {
      new URL(baseUrl);
      valid.push("✅ Base URL is valid");
    } catch {
      issues.push("❌ Base URL is not a valid URL format");
    }
  } else {
    issues.push("❌ Base URL is required for REST APIs");
  }

  // Auth validation
  const auth = config.auth as Record<string, unknown> | undefined;
  if (auth?.type && auth?.header && auth?.format) {
    valid.push("✅ Authentication configuration is complete");
    if (!skill.api_key_encrypted) {
      issues.push("⚠️ No API key provided - will this API work without authentication?");
    }
  } else if (skill.auth_type && skill.auth_header && skill.auth_format) {
    valid.push("✅ Authentication configuration is complete");
    if (!skill.api_key_encrypted) {
      issues.push("⚠️ No API key provided - will this API work without authentication?");
    }
  } else {
    issues.push("❓ Authentication config incomplete - is this a public API?");
  }

  // Rate limit info
  if (config.rate_limit) {
    valid.push(`✅ Rate limit noted: ${config.rate_limit}`);
  }

  return { valid, issues };
}

// Validate SMTP configuration
function validateSmtpConfig(config: Record<string, unknown>, _skill: Record<string, unknown>): ValidationResult {
  const valid: string[] = [];
  const issues: string[] = [];

  const host = config.host as string | undefined;
  const port = config.port as number | undefined;
  const tls = config.tls as boolean | undefined;
  const starttls = config.starttls as boolean | undefined;
  const username = config.username as string | undefined;

  if (host) {
    valid.push("✅ SMTP host configured");
  } else {
    issues.push("❌ SMTP host is required");
  }

  if (port) {
    valid.push(`✅ SMTP port configured: ${port}`);
    
    // Validate port/TLS combination
    if (port === 465 && !tls) {
      issues.push("⚠️ Port 465 typically requires TLS to be enabled");
    }
    if (port === 587 && tls && !starttls) {
      issues.push("⚠️ Port 587 typically uses STARTTLS rather than direct TLS");
    }
    if (port === 25) {
      issues.push("⚠️ Port 25 is often blocked by ISPs - consider using 587 or 465");
    }
  } else {
    issues.push("❌ SMTP port is required");
  }

  if (username) {
    valid.push("✅ SMTP username configured");
  } else {
    issues.push("⚠️ No SMTP username - anonymous auth may not work");
  }

  return { valid, issues };
}

// Validate GraphQL configuration
function validateGraphqlConfig(config: Record<string, unknown>, skill: Record<string, unknown>): ValidationResult {
  const valid: string[] = [];
  const issues: string[] = [];

  const endpoint = config.endpoint as string | undefined;
  if (endpoint) {
    try {
      new URL(endpoint);
      valid.push("✅ GraphQL endpoint URL is valid");
    } catch {
      issues.push("❌ GraphQL endpoint is not a valid URL");
    }
  } else {
    issues.push("❌ GraphQL endpoint is required");
  }

  // Auth validation
  const auth = config.auth as Record<string, unknown> | undefined;
  if (auth?.type && auth?.header && auth?.format) {
    valid.push("✅ Authentication configuration is complete");
    if (!skill.api_key_encrypted) {
      issues.push("⚠️ No API key provided - will this API work without authentication?");
    }
  } else {
    issues.push("❓ Authentication config incomplete - is this a public API?");
  }

  return { valid, issues };
}

// Validate Webhook configuration
function validateWebhookConfig(config: Record<string, unknown>, _skill: Record<string, unknown>): ValidationResult {
  const valid: string[] = [];
  const issues: string[] = [];

  const eventTypes = config.event_types as string[] | undefined;
  if (eventTypes && eventTypes.length > 0) {
    valid.push(`✅ ${eventTypes.length} event type(s) configured`);
  } else {
    issues.push("❌ At least one event type is required for webhooks");
  }

  const sigAlgorithm = config.signature_algorithm as string | undefined;
  if (sigAlgorithm) {
    valid.push(`✅ Signature algorithm configured: ${sigAlgorithm}`);
  } else {
    issues.push("⚠️ No signature algorithm - webhook payloads won't be verified");
  }

  return { valid, issues };
}

// Sanitize operation name to match DB constraint: ^[a-z][a-z0-9_]{1,49}$
function sanitizeOperationName(name: string, index: number): string {
  let sanitized = name.toLowerCase().replace(/-/g, '_').replace(/[^a-z0-9_]/g, '');
  if (!sanitized || !/^[a-z]/.test(sanitized)) {
    sanitized = `op_${index}`;
  }
  return sanitized.substring(0, 50);
}

// Validate Custom configuration
function validateCustomConfig(config: Record<string, unknown>, _skill: Record<string, unknown>): ValidationResult {
  const valid: string[] = [];
  const issues: string[] = [];

  let description = config.description as string | undefined;
  
  // Fall back to additional_notes if description is missing and notes are substantial
  const additionalNotes = _skill.additional_notes as string | undefined;
  if ((!description || description.trim().length < 10) && additionalNotes && additionalNotes.trim().length >= 50) {
    description = additionalNotes;
    valid.push("✅ Using additional_notes as custom protocol description");
  }

  if (description && description.trim().length > 10) {
    valid.push("✅ Custom configuration description provided");
  } else if (description) {
    issues.push("⚠️ Custom configuration description is very short - consider adding more details");
  } else {
    issues.push("❌ Custom protocol requires a description of how it works");
  }

  const configJson = config.config_json as string | undefined;
  if (configJson) {
    try {
      JSON.parse(configJson);
      valid.push("✅ Custom config JSON is valid");
    } catch {
      issues.push("⚠️ Custom config JSON appears to be invalid");
    }
  }

  // Validate skill_markdown (methodology document)
  const skillMarkdown = _skill.skill_markdown as string | undefined;
  if (skillMarkdown && skillMarkdown.trim().length >= 100) {
    valid.push("✅ Skill methodology document provided (skill_markdown)");
  } else if (skillMarkdown && skillMarkdown.trim().length > 0) {
    issues.push("⚠️ Skill methodology document is short (< 100 chars) - consider expanding it");
  }

  // Validate input_schema
  const inputSchema = _skill.input_schema as Record<string, unknown> | undefined;
  const inputFieldCount = inputSchema ? Object.keys(inputSchema).length : 0;
  if (inputFieldCount > 0) {
    valid.push(`✅ Input schema defined with ${inputFieldCount} field(s)`);
  }

  // Validate output_format
  const outputFormat = _skill.output_format as string | undefined;
  if (outputFormat && outputFormat !== "text") {
    valid.push(`✅ Output format specified: ${outputFormat}`);
  }

  // Validate allowed_tools
  const allowedTools = _skill.allowed_tools as string[] | undefined;
  if (allowedTools && allowedTools.length > 0) {
    valid.push(`✅ ${allowedTools.length} allowed tool(s) configured`);
  }

  return { valid, issues };
}

// Analyze operations for completeness
function analyzeOperations(operations: Record<string, unknown>[], skill?: Record<string, unknown>): OperationsAnalysisResult {
  const valid: string[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!operations || operations.length === 0) {
    // For custom protocol skills with skill_markdown, operations are optional
    if (skill) {
      const protocolType = skill.protocol_type as string | undefined;
      const skillMarkdown = skill.skill_markdown as string | undefined;
      const inputSchema = skill.input_schema as Record<string, unknown> | undefined;
      const outputFormat = skill.output_format as string | undefined;

      if (protocolType === "custom" && skillMarkdown && skillMarkdown.trim().length >= 100) {
        valid.push("✅ Skill methodology document provided (skill_markdown)");

        const inputFieldCount = inputSchema ? Object.keys(inputSchema).length : 0;
        if (inputFieldCount > 0) {
          valid.push(`✅ Input schema defined with ${inputFieldCount} field(s)`);
        }

        if (outputFormat && outputFormat !== "text") {
          valid.push(`✅ Output format specified: ${outputFormat}`);
        }

        suggestions.push("💡 Consider adding skill_operations if this skill calls external APIs");
        return { valid, issues, suggestions };
      }
    }

    issues.push("❌ No operations defined - I need at least one operation to use this skill");
    return { valid, issues, suggestions };
  }

  valid.push(`✅ ${operations.length} operation(s) defined`);

  for (const op of operations) {
    const opName = (op.name as string) || (op.title as string) || "unnamed";
    const httpMethod = op.http_method as string;
    const endpointPath = op.endpoint_path as string | undefined;
    const description = op.description as string | undefined;
    const requestSchema = op.request_body_schema as Record<string, unknown> | undefined;
    const responseSchema = op.response_schema as Record<string, unknown> | undefined;

    // Check for missing endpoint
    if (!endpointPath) {
      issues.push(`❌ Operation "${opName}" is missing an endpoint path`);
    } else {
      valid.push(`✅ Operation "${opName}" has endpoint: ${endpointPath}`);
    }

    // Check for missing description
    if (!description || description.trim().length < 5) {
      suggestions.push(`💡 Adding a description to "${opName}" would help me understand when to use it`);
    }

    // Check request/response schemas
    const hasRequestSchema = requestSchema && Object.keys(requestSchema).length > 0;
    const hasResponseSchema = responseSchema && Object.keys(responseSchema).length > 0;

    if (!hasRequestSchema && ["POST", "PUT", "PATCH"].includes(httpMethod)) {
      suggestions.push(`💡 Operation "${opName}" (${httpMethod}) could benefit from a request body schema`);
    }

    if (!hasResponseSchema) {
      suggestions.push(`💡 Adding a response schema to "${opName}" helps me understand what data I'll receive`);
    }
  }

  return { valid, issues, suggestions };
}

// Process additional notes for context extraction
function processAdditionalNotes(notes: string | null): NotesExtractionResult {
  if (!notes || notes.trim() === "") {
    return { extracted: {}, helpful: false };
  }

  const extracted: Record<string, string> = {};
  const lowerNotes = notes.toLowerCase();

  // Extract rate limit info
  const rateLimitMatch = notes.match(/rate\s*limit[:\s]+(\d+\s*(?:req(?:uest)?s?)?\/?\s*(?:min|hour|day|second))/i);
  if (rateLimitMatch) {
    extracted.rate_limit = rateLimitMatch[1];
  }

  // Check for sandbox/test environment mentions
  if (lowerNotes.includes("sandbox") || lowerNotes.includes("test environment") || lowerNotes.includes("testing")) {
    extracted.environment = "sandbox/testing";
  }

  // Check for production mentions
  if (lowerNotes.includes("production") || lowerNotes.includes("live")) {
    extracted.environment = "production";
  }

  // Check for region info
  const regionMatch = notes.match(/region[:\s]+([\w-]+)/i);
  if (regionMatch) {
    extracted.region = regionMatch[1];
  }

  // Check for timeout mentions
  const timeoutMatch = notes.match(/timeout[:\s]+(\d+\s*(?:s|sec|seconds?|ms|milliseconds?))/i);
  if (timeoutMatch) {
    extracted.timeout = timeoutMatch[1];
  }

  // Check for retry mentions
  if (lowerNotes.includes("retry") || lowerNotes.includes("retries")) {
    extracted.retry_info = "retry behavior mentioned";
  }

  return {
    extracted,
    helpful: notes.length > 20,
  };
}

// Generate contextual Bujji feedback
function generateBujjiFeedback(
  skill: Record<string, unknown>,
  validations: string[],
  issues: string[],
  suggestions: string[],
  notesContext: Record<string, string>
): { status: BujjiStatus; feedback: string } {
  const hasBlockingIssues = issues.some((i) => i.startsWith("❌"));
  const hasWarnings = issues.some((i) => i.startsWith("⚠️") || i.startsWith("❓"));

  let status: BujjiStatus = "accepted";
  let feedback = "";
  const skillTitle = skill.title as string;

  if (hasBlockingIssues) {
    status = "needs_info";
    feedback = `I've reviewed "${skillTitle}" but found some issues that need to be addressed:\n\n`;
    feedback += issues.filter((i) => i.startsWith("❌")).join("\n") + "\n\n";

    // Add warnings if any
    const warnings = issues.filter((i) => i.startsWith("⚠️") || i.startsWith("❓"));
    if (warnings.length > 0) {
      feedback += "Also note:\n" + warnings.join("\n") + "\n\n";
    }

    if (validations.length > 0) {
      feedback += "What's looking good:\n" + validations.join("\n") + "\n\n";
    }

    feedback += "Please update these items and resubmit.";
  } else if (hasWarnings) {
    status = "accepted"; // Accept but note the warnings
    feedback = `"${skillTitle}" has been accepted! 🎉\n\n`;
    feedback += validations.join("\n") + "\n\n";

    if (issues.length > 0) {
      feedback += "A few notes:\n" + issues.join("\n") + "\n\n";
    }

    if (Object.keys(notesContext).length > 0) {
      feedback += "I noted from your description:\n";
      for (const [key, value] of Object.entries(notesContext)) {
        feedback += `• ${key}: ${value}\n`;
      }
      feedback += "\n";
    }

    if (suggestions.length > 0) {
      feedback += "Optional improvements:\n" + suggestions.slice(0, 3).join("\n") + "\n\n";
    }

    feedback += "I'm ready to use this skill when relevant tasks come up!";
  } else {
    status = "accepted";
    feedback = `Excellent! "${skillTitle}" is now ready to use! 🎉\n\n`;
    feedback += validations.join("\n") + "\n\n";

    if (Object.keys(notesContext).length > 0) {
      feedback += "I noted from your description:\n";
      for (const [key, value] of Object.entries(notesContext)) {
        feedback += `• ${key}: ${value}\n`;
      }
      feedback += "\n";
    }

    if (suggestions.length > 0) {
      feedback += "Optional improvements for next time:\n" + suggestions.slice(0, 3).join("\n") + "\n\n";
    }

    feedback += "I'll use this skill when handling relevant tasks.";
  }

  return { status, feedback };
}

// Validate basic skill info
function validateBasicInfo(skill: Record<string, unknown>): ValidationResult {
  const valid: string[] = [];
  const issues: string[] = [];

  const name = skill.name as string | undefined;
  const title = skill.title as string | undefined;
  const description = skill.description as string | undefined;
  const useCases = skill.use_cases as string[] | undefined;

  // Validate name format
  if (name) {
    if (/^[a-z][a-z0-9-]{2,49}$/.test(name)) {
      valid.push("✅ Skill name follows naming convention");
    } else {
      issues.push("⚠️ Skill name should be lowercase with hyphens (e.g., my-api-skill)");
    }
  } else {
    issues.push("❌ Skill name is required");
  }

  // Validate title
  if (title && title.length >= 3) {
    valid.push("✅ Skill title is descriptive");
  } else {
    issues.push("❌ Skill title is required and should be descriptive");
  }

  // Validate description
  if (description && description.length >= 10) {
    valid.push("✅ Skill description explains its purpose");
  } else {
    issues.push("⚠️ Consider adding a more detailed description");
  }

  // Validate use cases
  if (useCases && useCases.length > 0) {
    const meaningfulCases = useCases.filter((uc) => uc && uc.length > 5);
    if (meaningfulCases.length > 0) {
      valid.push(`✅ ${meaningfulCases.length} use case(s) defined`);
    } else {
      issues.push("⚠️ Use cases should be more descriptive");
    }
  } else {
    issues.push("⚠️ Adding use cases helps me know when to use this skill");
  }

  return { valid, issues };
}

// Priority validation
const validPriorities = ["Low", "Medium", "High", "Urgent"];

// Helper to log activity
async function logActivity(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  taskId: string | null,
  actionType: string,
  actionDetails?: Record<string, unknown>,
  comment?: string
) {
  try {
    const { error } = await supabase.from("activity_log").insert([{
      task_id: taskId,
      action_type: actionType,
      actor_name: "Ray",
      action_details: actionDetails ? JSON.parse(JSON.stringify(actionDetails)) : null,
      comment: comment || null,
    }]);
    if (error) {
      console.error("Error logging activity:", error);
    }
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

// Helper to update AI assistant's last seen timestamp
async function updateBujjiLastSeen(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string | null,
  agentId: string | null = null
) {
  if (!userId) return;
  try {
    if (agentId) {
      // Per-agent status tracking
      const { data: existing } = await supabase
        .from("ai_status")
        .select("id")
        .eq("user_id", userId)
        .eq("agent_id", agentId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("ai_status")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("ai_status")
          .insert({ user_id: userId, agent_id: agentId, last_seen: new Date().toISOString(), is_online: true });
      }
    } else {
      // Legacy: update any status row for this user without agent_id
      await supabase
        .from("ai_status")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_id", userId);
    }
  } catch (e) {
    console.error("Failed to update last seen:", e);
  }
}

// Helper to lookup user IDs from names
async function lookupUsersByNames(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  names: string[]
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name")
    .in("name", names.map(n => n.trim()));
  
  if (error) {
    console.error("Error looking up users:", error);
    return [];
  }
  return data || [];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body for POST/PATCH/DELETE
    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      body = await req.json();
    }

    const requestType = (body.request_type as string) || (body.type as string) || undefined;
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("AI_TASKS_API_KEY");
    const authHeader = req.headers.get("Authorization");
    const webhookSecret = req.headers.get("x-webhook-secret");

    // Allow authenticated users for certain request types without API key
    const isSkillSubmission = requestType === "skill" && 
      ["submit", "review", "create", "update", "delete"].includes(body.action as string);
    const isRawReportAction = requestType === "raw_report";
    const allowsUserAuth = isSkillSubmission || isRawReportAction;
    // Allow webhook secret auth for ALL request types (Ray's primary auth method)
    const allowsWebhookAuth = true;
    
    let userId: string | null = null;
    let agentId: string | null = null;
    let supabase;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (webhookSecret) {
      // Webhook secret auth — try ai_agents first, then legacy users fallback
      supabase = createClient(supabaseUrl, serviceRoleKey);

      // 1. Check ai_agents table
      const { data: agentData } = await supabase
        .from("ai_agents")
        .select("id, user_id")
        .eq("webhook_secret", webhookSecret)
        .maybeSingle();

      if (agentData) {
        userId = agentData.user_id;
        agentId = agentData.id;
        console.log(`Authenticated via ai_agents, user: ${userId}, agent: ${agentId}, type: ${requestType}`);
      } else {
        // 2. Fallback: check users table (legacy)
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("webhook_secret", webhookSecret)
          .single();

        if (userError || !userData) {
          console.log("Invalid webhook secret");
          return new Response(
            JSON.stringify({ error: "Unauthorized: Invalid webhook secret" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = userData.id;
        console.log(`Authenticated via legacy users.webhook_secret, user: ${userId}, type: ${requestType}`);
      }
    } else if (allowsUserAuth && authHeader?.startsWith("Bearer ")) {
      // For user-initiated actions, accept user auth token
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userSupabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        console.log("Invalid user auth token");
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid auth token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = claimsData.claims.sub as string;
      console.log(`Authenticated request from user: ${userId}, type: ${requestType}`);
      
      // Use service role for database operations
      supabase = createClient(supabaseUrl, serviceRoleKey);
    } else if (apiKey && apiKey === expectedKey) {
      // API key auth for external/AI calls
      supabase = createClient(supabaseUrl, serviceRoleKey);
    } else {
      console.log("Unauthorized: Invalid or missing API key");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update AI assistant's last seen on every request
    await updateBujjiLastSeen(supabase, userId, agentId);

    // Extract agent identity for log attribution
    const logAgentName = (body.agent_name as string) || "Ray";
    const logAgentEmoji = (body.agent_emoji as string) || (logAgentName === "Ray" ? "⚡" : "🤖");

    // ============ TASK QUEUE MANAGEMENT ============
    // For Ray/OpenClaw to consume tasks via Realtime + Polling
    if (requestType === "queue") {
      const action = body.action as string;
      console.log(`Handling queue action: ${action}`);

      // userId is already set from webhook_secret auth at top level
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // LIST - Get pending tasks for the user
      if (action === "list") {
        const status = (body.status as string) || "pending";
        const limit = (body.limit as number) || 50;

        const { data, error } = await supabase
          .from("pending_tasks")
          .select("*")
          .eq("user_id", userId)
          .eq("status", status)
          .order("created_at", { ascending: true })
          .limit(limit);

        if (error) {
          console.error("Error listing queue:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list queue" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ tasks: data, count: data?.length || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // CLAIM - Lock a task for processing
      if (action === "claim") {
        const { task_id } = body;

        if (!task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Atomically claim the task (only if still pending)
        const { data, error } = await supabase
          .from("pending_tasks")
          .update({
            status: "processing",
            started_at: new Date().toISOString(),
          })
          .eq("id", task_id)
          .eq("user_id", userId)
          .eq("status", "pending")
          .select()
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: "Task not found or already claimed" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Task ${task_id} claimed by Ray`);
        return new Response(
          JSON.stringify({ task: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // COMPLETE - Mark task as done with result
      if (action === "complete") {
        const { task_id, result } = body;

        if (!task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("pending_tasks")
          .update({
            status: "completed",
            result: result || null,
            completed_at: new Date().toISOString(),
          })
          .eq("id", task_id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: "Task not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Task ${task_id} completed`);
        return new Response(
          JSON.stringify({ task: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // FAIL - Mark task as failed with error
      if (action === "fail") {
        const { task_id, error_message } = body;

        if (!task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("pending_tasks")
          .update({
            status: "failed",
            error_message: error_message || "Unknown error",
            completed_at: new Date().toISOString(),
          })
          .eq("id", task_id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ error: "Task not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Task ${task_id} failed: ${error_message}`);
        return new Response(
          JSON.stringify({ task: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // HEARTBEAT - Agent pings to indicate online status (per-agent)
      if (action === "heartbeat") {
        const { status_message, ring_color, agent_name: reqAgentName, agent_emoji: reqAgentEmoji, agent_id: reqAgentId } = body;
        const agentName = reqAgentName || "Ray";
        const agentEmoji = reqAgentEmoji || "⚡";

        // Look up existing status row — prefer agent_id (stable), fall back to agent_name
        let statusQuery = supabase
          .from("ai_status")
          .select("id")
          .eq("user_id", userId);
        if (reqAgentId) {
          statusQuery = statusQuery.eq("agent_id", reqAgentId);
        } else {
          statusQuery = statusQuery.eq("agent_name", agentName);
        }
        const { data: existingStatus } = await statusQuery.maybeSingle();

        const statusUpdate = {
          is_online: true,
          status_message: status_message || "Connected",
          ring_color: ring_color || "#22c55e",
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          agent_name: agentName,
          agent_emoji: agentEmoji,
          ...(reqAgentId ? { agent_id: reqAgentId } : {}),
        };

        if (existingStatus) {
          await supabase
            .from("ai_status")
            .update(statusUpdate)
            .eq("id", existingStatus.id);
        } else {
          await supabase
            .from("ai_status")
            .insert([{
              ...statusUpdate,
              user_id: userId,
            }]);
        }

        // Get pending task count for response
        const { count } = await supabase
          .from("pending_tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "pending");

        console.log(`Heartbeat from ${agentName}, ${count || 0} tasks pending`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            pending_count: count || 0,
            message: `Heartbeat received for ${agentName}` 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DISCONNECT - Mark agent(s) as offline
      if (action === "disconnect") {
        const { agent_name: reqAgentName, agent_id: reqDisconnectAgentId } = body;
        let query = supabase
          .from("ai_status")
          .update({
            is_online: false,
            status_message: "Disconnected",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Prefer agent_id for scoped disconnect, fall back to agent_name, otherwise all
        if (reqDisconnectAgentId) {
          query = query.eq("agent_id", reqDisconnectAgentId);
        } else if (reqAgentName) {
          query = query.eq("agent_name", reqAgentName);
        }
        await query;

        console.log(`${reqAgentName || "All agents"} disconnected`);
        return new Response(
          JSON.stringify({ success: true, message: `${reqAgentName || "All agents"} disconnected` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Unknown queue action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ SUB-AGENT MANAGEMENT ============
    if (requestType === "subagent") {
      const action = body.action as string;
      console.log(`Handling subagent action: ${action}`);

      // LIST - Get all sub-agents
      if (action === "list") {
        const { data, error } = await supabase
          .from("sub_agents")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error listing sub-agents:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list sub-agents" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ agents: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET - Get single sub-agent
      if (action === "get") {
        const { agent_id } = body;
        
        if (!agent_id) {
          return new Response(
            JSON.stringify({ error: "agent_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("sub_agents")
          .select("*")
          .eq("id", agent_id)
          .single();

        if (error) {
          console.error("Error getting sub-agent:", error);
          return new Response(
            JSON.stringify({ error: "Sub-agent not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ agent: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SPAWN - Create a new session for an agent
      if (action === "spawn") {
        const { agent_id, task, kanban_task_id, timeout_minutes, input_params } = body;
        
        if (!agent_id || !task) {
          return new Response(
            JSON.stringify({ error: "agent_id and task are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate agent exists and is available
        const { data: agent, error: agentError } = await supabase
          .from("sub_agents")
          .select("*")
          .eq("id", agent_id)
          .single();

        if (agentError || !agent) {
          return new Response(
            JSON.stringify({ error: "Agent not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (agent.status === "paused" || agent.status === "error") {
          return new Response(
            JSON.stringify({ error: "Agent is not available" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate unique session key
        const sessionKey = `agent:${agent.name}:subagent:${crypto.randomUUID().slice(0, 8)}`;

        // Create session
        const { data: session, error: sessionError } = await supabase
          .from("sub_agent_sessions")
          .insert({
            agent_id,
            session_key: sessionKey,
            task_description: task,
            status: "pending",
            input_params: input_params || null,
          })
          .select()
          .single();

        if (sessionError) {
          console.error("Error creating session:", sessionError);
          return new Response(
            JSON.stringify({ error: "Failed to create session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create task link if kanban_task_id provided
        if (kanban_task_id) {
          await supabase.from("sub_agent_tasks").insert({
            agent_id,
            session_id: session.id,
            kanban_task_id,
            task_description: task,
          });
        }

        // Update agent last_active and increment total_sessions
        await supabase
          .from("sub_agents")
          .update({ 
            last_active: new Date().toISOString(),
            total_sessions: (agent.total_sessions || 0) + 1
          })
          .eq("id", agent_id);

        // Log activity
        await logActivity(supabase, (kanban_task_id as string) || null, "subagent_task_spawned", {
          agent_name: agent.display_name,
          session_key: sessionKey,
          task_description: task,
        });

        // Notify via ai_log
        const taskPreview = (task as string).substring(0, 100) + ((task as string).length > 100 ? '...' : '');
        await supabase.from("ai_log").insert({
          user_id: userId,
          message: `🤖 Task spawned to ${agent.display_name}: "${taskPreview}"`,
          category: "observation",
          is_read: false,
          agent_name: logAgentName,
          agent_emoji: logAgentEmoji,
        });

        console.log("Session created:", session.id);
        return new Response(
          JSON.stringify({ session }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // PAUSE - Set agent status to paused
      if (action === "pause") {
        const { agent_id } = body;
        
        if (!agent_id) {
          return new Response(
            JSON.stringify({ error: "agent_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("sub_agents")
          .update({ status: "paused" })
          .eq("id", agent_id)
          .select()
          .single();

        if (error) {
          console.error("Error pausing agent:", error);
          return new Response(
            JSON.stringify({ error: "Failed to pause agent" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, null, "subagent_paused", { agent_name: data.display_name });

        return new Response(
          JSON.stringify({ agent: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // RESUME - Set agent status to idle
      if (action === "resume") {
        const { agent_id } = body;
        
        if (!agent_id) {
          return new Response(
            JSON.stringify({ error: "agent_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("sub_agents")
          .update({ status: "idle" })
          .eq("id", agent_id)
          .select()
          .single();

        if (error) {
          console.error("Error resuming agent:", error);
          return new Response(
            JSON.stringify({ error: "Failed to resume agent" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, null, "subagent_resumed", { agent_name: data.display_name });

        return new Response(
          JSON.stringify({ agent: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // LIST_SESSIONS - Get sessions for an agent
      if (action === "list_sessions") {
        const { agent_id, limit: sessionLimit } = body;
        
        if (!agent_id) {
          return new Response(
            JSON.stringify({ error: "agent_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("sub_agent_sessions")
          .select("*")
          .eq("agent_id", agent_id)
          .order("started_at", { ascending: false })
          .limit((sessionLimit as number) || 50);

        if (error) {
          console.error("Error listing sessions:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list sessions" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ sessions: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET_SESSION - Get session details
      if (action === "get_session") {
        const { session_id } = body;
        
        if (!session_id) {
          return new Response(
            JSON.stringify({ error: "session_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("sub_agent_sessions")
          .select("*")
          .eq("id", session_id)
          .single();

        if (error) {
          console.error("Error getting session:", error);
          return new Response(
            JSON.stringify({ error: "Session not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ session: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // UPDATE_SESSION - Update session status/result (for external callback)
      if (action === "update_session") {
        const { session_id, status, result_summary, result_full, tokens_used, input_tokens, output_tokens, cost, error_message, error_code, tools_used, messages_count } = body;
        
        if (!session_id) {
          return new Response(
            JSON.stringify({ error: "session_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: Record<string, unknown> = {};
        if (status) updates.status = status;
        if (result_summary) updates.result_summary = result_summary;
        if (result_full) updates.result_full = result_full;
        if (tokens_used !== undefined) updates.tokens_used = tokens_used;
        if (input_tokens !== undefined) updates.input_tokens = input_tokens;
        if (output_tokens !== undefined) updates.output_tokens = output_tokens;
        if (cost !== undefined) updates.cost = cost;
        if (error_message) updates.error_message = error_message;
        if (error_code) updates.error_code = error_code;
        if (tools_used) updates.tools_used = tools_used;
        if (messages_count !== undefined) updates.messages_count = messages_count;

        // If completing, set completed_at and duration
        if (status === "completed" || status === "failed") {
          updates.completed_at = new Date().toISOString();
          
          // Get session to calculate duration
          const { data: existingSession } = await supabase
            .from("sub_agent_sessions")
            .select("started_at, agent_id")
            .eq("id", session_id)
            .single();

          if (existingSession) {
            const startTime = new Date(existingSession.started_at).getTime();
            updates.duration_ms = Date.now() - startTime;

            // Update agent stats
            const { data: agent } = await supabase
              .from("sub_agents")
              .select("total_tasks_completed, error_count, avg_task_duration_ms, tokens_used_this_month, cost_this_month, success_rate, total_sessions")
              .eq("id", existingSession.agent_id)
              .single();

            if (agent) {
              const agentUpdates: Record<string, unknown> = {};
              
              if (status === "completed") {
                agentUpdates.total_tasks_completed = (agent.total_tasks_completed || 0) + 1;
              } else if (status === "failed") {
                agentUpdates.error_count = (agent.error_count || 0) + 1;
              }

              // Update avg duration
              const totalCompleted = (agent.total_tasks_completed || 0) + (status === "completed" ? 1 : 0);
              if (totalCompleted > 0) {
                const newAvg = ((agent.avg_task_duration_ms || 0) * (totalCompleted - 1) + (updates.duration_ms as number)) / totalCompleted;
                agentUpdates.avg_task_duration_ms = newAvg;
              }

              // Update tokens and cost
              if (tokens_used) agentUpdates.tokens_used_this_month = (agent.tokens_used_this_month || 0) + tokens_used;
              if (cost) agentUpdates.cost_this_month = (agent.cost_this_month || 0) + cost;

              // Recalculate success rate
              const totalErrors = (agent.error_count || 0) + (status === "failed" ? 1 : 0);
              const totalSessions = agent.total_sessions || 1;
              agentUpdates.success_rate = ((totalSessions - totalErrors) / totalSessions) * 100;

              await supabase.from("sub_agents").update(agentUpdates).eq("id", existingSession.agent_id);
            }
          }
        }

        const { data, error } = await supabase
          .from("sub_agent_sessions")
          .update(updates)
          .eq("id", session_id)
          .select()
          .single();

        if (error) {
          console.error("Error updating session:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ session: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // CREATE - Create a new sub-agent (Bujji control)
      if (action === "create") {
        const { 
          name, display_name, description, model, workspace, 
          allowed_tools, max_concurrent_tasks, timeout_minutes,
          system_prompt, monthly_token_budget, monthly_cost_budget 
        } = body;

        // Validate name format
        if (!name || !/^[a-z][a-z0-9-]{2,49}$/.test(name as string)) {
          return new Response(
            JSON.stringify({ error: "name must be lowercase, 3-50 chars, start with letter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!display_name || !model || !workspace) {
          return new Response(
            JSON.stringify({ error: "display_name, model, and workspace are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create agent
        const { data: agent, error: insertError } = await supabase
          .from("sub_agents")
          .insert({
            name,
            display_name,
            description: description || null,
            model,
            workspace,
            allowed_tools: allowed_tools || [],
            max_concurrent_tasks: max_concurrent_tasks || 3,
            timeout_minutes: timeout_minutes || 60,
            system_prompt: system_prompt || null,
            monthly_token_budget: monthly_token_budget || 1000000,
            monthly_cost_budget: monthly_cost_budget || 50,
            created_by: null, // Created by Bujji
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating sub-agent:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create sub-agent", details: insertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, null, "subagent_created", {
          agent_name: display_name,
          model,
        });

        // Notify via ai_log
        await supabase.from("ai_log").insert({
          user_id: userId,
          message: `🤖 New sub-agent created: "${display_name}" using ${model}`,
          category: "observation",
          is_read: false,
          agent_name: logAgentName,
          agent_emoji: logAgentEmoji,
        });

        console.log("Sub-agent created:", agent.id);
        return new Response(
          JSON.stringify({ agent }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // UPDATE - Update sub-agent configuration (Bujji control)
      if (action === "update") {
        const { agent_id, ...updates } = body;

        if (!agent_id) {
          return new Response(
            JSON.stringify({ error: "agent_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Remove action and type from updates
        delete updates.action;
        delete updates.type;

        const { data: agent, error: updateError } = await supabase
          .from("sub_agents")
          .update(updates)
          .eq("id", agent_id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating sub-agent:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update sub-agent", details: updateError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, null, "subagent_updated", {
          agent_name: agent.display_name,
          updates: Object.keys(updates),
        });

        console.log("Sub-agent updated:", agent.id);
        return new Response(
          JSON.stringify({ agent }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DELETE - Remove a sub-agent (Bujji control)
      if (action === "delete") {
        const { agent_id } = body;

        if (!agent_id) {
          return new Response(
            JSON.stringify({ error: "agent_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get agent info before deletion
        const { data: agent } = await supabase
          .from("sub_agents")
          .select("display_name")
          .eq("id", agent_id)
          .single();

        // Delete agent
        const { error: deleteError } = await supabase
          .from("sub_agents")
          .delete()
          .eq("id", agent_id);

        if (deleteError) {
          console.error("Error deleting sub-agent:", deleteError);
          return new Response(
            JSON.stringify({ error: "Failed to delete sub-agent", details: deleteError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, null, "subagent_deleted", {
          agent_name: agent?.display_name,
        });

        // Notify via ai_log
        await supabase.from("ai_log").insert({
          user_id: userId,
          message: `🗑️ Sub-agent deleted: "${agent?.display_name}"`,
          category: "observation",
          is_read: false,
          agent_name: logAgentName,
          agent_emoji: logAgentEmoji,
        });

        console.log("Sub-agent deleted:", agent_id);
        return new Response(
          JSON.stringify({ success: true, id: agent_id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Unknown subagent action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ BUJJI LOG MANAGEMENT ============
    if (requestType === "log") {
      const action = body.action as string;
      console.log(`Handling log action: ${action}`);

      if (action === "create") {
        const { message, category } = body;
        
        if (!message || typeof message !== "string" || message.trim() === "") {
          return new Response(
            JSON.stringify({ error: "message is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validCategories = ["general", "observation", "reminder", "fyi"];
        const logCategory = validCategories.includes(category as string) ? (category as string) : "general";

        const { data, error } = await supabase
          .from("ai_log")
          .insert({
            user_id: userId,
            message: message.trim(),
            category: logCategory,
            is_read: false,
            agent_name: body.agent_name || logAgentName || "Ray",
            agent_emoji: body.agent_emoji || "⚡",
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating log entry:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create log entry" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, null, "log_created", { category: logCategory });

        console.log("Log entry created:", data.id);
        return new Response(
          JSON.stringify({ log_entry: data }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "list") {
        const { category, unread_only } = body;
        
        let query = supabase
          .from("ai_log")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (category && category !== "all") {
          query = query.eq("category", category);
        }

        if (unread_only) {
          query = query.eq("is_read", false);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error listing log entries:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list log entries" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ log_entries: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "get_unread") {
        const { count, error } = await supabase
          .from("ai_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false);

        if (error) {
          console.error("Error counting unread logs:", error);
          return new Response(
            JSON.stringify({ error: "Failed to count unread logs" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ unread_count: count || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ QUESTIONS MANAGEMENT ============
    if (requestType === "question") {
      const action = body.action as string;
      console.log(`Handling question action: ${action}`);

      if (action === "ask") {
        const { question, context, related_task_id, priority, question_type } = body;
        
        if (!question || typeof question !== "string" || question.trim() === "") {
          return new Response(
            JSON.stringify({ error: "question is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validQuestionTypes = ["question", "approval"];
        const qType = validQuestionTypes.includes(question_type as string) ? question_type : "question";

        const { data, error } = await supabase
          .from("ai_questions")
          .insert({
            user_id: userId,
            question: question.trim(),
            context: context || null,
            related_task_id: related_task_id || null,
            priority: priority || "normal",
            question_type: qType,
            status: "pending",
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating question:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create question" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const eventType = qType === "approval" ? "approval_requested" : "question_asked";
        await logActivity(supabase, (related_task_id as string) || null, eventType, { 
          question: question.trim(),
          priority: priority || "normal",
          question_type: qType
        });

        console.log("Question created:", data.id);
        return new Response(
          JSON.stringify({ question: data }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "list") {
        const { status } = body;
        
        let query = supabase
          .from("ai_questions")
          .select("*, related_task:tasks(id, title)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error listing questions:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list questions" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ questions: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "get") {
        // Get pending questions count
        const { count, error } = await supabase
          .from("ai_questions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "pending");

        if (error) {
          console.error("Error counting questions:", error);
          return new Response(
            JSON.stringify({ error: "Failed to count questions" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ pending_count: count || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "check_answers") {
        // Check for recently answered questions
        const { data, error } = await supabase
          .from("ai_questions")
          .select("*, related_task:tasks(id, title)")
          .eq("user_id", userId)
          .eq("status", "answered")
          .order("answered_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error checking answers:", error);
          return new Response(
            JSON.stringify({ error: "Failed to check answers" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ answered_questions: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ STATUS MANAGEMENT ============
    if (requestType === "status") {
      console.log("Handling status request");
      
      if (req.method === "GET" || body.action === "get") {
        // Return ALL agent statuses for the user
        const { data, error } = await supabase
          .from("ai_status")
          .select("*")
          .eq("user_id", userId)
          .order("last_seen", { ascending: false });

        if (error) {
          console.error("Error fetching status:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ statuses: data || [], status: data?.[0] || null }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update status — upsert by (user_id, agent_name)
      const agentName = (body.agent_name as string) || "Ray";
      const agentEmoji = (body.agent_emoji as string) || (agentName === "Ray" ? "⚡" : "🤖");
      const { is_online, status_message, ring_color } = body;
      const updates: Record<string, unknown> = {
        agent_name: agentName,
        agent_emoji: agentEmoji,
      };
      
      if (is_online !== undefined) updates.is_online = is_online;
      if (status_message !== undefined) updates.status_message = status_message;
      if (ring_color !== undefined) updates.ring_color = ring_color;
      if (is_online === true) updates.last_seen = new Date().toISOString();

      // Upsert by (user_id, agent_id) if available, fall back to agent_name
      const reqAgentId2 = body.agent_id as string | undefined;
      let statusQuery2 = supabase
        .from("ai_status")
        .select("id")
        .eq("user_id", userId);
      if (reqAgentId2) {
        statusQuery2 = statusQuery2.eq("agent_id", reqAgentId2);
      } else {
        statusQuery2 = statusQuery2.eq("agent_name", agentName);
      }
      const { data: existingStatus } = await statusQuery2.maybeSingle();

      let data, error;
      if (existingStatus) {
        ({ data, error } = await supabase
          .from("ai_status")
          .update(updates)
          .eq("id", existingStatus.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from("ai_status")
          .insert({
            user_id: userId,
            ...updates,
          })
          .select()
          .single());
      }

      if (error) {
        console.error("Error updating status:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update status" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Status updated:", data);
      return new Response(
        JSON.stringify({ status: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ SKILL MANAGEMENT ============
    if (requestType === "skill") {
      const action = body.action as string;
      console.log(`Handling skill action: ${action}`);

      if (action === "list") {
        // List all accepted/ready skills for Bujji
        const { data, error } = await supabase
          .from("skills")
          .select("*, skill_operations(*)")
          .eq("bujji_status", "accepted")
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error listing skills:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list skills" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ skills: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "submit" || action === "review") {
        const { skill_id } = body;
        
        if (!skill_id) {
          return new Response(
            JSON.stringify({ error: "skill_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch skill with operations
        const { data: skill, error: fetchError } = await supabase
          .from("skills")
          .select("*, skill_operations(*)")
          .eq("id", skill_id)
          .single();

        if (fetchError || !skill) {
          console.error("Error fetching skill:", fetchError);
          return new Response(
            JSON.stringify({ error: "Skill not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update status to processing
        const { error: updateError } = await supabase
          .from("skills")
          .update({
            bujji_status: "processing",
            submitted_at: new Date().toISOString(),
          })
          .eq("id", skill_id);

        if (updateError) {
          console.error("Error updating skill status:", updateError);
        }

        // ========== ENHANCED VALIDATION LOGIC ==========
        console.log(`Running enhanced validation for skill: ${skill.name} (${skill.protocol_type})`);

        // 1. Validate basic info
        const basicValidation = validateBasicInfo(skill as Record<string, unknown>);

        // 2. Run protocol-specific validation
        const protocolType = (skill.protocol_type as string) || "rest";
        const connectionConfig = (skill.connection_config as Record<string, unknown>) || {};
        let protocolValidation: ValidationResult = { valid: [], issues: [] };

        switch (protocolType) {
          case "rest":
            protocolValidation = validateRestConfig(connectionConfig, skill as Record<string, unknown>);
            break;
          case "smtp":
            protocolValidation = validateSmtpConfig(connectionConfig, skill as Record<string, unknown>);
            break;
          case "graphql":
            protocolValidation = validateGraphqlConfig(connectionConfig, skill as Record<string, unknown>);
            break;
          case "webhook":
            protocolValidation = validateWebhookConfig(connectionConfig, skill as Record<string, unknown>);
            break;
          case "custom":
            protocolValidation = validateCustomConfig(connectionConfig, skill as Record<string, unknown>);
            break;
          default:
            protocolValidation = validateRestConfig(connectionConfig, skill as Record<string, unknown>);
        }

        // 3. Analyze operations
        const operations = (skill.skill_operations as Record<string, unknown>[]) || [];
        const operationsAnalysis = analyzeOperations(operations, skill as Record<string, unknown>);

        // 4. Process additional notes
        const additionalNotes = skill.additional_notes as string | null;
        const notesContext = processAdditionalNotes(additionalNotes);

        if (notesContext.helpful) {
          console.log("Extracted context from notes:", notesContext.extracted);
        }

        // 5. Combine all validations
        const allValidations = [
          ...basicValidation.valid,
          ...protocolValidation.valid,
          ...operationsAnalysis.valid,
        ];

        const allIssues = [
          ...basicValidation.issues,
          ...protocolValidation.issues,
          ...operationsAnalysis.issues,
        ];

        const allSuggestions = operationsAnalysis.suggestions;

        // 6. Generate final feedback using the helper function
        const { status: finalStatus, feedback } = generateBujjiFeedback(
          skill as Record<string, unknown>,
          allValidations,
          allIssues,
          allSuggestions,
          notesContext.extracted
        );

        console.log(`Validation complete - Status: ${finalStatus}, Validations: ${allValidations.length}, Issues: ${allIssues.length}`);

        // Update skill with final status and feedback
        const { data: updatedSkill, error: finalUpdateError } = await supabase
          .from("skills")
          .update({
            bujji_status: finalStatus,
            bujji_feedback: feedback,
            reviewed_at: new Date().toISOString(),
            status: finalStatus === "accepted" ? "ready" : skill.status,
          })
          .eq("id", skill_id)
          .select()
          .single();

        if (finalUpdateError) {
          console.error("Error updating skill final status:", finalUpdateError);
          return new Response(
            JSON.stringify({ error: "Failed to update skill status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, null, "skill_reviewed", {
          skill_id,
          skill_name: skill.name,
          protocol_type: protocolType,
          result: finalStatus,
          validations_count: allValidations.length,
          issues_count: allIssues.length,
          suggestions_count: allSuggestions.length,
        });

        console.log(`Skill ${skill_id} reviewed: ${finalStatus}`);

        // ========== NOTIFY BUJJI ==========
        // Create log entry so Bujji sees the submission in heartbeat
        if (finalStatus === "accepted") {
          const logMessage = `New skill ready: "${skill.title}"

Protocol: ${protocolType.toUpperCase()}
Operations: ${operations.length}
Validation: ${allValidations.length} checks passed
${allSuggestions.length > 0 ? `\nSuggestions:\n${allSuggestions.slice(0, 2).join('\n')}` : ''}

I'll use this skill when relevant tasks come up.`;

          const { error: logError } = await supabase.from("ai_log").insert({
            user_id: userId,
            message: logMessage,
            category: "observation",
            is_read: false,
            agent_name: logAgentName,
            agent_emoji: logAgentEmoji,
          });

          if (logError) {
            console.error("Error creating ai_log for accepted skill:", logError);
          } else {
            console.log(`Created log notification for accepted skill: ${skill.name}`);
          }

        } else if (finalStatus === "needs_info") {
          const blockingIssues = allIssues.filter((i: string) => i.startsWith("X") || i.startsWith("❌"));
          const warnings = allIssues.filter((i: string) => i.startsWith("!") || i.startsWith("?") || i.startsWith("⚠") || i.startsWith("❓"));

          const logMessage = `Skill needs review: "${skill.title}"

Protocol: ${protocolType.toUpperCase()}

Issues found:
${blockingIssues.length > 0 ? blockingIssues.join('\n') : 'None'}
${warnings.length > 0 ? `\nWarnings:\n${warnings.join('\n')}` : ''}

Waiting for user to fix and resubmit.`;

          const { error: logError } = await supabase.from("ai_log").insert({
            user_id: userId,
            message: logMessage,
            category: "observation",
            is_read: false,
            agent_name: logAgentName,
            agent_emoji: logAgentEmoji,
          });

          if (logError) {
            console.error("Error creating ai_log for needs_info skill:", logError);
          }

          // Also create approval question for tracking
          const { error: questionError } = await supabase.from("ai_questions").insert({
            user_id: userId,
            question: `Review skill submission: ${skill.title}?`,
            question_type: "approval",
            context: JSON.stringify({
              skill_id: skill_id,
              skill_name: skill.name,
              protocol: protocolType,
              issues: blockingIssues,
              warnings: warnings,
              operations_count: operations.length,
            }),
            priority: "high",
            status: "pending",
            agent_name: logAgentName,
            agent_emoji: logAgentEmoji,
          });

          if (questionError) {
            console.error("Error creating approval question:", questionError);
          } else {
            console.log(`Created log + approval for skill needing info: ${skill.name}`);
          }
        }

        return new Response(
          JSON.stringify({
            skill: updatedSkill,
            validation: allValidations,
            issues: allIssues,
            suggestions: allSuggestions,
            notes_context: notesContext.extracted,
            status: finalStatus,
            feedback,
            has_methodology: !!(skill.skill_markdown && (skill.skill_markdown as string).length >= 100),
            input_fields_count: Object.keys((skill.input_schema as Record<string, unknown>) || {}).length,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "get") {
        const { skill_id, skill_name } = body;
        
        let query = supabase
          .from("skills")
          .select("*, skill_operations(*)");
        
        if (skill_id) {
          query = query.eq("id", skill_id);
        } else if (skill_name) {
          query = query.eq("name", skill_name);
        } else {
          return new Response(
            JSON.stringify({ error: "skill_id or skill_name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await query.single();

        if (error) {
          console.error("Error fetching skill:", error);
          return new Response(
            JSON.stringify({ error: "Skill not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            skill: data,
            has_methodology: !!(data.skill_markdown && (data.skill_markdown as string).length >= 100),
            input_fields_count: Object.keys((data.input_schema as Record<string, unknown>) || {}).length,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ========== CREATE SKILL ==========
      if (action === "create") {
        const skillName = body.name as string;
        const skillTitle = body.title as string;

        if (!skillName || !skillTitle) {
          return new Response(
            JSON.stringify({ error: "name and title are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const skillData: Record<string, unknown> = {
          name: skillName,
          title: skillTitle,
          created_by: userId,
        };

        // Optional fields
        const optionalFields = [
          "description", "protocol_type", "api_base_url", "auth_type", "auth_header",
          "auth_format", "agent_type", "agent_name", "status", "additional_notes",
          "skill_markdown", "output_format"
        ];
        for (const field of optionalFields) {
          if (body[field] !== undefined) skillData[field] = body[field];
        }
        // JSON/array fields
        if (body.use_cases !== undefined) skillData.use_cases = body.use_cases;
        if (body.connection_config !== undefined) skillData.connection_config = body.connection_config;
        if (body.allowed_tools !== undefined) skillData.allowed_tools = body.allowed_tools;
        if (body.input_schema !== undefined) skillData.input_schema = body.input_schema;

        // If status is "ready", also set bujji_status to accepted
        if (skillData.status === "ready") {
          skillData.bujji_status = "accepted";
          skillData.reviewed_at = new Date().toISOString();
        }

        const { data: skill, error: insertError } = await supabase
          .from("skills")
          .insert(skillData)
          .select()
          .single();

        if (insertError) {
          console.error("Error creating skill:", insertError);
          return new Response(
            JSON.stringify({ error: `Failed to create skill: ${insertError.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert operations if provided
        let operationsCreated = 0;
        const skillOps = body.skill_operations as Record<string, unknown>[] | undefined;
        if (skillOps && Array.isArray(skillOps) && skillOps.length > 0) {
          const opsToInsert = skillOps.map((op, index) => ({
            skill_id: skill.id,
            name: sanitizeOperationName((op.name as string) || `op_${index}`, index),
            title: op.title || op.name || `Operation ${index + 1}`,
            description: op.description || null,
            http_method: op.http_method || "GET",
            endpoint_path: op.endpoint_path || "/",
            request_body_schema: op.request_body_schema || {},
            response_schema: op.response_schema || {},
            example_request: op.example_request || {},
            example_response: op.example_response || {},
            position: index,
          }));

          const { error: opsError } = await supabase
            .from("skill_operations")
            .insert(opsToInsert);

          if (opsError) {
            console.error("Error creating skill operations:", opsError);
          } else {
            operationsCreated = opsToInsert.length;
          }
        }

        await logActivity(supabase, null, "skill_created", {
          skill_id: skill.id,
          skill_name: skillName,
          agent_name: skillData.agent_name || "unknown",
          operations_count: operationsCreated,
        });

        console.log(`Skill created: ${skillName} with ${operationsCreated} operations`);

        return new Response(
          JSON.stringify({
            skill,
            operations_created: operationsCreated,
            has_methodology: !!(skill.skill_markdown && (skill.skill_markdown as string).length >= 100),
            input_fields_count: Object.keys((skill.input_schema as Record<string, unknown>) || {}).length,
          }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ========== UPDATE SKILL ==========
      if (action === "update") {
        const skillId = body.skill_id as string;
        if (!skillId) {
          return new Response(
            JSON.stringify({ error: "skill_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {};
        const updatableFields = [
          "name", "title", "description", "protocol_type", "api_base_url", "auth_type",
          "auth_header", "auth_format", "agent_type", "agent_name", "status",
          "additional_notes", "skill_markdown", "output_format", "bujji_status",
          "bujji_feedback", "use_cases", "connection_config", "allowed_tools", "input_schema"
        ];
        for (const field of updatableFields) {
          if (body[field] !== undefined) updateData[field] = body[field];
        }

        if (Object.keys(updateData).length === 0 && !body.skill_operations) {
          return new Response(
            JSON.stringify({ error: "No fields to update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let updatedSkill = null;
        if (Object.keys(updateData).length > 0) {
          const { data, error } = await supabase
            .from("skills")
            .update(updateData)
            .eq("id", skillId)
            .select()
            .single();

          if (error) {
            console.error("Error updating skill:", error);
            return new Response(
              JSON.stringify({ error: `Failed to update skill: ${error.message}` }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          updatedSkill = data;
        }

        // Replace operations if provided
        const skillOps = body.skill_operations as Record<string, unknown>[] | undefined;
        if (skillOps && Array.isArray(skillOps)) {
          // Delete existing operations
          await supabase.from("skill_operations").delete().eq("skill_id", skillId);

          if (skillOps.length > 0) {
            const opsToInsert = skillOps.map((op, index) => ({
              skill_id: skillId,
              name: sanitizeOperationName((op.name as string) || `op_${index}`, index),
              title: op.title || op.name || `Operation ${index + 1}`,
              description: op.description || null,
              http_method: op.http_method || "GET",
              endpoint_path: op.endpoint_path || "/",
              request_body_schema: op.request_body_schema || {},
              response_schema: op.response_schema || {},
              example_request: op.example_request || {},
              example_response: op.example_response || {},
              position: index,
            }));

            const { error: opsError } = await supabase.from("skill_operations").insert(opsToInsert);
            if (opsError) {
              console.error("Error replacing skill operations:", opsError);
            }
          }
        }

        // Count operations for response
        const { count: opsCount } = await supabase
          .from("skill_operations")
          .select("*", { count: "exact", head: true })
          .eq("skill_id", skillId);

        if (!updatedSkill) {
          const { data } = await supabase.from("skills").select("*").eq("id", skillId).single();
          updatedSkill = data;
        }

        console.log(`Skill updated: ${skillId}`);
        return new Response(
          JSON.stringify({
            skill: updatedSkill,
            operations_replaced: opsCount || 0,
            has_methodology: !!(updatedSkill?.skill_markdown && (updatedSkill.skill_markdown as string).length >= 100),
            input_fields_count: Object.keys((updatedSkill?.input_schema as Record<string, unknown>) || {}).length,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ========== DELETE SKILL ==========
      if (action === "delete") {
        const skillId = body.skill_id as string;
        if (!skillId) {
          return new Response(
            JSON.stringify({ error: "skill_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete operations first (no FK cascade)
        await supabase.from("skill_operations").delete().eq("skill_id", skillId);

        const { error } = await supabase.from("skills").delete().eq("id", skillId);
        if (error) {
          console.error("Error deleting skill:", error);
          return new Response(
            JSON.stringify({ error: `Failed to delete skill: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Skill deleted: ${skillId}`);
        return new Response(
          JSON.stringify({ success: true, deleted: skillId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ ASSIGNEE MANAGEMENT ============
    if (requestType === "assignee") {
      const action = body.action as string;
      console.log(`Handling assignee action: ${action}`);

      if (action === "assign") {
        const { task_id, names } = body;
        
        if (!task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Accept both single name and array of names
        const nameList = Array.isArray(names) ? names : (names ? [names] : []);
        if (nameList.length === 0) {
          return new Response(
            JSON.stringify({ error: "At least one name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Lookup users by name
        const users = await lookupUsersByNames(supabase, nameList as string[]);
        if (users.length === 0) {
          return new Response(
            JSON.stringify({ error: `No users found with names: ${nameList.join(', ')}` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert assignments (ignore duplicates)
        const assignments = users.map(u => ({
          task_id,
          user_id: u.id,
        }));

        const { data, error } = await supabase
          .from("task_assignees")
          .upsert(assignments, { onConflict: 'task_id,user_id', ignoreDuplicates: true })
          .select("*, user:users(id, name)");

        if (error) {
          console.error("Error assigning users:", error);
          return new Response(
            JSON.stringify({ error: "Failed to assign users" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, task_id as string, "assignees_added", { 
          names: users.map(u => u.name) 
        });

        return new Response(
          JSON.stringify({ success: true, assigned: users.map(u => u.name), assignees: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "unassign") {
        const { task_id, names } = body;
        
        if (!task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const nameList = Array.isArray(names) ? names : (names ? [names] : []);
        if (nameList.length === 0) {
          return new Response(
            JSON.stringify({ error: "At least one name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Lookup users by name
        const users = await lookupUsersByNames(supabase, nameList as string[]);
        if (users.length === 0) {
          return new Response(
            JSON.stringify({ error: `No users found with names: ${nameList.join(', ')}` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete assignments
        const { error } = await supabase
          .from("task_assignees")
          .delete()
          .eq("task_id", task_id)
          .in("user_id", users.map(u => u.id));

        if (error) {
          console.error("Error unassigning users:", error);
          return new Response(
            JSON.stringify({ error: "Failed to unassign users" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, task_id as string, "assignees_removed", { 
          names: users.map(u => u.name) 
        });

        return new Response(
          JSON.stringify({ success: true, unassigned: users.map(u => u.name) }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "list") {
        const { task_id } = body;
        
        if (!task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("task_assignees")
          .select("*, user:users(id, name, email)")
          .eq("task_id", task_id);

        if (error) {
          console.error("Error listing assignees:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list assignees" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ assignees: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ SUBTASK MANAGEMENT ============
    if (requestType === "subtask") {
      const action = body.action as string;
      console.log(`Handling subtask action: ${action}`);

      if (action === "create") {
        const { task_id, title, due_date, assigned_to } = body;
        
        if (!task_id || !title) {
          return new Response(
            JSON.stringify({ error: "task_id and title are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("subtasks")
          .insert({
            task_id,
            title,
            due_date: due_date || null,
            assigned_to: assigned_to || null,
            completed: false,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating subtask:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create subtask" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, task_id as string, "subtask_created", { subtask_title: title });

        return new Response(
          JSON.stringify({ subtask: data }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "update") {
        const { id, completed, title, due_date, assigned_to } = body;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Subtask id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: Record<string, unknown> = {};
        if (completed !== undefined) updates.completed = completed;
        if (title !== undefined) updates.title = title;
        if (due_date !== undefined) updates.due_date = due_date;
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;

        const { data, error } = await supabase
          .from("subtasks")
          .update(updates)
          .eq("id", id)
          .select("*, task_id")
          .single();

        if (error) {
          console.error("Error updating subtask:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update subtask" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const actionType = completed !== undefined ? "subtask_toggled" : "subtask_updated";
        await logActivity(supabase, data.task_id, actionType, { subtask_id: id, completed });

        return new Response(
          JSON.stringify({ subtask: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "delete") {
        const { id } = body;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Subtask id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get task_id before deletion
        const { data: subtask } = await supabase
          .from("subtasks")
          .select("task_id, title")
          .eq("id", id)
          .single();

        const { error } = await supabase
          .from("subtasks")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Error deleting subtask:", error);
          return new Response(
            JSON.stringify({ error: "Failed to delete subtask" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, subtask?.task_id, "subtask_deleted", { subtask_title: subtask?.title });

        return new Response(
          JSON.stringify({ success: true, id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ INSIGHT MANAGEMENT ============
    if (requestType === "insight") {
      const action = body.action as string;
      console.log(`Handling insight action: ${action}`);

      if (action === "create") {
        const { title, content, insight_type, data: insightData, target_user_id } = body;
        
        if (!title || !content || !insight_type) {
          return new Response(
            JSON.stringify({ error: "title, content, and insight_type are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("ai_insights")
          .insert({
            title,
            content,
            insight_type,
            data: insightData || null,
            target_user_id: target_user_id || null,
            is_read: false,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating insight:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create insight" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, null, "insight_created", { insight_title: title, insight_type });

        return new Response(
          JSON.stringify({ insight: data }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "update") {
        const { id, is_read, content, title } = body;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Insight id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: Record<string, unknown> = {};
        if (is_read !== undefined) updates.is_read = is_read;
        if (content !== undefined) updates.content = content;
        if (title !== undefined) updates.title = title;

        const { data, error } = await supabase
          .from("ai_insights")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("Error updating insight:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update insight" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ insight: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "delete") {
        const { id } = body;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Insight id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("ai_insights")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Error deleting insight:", error);
          return new Response(
            JSON.stringify({ error: "Failed to delete insight" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ BUDGET MANAGEMENT ============
    if (requestType === "budget") {
      const action = body.action as string;
      console.log(`Handling budget action: ${action}`);

      if (action === "get" || req.method === "GET") {
        const { data, error } = await supabase
          .from("task_budgets")
          .select("*, task:tasks(id, title)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching budgets:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch budgets" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ budgets: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "update") {
        const { task_id, estimated_cost, actual_cost, notes, currency } = body;
        
        if (!task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if budget exists
        const { data: existing } = await supabase
          .from("task_budgets")
          .select("id")
          .eq("task_id", task_id)
          .maybeSingle();

        const budgetData: Record<string, unknown> = {};
        if (estimated_cost !== undefined) budgetData.estimated_cost = estimated_cost;
        if (actual_cost !== undefined) budgetData.actual_cost = actual_cost;
        if (notes !== undefined) budgetData.notes = notes;
        if (currency !== undefined) budgetData.currency = currency;

        let data;
        let error;

        if (existing) {
          const result = await supabase
            .from("task_budgets")
            .update(budgetData)
            .eq("task_id", task_id)
            .select()
            .single();
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from("task_budgets")
            .insert({ task_id, ...budgetData })
            .select()
            .single();
          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error("Error updating budget:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update budget" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(supabase, task_id as string, "budget_updated", { estimated_cost, actual_cost });

        return new Response(
          JSON.stringify({ budget: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ REPORT MANAGEMENT ============
    if (requestType === "report") {
      const action = body.action as string;
      console.log(`Handling report action: ${action}`);

      // CREATE - Add new report
      if (action === "create") {
        const { title, report_type, html_content } = body;

        if (!title || !report_type || !html_content) {
          return new Response(
            JSON.stringify({ error: "title, report_type, and html_content are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!["employee", "insight"].includes(report_type as string)) {
          return new Response(
            JSON.stringify({ error: "report_type must be 'employee' or 'insight'" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("reports")
          .insert({
            title,
            report_type,
            html_content,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating report:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create report" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log to ai_log
        const reportTypeLabel = report_type === "employee" ? "Employee Report" : "AI Insight";
        await supabase.from("ai_log").insert({
          user_id: userId,
          message: `📄 New ${reportTypeLabel} added: "${title}"`,
          category: "observation",
          agent_name: logAgentName,
          agent_emoji: logAgentEmoji,
        });

        console.log(`Report created: ${data.id}`);
        return new Response(
          JSON.stringify({ success: true, report: data, message: `Report "${title}" created successfully` }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // LIST - Get reports
      if (action === "list") {
        const { report_type } = body;

        let query = supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false });

        if (report_type && report_type !== "all") {
          query = query.eq("report_type", report_type);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error listing reports:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list reports" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, reports: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DELETE - Remove report
      if (action === "delete") {
        const { report_id } = body;

        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch report title for logging
        const { data: existing } = await supabase
          .from("reports")
          .select("title")
          .eq("id", report_id)
          .single();

        const { error } = await supabase
          .from("reports")
          .delete()
          .eq("id", report_id);

        if (error) {
          console.error("Error deleting report:", error);
          return new Response(
            JSON.stringify({ error: "Failed to delete report" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Report deleted: ${report_id}`);
        return new Response(
          JSON.stringify({ success: true, report_id, message: `Report "${existing?.title || report_id}" deleted` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // MARK_READ - Mark report as read
      if (action === "mark_read") {
        const { report_id } = body;

        if (!report_id) {
          return new Response(
            JSON.stringify({ error: "report_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("reports")
          .update({ is_read: true })
          .eq("id", report_id)
          .select()
          .single();

        if (error) {
          console.error("Error marking report as read:", error);
          return new Response(
            JSON.stringify({ error: "Failed to mark report as read" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, report: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ RAW REPORT MANAGEMENT (Webhook Queue) ============
    if (requestType === "raw_report") {
      const action = body.action as string;
      console.log(`Handling raw_report action: ${action}`);

      // LIST - Get raw reports with optional status filter
      if (action === "list") {
        const { status: filterStatus, limit: queryLimit } = body;

        let query = supabase
          .from("raw_reports")
          .select("*")
          .order("created_at", { ascending: false });

        if (filterStatus && filterStatus !== "all") {
          query = query.eq("status", filterStatus);
        }

        if (queryLimit) {
          query = query.limit(queryLimit as number);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error listing raw reports:", error);
          return new Response(
            JSON.stringify({ error: "Failed to list raw reports" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, raw_reports: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SUBMIT - Mark raw report for processing by Bujji
      if (action === "submit") {
        const rawReportId = body.raw_report_id || body.report_id;
        const functionIdOverride = body.function_id as string | undefined;

        if (!rawReportId) {
          return new Response(
            JSON.stringify({ error: "raw_report_id or report_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If a function_id override was provided, update the raw_report first
        if (functionIdOverride) {
          await supabase
            .from("raw_reports")
            .update({ function_id: functionIdOverride })
            .eq("id", rawReportId);
        }

        // Mark as processing
        const { data, error } = await supabase
          .from("raw_reports")
          .update({ status: "processing" })
          .eq("id", rawReportId)
          .select()
          .single();

        if (error) {
          console.error("Error submitting raw report:", error);
          return new Response(
            JSON.stringify({ error: "Raw report not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Load linked function's prompt template if available
        const effectiveFunctionId = functionIdOverride || data.function_id;
        let promptTemplate: string | null = null;
        let functionName: string | null = null;
        if (effectiveFunctionId) {
          const { data: fnData } = await supabase
            .from("webhook_functions")
            .select("name, prompt_template, report_type")
            .eq("id", effectiveFunctionId)
            .single();
          if (fnData) {
            promptTemplate = fnData.prompt_template;
            functionName = fnData.name;
          }
        }

        // Log submission
        await supabase.from("ai_log").insert({
          user_id: userId,
          message: `📤 Raw report from "${data.source}"${functionName ? ` using function "${functionName}"` : ""} submitted for processing`,
          category: "observation",
          is_read: false,
          agent_name: logAgentName,
          agent_emoji: logAgentEmoji,
        });

        // Build context with optional prompt template
        const contextObj: Record<string, unknown> = {
          raw_report_id: rawReportId,
          source: data.source,
          report_type: data.report_type,
          action_required: "process_raw_report",
        };
        if (promptTemplate) {
          contextObj.prompt_template = promptTemplate;
          contextObj.function_name = functionName;
          contextObj.processed_prompt = promptTemplate.replace(/\{\{raw_data\}\}/g, JSON.stringify(data.raw_data, null, 2));
        }

        // Create ai_questions entry
        await supabase.from("ai_questions").insert({
          user_id: userId,
          question: promptTemplate
            ? `Process raw report from "${data.source}" using function "${functionName}":\n\n${promptTemplate.replace(/\{\{raw_data\}\}/g, JSON.stringify(data.raw_data, null, 2))}`
            : `Process raw report from "${data.source}" (${data.report_type})?`,
          question_type: "approval",
          context: JSON.stringify(contextObj),
          priority: "high",
          status: "pending",
          agent_name: logAgentName,
          agent_emoji: logAgentEmoji,
        });

        console.log(`Raw report ${rawReportId} submitted for processing${functionName ? ` with function "${functionName}"` : ""}`);
        return new Response(
          JSON.stringify({ success: true, raw_report: data, message: "Raw report submitted for processing" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET - Fetch specific raw report
      if (action === "get") {
        const { raw_report_id } = body;

        if (!raw_report_id) {
          return new Response(
            JSON.stringify({ error: "raw_report_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("raw_reports")
          .select("*")
          .eq("id", raw_report_id)
          .single();

        if (error) {
          console.error("Error fetching raw report:", error);
          return new Response(
            JSON.stringify({ error: "Raw report not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Mark as processing when fetched
        await supabase
          .from("raw_reports")
          .update({ status: "processing" })
          .eq("id", raw_report_id);

        return new Response(
          JSON.stringify({ success: true, raw_report: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // PROCESS - Mark raw report as completed after creating HTML report
      if (action === "process") {
        const { raw_report_id, processed_report_id } = body;

        if (!raw_report_id || !processed_report_id) {
          return new Response(
            JSON.stringify({ error: "raw_report_id and processed_report_id are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("raw_reports")
          .update({
            status: "completed",
            processed_report_id,
            processed_at: new Date().toISOString(),
          })
          .eq("id", raw_report_id)
          .select()
          .single();

        if (error) {
          console.error("Error marking raw report as processed:", error);
          return new Response(
            JSON.stringify({ error: "Failed to mark raw report as processed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log completion
        await supabase.from("ai_log").insert({
          user_id: userId,
          message: `✅ Raw report from "${data.source}" processed successfully`,
          category: "observation",
          is_read: false,
          agent_name: logAgentName,
          agent_emoji: logAgentEmoji,
        });

        console.log(`Raw report ${raw_report_id} processed -> report ${processed_report_id}`);
        return new Response(
          JSON.stringify({ success: true, raw_report: data, message: "Raw report marked as completed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // MARK_FAILED - Mark raw report processing as failed
      if (action === "mark_failed") {
        const { raw_report_id, error_message } = body;

        if (!raw_report_id) {
          return new Response(
            JSON.stringify({ error: "raw_report_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("raw_reports")
          .update({
            status: "failed",
            error_message: error_message || "Unknown error",
            processed_at: new Date().toISOString(),
          })
          .eq("id", raw_report_id)
          .select()
          .single();

        if (error) {
          console.error("Error marking raw report as failed:", error);
          return new Response(
            JSON.stringify({ error: "Failed to mark raw report as failed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log failure
        await supabase.from("ai_log").insert({
          user_id: userId,
          message: `❌ Failed to process raw report from "${data.source}": ${error_message || "Unknown error"}`,
          category: "observation",
          is_read: false,
          agent_name: logAgentName,
          agent_emoji: logAgentEmoji,
        });

        console.log(`Raw report ${raw_report_id} marked as failed`);
        return new Response(
          JSON.stringify({ success: true, raw_report: data, message: "Raw report marked as failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Unknown raw_report action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ============ TASK MANAGEMENT (Action-based routing) ============
    if (requestType === "task") {
      const action = body.action as string;
      console.log(`Handling task action: ${action}`);

      // Fetch board columns for mapping
      const { data: columns, error: columnsError } = await supabase
        .from("board_columns")
        .select("id, name");

      if (columnsError) {
        console.error("Error fetching columns:", columnsError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch board columns" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resolveColumnId = (columnName?: string): string | null => {
        if (!columnName) return null;
        const normalizedName = columnMapping[columnName.toLowerCase()] || columnName;
        const column = columns?.find(
          (c: { id: string; name: string }) => c.name.toLowerCase() === normalizedName.toLowerCase()
        );
        return column?.id || null;
      };

      const getColumnName = (columnId: string): string => {
        const column = columns?.find((c: { id: string; name: string }) => c.id === columnId);
        return column?.name || "Unknown";
      };

      // LIST - List all tasks, optionally filtered by column
      if (action === "list") {
        const columnFilter = body.column as string | undefined;
        let query = supabase
          .from("tasks")
          .select(`
            *,
            subtasks(*),
            board_column:board_columns(id, name, color),
            task_budgets(*),
            task_assignees(*, user:users(id, name, email))
          `)
          .order("created_at", { ascending: false });

        if (columnFilter) {
          const columnId = resolveColumnId(columnFilter);
          if (columnId) {
            query = query.eq("board_column_id", columnId);
          }
        }

        const { data: tasks, error } = await query;
        if (error) {
          console.error("Error fetching tasks:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch tasks: " + error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Fetched ${tasks?.length || 0} tasks`);
        return new Response(
          JSON.stringify({ tasks, columns }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET - Get a single task by ID
      if (action === "get") {
        const id = (body.id || body.task_id) as string;
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Task ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: task, error } = await supabase
          .from("tasks")
          .select(`
            *,
            subtasks(*),
            board_column:board_columns(id, name, color),
            task_budgets(*),
            task_assignees(*, user:users(id, name, email))
          `)
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching task:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch task: " + error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ task }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // CREATE - Create a new task
      if (action === "create") {
        const { title, description, column, priority, due_date, estimated_cost, comment } = body;

        if (!title || typeof title !== "string" || (title as string).trim() === "") {
          return new Response(
            JSON.stringify({ error: "Title is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const taskPriority = priority && validPriorities.includes(priority as string)
          ? priority as string
          : "Medium";

        let columnId = resolveColumnId(column as string);
        if (!columnId) {
          const todoColumn = columns?.find((c: { id: string; name: string }) => c.name === "To Do");
          columnId = todoColumn?.id || null;
        }

        console.log(`Creating task: "${title}" in column: ${column || "To Do"} with priority: ${taskPriority}`);

        const { data: task, error } = await supabase
          .from("tasks")
          .insert({
            title: (title as string).trim(),
            description: (description as string)?.trim() || null,
            board_column_id: columnId,
            priority: taskPriority,
            due_date: due_date || null,
            position: 0,
            created_by_bujji: true,
          })
          .select(`
            *,
            board_column:board_columns(id, name, color)
          `)
          .single();

        if (error) {
          console.error("Error creating task:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create task" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logActivity(
          supabase,
          task.id,
          "task_created",
          { title: task.title, column: getColumnName(columnId!), priority: taskPriority },
          comment as string
        );

        if (estimated_cost !== undefined && estimated_cost !== null) {
          await supabase.from("task_budgets").insert({
            task_id: task.id,
            estimated_cost: estimated_cost,
          });
        }

        console.log(`Task created with ID: ${task.id}`);
        return new Response(
          JSON.stringify({ task }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // UPDATE - Update a task
      if (action === "update") {
        const id = (body.id || body.task_id) as string;
        const { title, description, column, priority, due_date, estimated_cost, actual_cost, comment } = body;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Task ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: existingTask } = await supabase
          .from("tasks")
          .select("*, board_column:board_columns(id, name)")
          .eq("id", id)
          .single();

        const updates: Record<string, unknown> = {};
        const actionDetails: Record<string, unknown> = {};

        if (title !== undefined) {
          updates.title = (title as string).trim();
          actionDetails.title = { from: existingTask?.title, to: (title as string).trim() };
        }
        if (description !== undefined) {
          updates.description = (description as string)?.trim() || null;
          actionDetails.description = "updated";
        }
        if (priority !== undefined) {
          if (validPriorities.includes(priority as string)) {
            updates.priority = priority;
            actionDetails.priority = { from: existingTask?.priority, to: priority };
          }
        }
        if (due_date !== undefined) {
          updates.due_date = due_date;
          actionDetails.due_date = { from: existingTask?.due_date, to: due_date };
        }
        if (column !== undefined) {
          const colId = resolveColumnId(column as string);
          if (colId) {
            updates.board_column_id = colId;
            actionDetails.column = {
              from: existingTask?.board_column?.name,
              to: getColumnName(colId)
            };
          } else {
            return new Response(
              JSON.stringify({ error: `Invalid column name: ${column}` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        console.log(`Updating task ${id}:`, updates);

        const { data: task, error } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", id)
          .select(`
            *,
            board_column:board_columns(id, name, color)
          `)
          .single();

        if (error) {
          console.error("Error updating task:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update task" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let actionType = "task_updated";
        if (actionDetails.column) {
          actionType = "task_moved";
        }

        await logActivity(supabase, id as string, actionType, actionDetails, comment as string);

        if (estimated_cost !== undefined || actual_cost !== undefined) {
          const { data: existingBudget } = await supabase
            .from("task_budgets")
            .select("id")
            .eq("task_id", id)
            .maybeSingle();

          if (existingBudget) {
            const budgetUpdates: Record<string, unknown> = {};
            if (estimated_cost !== undefined) budgetUpdates.estimated_cost = estimated_cost;
            if (actual_cost !== undefined) budgetUpdates.actual_cost = actual_cost;
            await supabase.from("task_budgets").update(budgetUpdates).eq("task_id", id);
          } else {
            await supabase.from("task_budgets").insert({
              task_id: id,
              estimated_cost: estimated_cost || null,
              actual_cost: actual_cost || null,
            });
          }
        }

        console.log(`Task ${id} updated successfully`);
        return new Response(
          JSON.stringify({ task }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // DELETE - Delete a task
      if (action === "delete") {
        const id = (body.id || body.task_id) as string;
        const comment = body.comment as string | undefined;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Task ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: existingTask } = await supabase
          .from("tasks")
          .select("title")
          .eq("id", id)
          .single();

        console.log(`Deleting task: ${id}`);

        await logActivity(
          supabase,
          null,
          "task_deleted",
          { task_id: id, title: existingTask?.title },
          comment as string
        );

        const { error } = await supabase.from("tasks").delete().eq("id", id);

        if (error) {
          console.error("Error deleting task:", error);
          return new Response(
            JSON.stringify({ error: "Failed to delete task" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Task ${id} deleted successfully`);
        return new Response(
          JSON.stringify({ success: true, id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Unknown task action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ TASK MANAGEMENT (Original HTTP-method endpoints - backward compat) ============
    // Only run for legacy requests without a request_type
    if (!requestType) {
    // Fetch board columns for mapping
    const { data: columns, error: columnsError } = await supabase
      .from("board_columns")
      .select("id, name");

    if (columnsError) {
      console.error("Error fetching columns:", columnsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch board columns" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper to resolve column name to ID
    const resolveColumnId = (columnName?: string): string | null => {
      if (!columnName) return null;
      const normalizedName = columnMapping[columnName.toLowerCase()] || columnName;
      const column = columns?.find(
        (c) => c.name.toLowerCase() === normalizedName.toLowerCase()
      );
      return column?.id || null;
    };

    // Helper to get column name from ID
    const getColumnName = (columnId: string): string => {
      const column = columns?.find((c) => c.id === columnId);
      return column?.name || "Unknown";
    };

    // GET - List all tasks
    if (req.method === "GET") {
      console.log("Fetching all tasks");
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          subtasks(*),
          board_column:board_columns(id, name, color),
          task_budgets(*),
          task_assignees(*, user:users(id, name, email))
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch tasks" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Fetched ${tasks?.length || 0} tasks`);
      return new Response(
        JSON.stringify({ tasks, columns }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST - Create a task
    if (req.method === "POST") {
      const { title, description, column, priority, due_date, estimated_cost, comment } = body;

      if (!title || typeof title !== "string" || (title as string).trim() === "") {
        return new Response(
          JSON.stringify({ error: "Title is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate priority if provided
      const taskPriority = priority && validPriorities.includes(priority as string) 
        ? priority as string 
        : "Medium";

      // Resolve column - default to "To Do" if not specified
      let columnId = resolveColumnId(column as string);
      if (!columnId) {
        const todoColumn = columns?.find((c) => c.name === "To Do");
        columnId = todoColumn?.id || null;
      }

      console.log(`Creating task: "${title}" in column: ${column || "To Do"} with priority: ${taskPriority}`);

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          title: (title as string).trim(),
          description: (description as string)?.trim() || null,
          board_column_id: columnId,
          priority: taskPriority,
          due_date: due_date || null,
          position: 0,
          created_by_bujji: true,
        })
        .select(`
          *,
          board_column:board_columns(id, name, color)
        `)
        .single();

      if (error) {
        console.error("Error creating task:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create task" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log activity
      await logActivity(
        supabase,
        task.id,
        "task_created",
        { title: task.title, column: getColumnName(columnId!), priority: taskPriority },
        comment as string
      );

      // Create budget if estimated cost provided
      if (estimated_cost !== undefined && estimated_cost !== null) {
        await supabase.from("task_budgets").insert({
          task_id: task.id,
          estimated_cost: estimated_cost,
        });
      }

      console.log(`Task created with ID: ${task.id}`);
      return new Response(
        JSON.stringify({ task }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PATCH - Update a task
    if (req.method === "PATCH") {
      const { id, title, description, column, priority, due_date, estimated_cost, actual_cost, comment } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: "Task ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch existing task for comparison
      const { data: existingTask } = await supabase
        .from("tasks")
        .select("*, board_column:board_columns(id, name)")
        .eq("id", id)
        .single();

      const updates: Record<string, unknown> = {};
      const actionDetails: Record<string, unknown> = {};

      if (title !== undefined) {
        updates.title = (title as string).trim();
        actionDetails.title = { from: existingTask?.title, to: (title as string).trim() };
      }
      if (description !== undefined) {
        updates.description = (description as string)?.trim() || null;
        actionDetails.description = "updated";
      }
      if (priority !== undefined) {
        if (validPriorities.includes(priority as string)) {
          updates.priority = priority;
          actionDetails.priority = { from: existingTask?.priority, to: priority };
        }
      }
      if (due_date !== undefined) {
        updates.due_date = due_date;
        actionDetails.due_date = { from: existingTask?.due_date, to: due_date };
      }
      if (column !== undefined) {
        const columnId = resolveColumnId(column as string);
        if (columnId) {
          updates.board_column_id = columnId;
          actionDetails.column = { 
            from: existingTask?.board_column?.name, 
            to: getColumnName(columnId) 
          };
        } else {
          return new Response(
            JSON.stringify({ error: `Invalid column name: ${column}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      console.log(`Updating task ${id}:`, updates);

      const { data: task, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          board_column:board_columns(id, name, color)
        `)
        .single();

      if (error) {
        console.error("Error updating task:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update task" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Determine action type based on changes
      let actionType = "task_updated";
      if (actionDetails.column) {
        actionType = "task_moved";
      }

      // Log activity
      await logActivity(supabase, id as string, actionType, actionDetails, comment as string);

      // Update budget if cost values provided
      if (estimated_cost !== undefined || actual_cost !== undefined) {
        const { data: existingBudget } = await supabase
          .from("task_budgets")
          .select("id")
          .eq("task_id", id)
          .maybeSingle();

        if (existingBudget) {
          const budgetUpdates: Record<string, unknown> = {};
          if (estimated_cost !== undefined) budgetUpdates.estimated_cost = estimated_cost;
          if (actual_cost !== undefined) budgetUpdates.actual_cost = actual_cost;
          await supabase.from("task_budgets").update(budgetUpdates).eq("task_id", id);
        } else {
          await supabase.from("task_budgets").insert({
            task_id: id,
            estimated_cost: estimated_cost || null,
            actual_cost: actual_cost || null,
          });
        }
      }

      console.log(`Task ${id} updated successfully`);
      return new Response(
        JSON.stringify({ task }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE - Delete a task
    if (req.method === "DELETE") {
      const { id, comment } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: "Task ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch task title before deletion for logging
      const { data: existingTask } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", id)
        .single();

      console.log(`Deleting task: ${id}`);

      // Log activity before deletion (task_id will be null after deletion)
      await logActivity(
        supabase,
        null,
        "task_deleted",
        { task_id: id, title: existingTask?.title },
        comment as string
      );

      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) {
        console.error("Error deleting task:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete task" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Task ${id} deleted successfully`);
      return new Response(
        JSON.stringify({ success: true, id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    } // end legacy task management guard

    // ============ IDENTITY FILE MANAGEMENT ============
    if (requestType === "identity") {
      const action = body.action as string;
      console.log(`Handling identity action: ${action}`);

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // READ identity file
      if (action === "read") {
        const fileKey = body.file_key as string;
        if (!fileKey) {
          return new Response(
            JSON.stringify({ error: "file_key is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("identity_files")
          .select("*")
          .eq("user_id", userId)
          .eq("file_key", fileKey);

        // Filter by agent_id if provided
        let filteredData = data;
        const reqAgentId = body.agent_id as string | undefined;
        if (reqAgentId && filteredData) {
          filteredData = filteredData.filter((f: Record<string, unknown>) => f.agent_id === reqAgentId);
        } else if (!reqAgentId && filteredData) {
          filteredData = filteredData.filter((f: Record<string, unknown>) => f.agent_id === agentId || f.agent_id === null);
        }
        const fileResult = filteredData && filteredData.length > 0 ? filteredData[0] : null;

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to read identity file" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ file: fileResult || { file_key: fileKey, content: "", updated_by: "none" } }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // UPDATE identity file (upsert)
      if (action === "update") {
        const fileKey = body.file_key as string;
        const content = body.content as string;
        if (!fileKey) {
          return new Response(
            JSON.stringify({ error: "file_key is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const identityAgentId = (body.agent_id as string) || agentId || null;
        const { data, error } = await supabase
          .from("identity_files")
          .upsert(
            {
              user_id: userId,
              file_key: fileKey,
              content: content || "",
              updated_by: logAgentName,
              updated_at: new Date().toISOString(),
              agent_id: identityAgentId,
            },
            { onConflict: "user_id,agent_id,file_key" }
          )
          .select()
          .single();

        if (error) {
          console.error("Error updating identity file:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update identity file" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Identity file ${fileKey} updated by ${logAgentName}`);
        return new Response(
          JSON.stringify({ file: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // READ daily log
      if (action === "read_daily_log") {
        const date = body.date as string;
        if (!date) {
          return new Response(
            JSON.stringify({ error: "date is required (YYYY-MM-DD)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let logQuery = supabase
          .from("daily_memory_logs")
          .select("*")
          .eq("user_id", userId)
          .eq("log_date", date);

        const logAgentId = (body.agent_id as string) || agentId || null;
        if (logAgentId) {
          logQuery = logQuery.eq("agent_id", logAgentId);
        } else {
          logQuery = logQuery.is("agent_id", null);
        }

        const { data, error } = await logQuery.maybeSingle();

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to read daily log" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ log: data || { log_date: date, content: "", updated_by: "none" } }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // WRITE daily log (upsert)
      if (action === "write_daily_log") {
        const date = body.date as string;
        const content = body.content as string;
        if (!date) {
          return new Response(
            JSON.stringify({ error: "date is required (YYYY-MM-DD)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const writeAgentId = (body.agent_id as string) || agentId || null;
        const { data, error } = await supabase
          .from("daily_memory_logs")
          .upsert(
            {
              user_id: userId,
              log_date: date,
              content: content || "",
              updated_by: logAgentName,
              updated_at: new Date().toISOString(),
              agent_id: writeAgentId,
            },
            { onConflict: "user_id,agent_id,log_date" }
          )
          .select()
          .single();

        if (error) {
          console.error("Error writing daily log:", error);
          return new Response(
            JSON.stringify({ error: "Failed to write daily log" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Daily log for ${date} written by ${logAgentName}`);
        return new Response(
          JSON.stringify({ log: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // LIST all identity files
      if (action === "list") {
        let listQuery = supabase
          .from("identity_files")
          .select("*")
          .eq("user_id", userId)
          .order("file_key");
        
        const listAgentId = (body.agent_id as string) || agentId || null;
        if (listAgentId) {
          listQuery = listQuery.eq("agent_id", listAgentId);
        } else {
          listQuery = listQuery.is("agent_id", null);
        }

        const { data, error } = await listQuery;

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to list identity files" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ files: data || [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Unknown identity action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ ARENA SCOREBOARD MANAGEMENT ============
    if (requestType === "arena") {
      const action = body.action as string;
      console.log(`Handling arena action: ${action}`);

      // CONFIGURE - Set up or update scoreboard
      if (action === "configure") {
        const { office_id, primary_metric_name, primary_metric_unit, categories } = body;
        if (!office_id) {
          return new Response(
            JSON.stringify({ error: "office_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Upsert scoreboard
        const { data: scoreboard, error: sbError } = await supabase
          .from("arena_scoreboards")
          .upsert({
            office_id,
            primary_metric_name: primary_metric_name || "Score",
            primary_metric_unit: primary_metric_unit || "pts",
            updated_at: new Date().toISOString(),
          }, { onConflict: "office_id" })
          .select()
          .single();

        if (sbError) {
          return new Response(
            JSON.stringify({ error: "Failed to configure scoreboard", detail: sbError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If categories provided, replace them
        if (Array.isArray(categories) && categories.length > 0) {
          // Delete existing
          await supabase.from("arena_score_categories").delete().eq("scoreboard_id", scoreboard.id);

          // Insert new
          const catRows = categories.map((cat: { name: string; is_primary?: boolean }, i: number) => ({
            scoreboard_id: scoreboard.id,
            name: cat.name,
            is_primary: cat.is_primary || false,
            position: i,
          }));

          const { error: catError } = await supabase.from("arena_score_categories").insert(catRows);
          if (catError) {
            return new Response(
              JSON.stringify({ error: "Failed to create categories", detail: catError.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        return new Response(
          JSON.stringify({ scoreboard }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ADD_SCORE - Add a score entry
      if (action === "add_score") {
        const { office_id, category, agent_name, value, metadata: scoreMeta } = body;
        if (!office_id || !category || !agent_name || value === undefined) {
          return new Response(
            JSON.stringify({ error: "office_id, category, agent_name, and value are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find category by name
        const { data: sb } = await supabase
          .from("arena_scoreboards")
          .select("id")
          .eq("office_id", office_id)
          .single();

        if (!sb) {
          return new Response(
            JSON.stringify({ error: "No scoreboard found for this office" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: cat } = await supabase
          .from("arena_score_categories")
          .select("id, is_primary")
          .eq("scoreboard_id", sb.id)
          .eq("name", category)
          .single();

        if (!cat) {
          return new Response(
            JSON.stringify({ error: `Category '${category}' not found` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: score, error: scoreError } = await supabase
          .from("arena_scores")
          .insert({
            category_id: cat.id,
            agent_name,
            value,
            metadata: scoreMeta || {},
          })
          .select()
          .single();

        if (scoreError) {
          return new Response(
            JSON.stringify({ error: "Failed to add score", detail: scoreError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ score, is_primary: cat.is_primary }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // GET_SCORES - Retrieve current scores
      if (action === "get_scores") {
        const { office_id } = body;
        if (!office_id) {
          return new Response(
            JSON.stringify({ error: "office_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: sb } = await supabase
          .from("arena_scoreboards")
          .select("*, arena_score_categories(*, arena_scores(*))")
          .eq("office_id", office_id)
          .single();

        return new Response(
          JSON.stringify({ scoreboard: sb }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Unknown arena action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ AGENT SELF-IDENTITY ============
    if (requestType === "ai_agent" || requestType === "agent") {
      const action = body.action as string;
      console.log(`Handling ai_agent action: ${action}`);

      // GET own agent row
      if (action === "get") {
        if (!agentId) {
          return new Response(
            JSON.stringify({ error: "No agent resolved from webhook secret" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data, error } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("id", agentId)
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to get agent" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ agent: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // UPDATE own agent row
      if (action === "update") {
        if (!agentId) {
          return new Response(
            JSON.stringify({ error: "No agent resolved from webhook secret" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: Record<string, unknown> = {};
        if (body.name) updates.name = body.name;
        if (body.description !== undefined) updates.description = body.description;
        if (body.avatar_color) updates.avatar_color = body.avatar_color;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from("ai_agents")
          .update(updates)
          .eq("id", agentId)
          .select()
          .single();

        if (error) {
          console.error("Error updating agent:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update agent" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Agent ${agentId} updated: ${JSON.stringify(updates)}`);
        return new Response(
          JSON.stringify({ agent: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // LIST all agents for user
      if (action === "list") {
        const { data, error } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("user_id", userId)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true });

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to list agents" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ agents: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Unknown ai_agent action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ OPS CENTER V2 ============
    if (requestType === "ops") {
      const action = body.action as string;
      console.log(`Handling ops V2 action: ${action}`);

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "User ID required for ops actions" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const jsonRes = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // ---- APP ACTIONS ----
      if (action === "list_apps") {
        const { data, error } = await supabase.from("ops_apps").select("*").eq("user_id", userId).order("created_at", { ascending: true });
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ apps: data });
      }

      if (action === "create_app") {
        const { data, error } = await supabase.from("ops_apps").insert({
          name: body.name as string,
          title: body.title as string,
          description: (body.description as string) || null,
          icon: (body.icon as string) || "monitor",
          status: (body.status as string) || "active",
          agent_name: (body.agent_name as string) || null,
          agent_type: (body.agent_type as string) || null,
          theme: body.theme || { accent: "#ef4444", style: "default" },
          config: body.config || {},
          user_id: userId,
        }).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ app: data });
      }

      if (action === "get_app") {
        const filter = body.app_id ? { col: "id", val: body.app_id as string } : { col: "name", val: body.name as string };
        const { data: app, error } = await supabase.from("ops_apps").select("*").eq(filter.col, filter.val).eq("user_id", userId).single();
        if (error) return jsonRes({ error: error.message }, 404);
        const { data: pages } = await supabase.from("ops_pages").select("*, ops_blocks(*)").eq("app_id", app.id).order("sort_order");
        return jsonRes({ app, pages: pages || [] });
      }

      if (action === "update_app") {
        const updates: Record<string, unknown> = {};
        for (const k of ["title", "description", "icon", "status", "agent_name", "agent_type", "theme", "config", "page_order"]) {
          if (body[k] !== undefined) updates[k] = body[k];
        }
        const { data, error } = await supabase.from("ops_apps").update(updates).eq("id", body.app_id as string).eq("user_id", userId).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ app: data });
      }

      if (action === "delete_app") {
        const { error } = await supabase.from("ops_apps").delete().eq("id", body.app_id as string).eq("user_id", userId);
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ success: true });
      }

      // ---- PAGE ACTIONS ----
      if (action === "create_page") {
        const { data, error } = await supabase.from("ops_pages").insert({
          app_id: body.app_id as string,
          name: body.name as string,
          title: body.title as string,
          icon: (body.icon as string) || "file",
          sort_order: (body.sort_order as number) ?? 0,
          layout: (body.layout as string) || "stack",
          config: body.config || {},
        }).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ page: data });
      }

      if (action === "update_page") {
        const updates: Record<string, unknown> = {};
        for (const k of ["name", "title", "icon", "sort_order", "layout", "config"]) {
          if (body[k] !== undefined) updates[k] = body[k];
        }
        const { data, error } = await supabase.from("ops_pages").update(updates).eq("id", body.page_id as string).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ page: data });
      }

      if (action === "delete_page") {
        const { error } = await supabase.from("ops_pages").delete().eq("id", body.page_id as string);
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ success: true });
      }

      if (action === "reorder_pages") {
        const pageIds = body.page_ids as string[];
        for (let i = 0; i < pageIds.length; i++) {
          await supabase.from("ops_pages").update({ sort_order: i }).eq("id", pageIds[i]);
        }
        return jsonRes({ success: true });
      }

      // ---- BLOCK ACTIONS ----
      if (action === "add_block") {
        const { data, error } = await supabase.from("ops_blocks").insert({
          page_id: body.page_id as string,
          block_type: body.block_type as string,
          title: (body.title as string) || null,
          sort_order: (body.sort_order as number) ?? 0,
          config: body.config || {},
        }).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ block: data });
      }

      if (action === "update_block") {
        const updates: Record<string, unknown> = {};
        for (const k of ["block_type", "title", "sort_order", "config"]) {
          if (body[k] !== undefined) updates[k] = body[k];
        }
        const { data, error } = await supabase.from("ops_blocks").update(updates).eq("id", body.block_id as string).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ block: data });
      }

      if (action === "remove_block") {
        const { error } = await supabase.from("ops_blocks").delete().eq("id", body.block_id as string);
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ success: true });
      }

      if (action === "reorder_blocks") {
        const blockIds = body.block_ids as string[];
        for (let i = 0; i < blockIds.length; i++) {
          await supabase.from("ops_blocks").update({ sort_order: i }).eq("id", blockIds[i]);
        }
        return jsonRes({ success: true });
      }

      // ---- DATA ACTIONS ----
      if (action === "add_data") {
        const { data, error } = await supabase.from("ops_data").insert({
          app_id: body.app_id as string,
          block_id: (body.block_id as string) || null,
          item_type: body.item_type as string,
          title: body.title as string,
          description: (body.description as string) || null,
          status: (body.status as string) || "active",
          column_id: (body.column_id as string) || null,
          sort_order: (body.sort_order as number) ?? 0,
          data: body.data || {},
          metadata: body.metadata || {},
          user_id: userId,
        }).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ item: data });
      }

      if (action === "update_data") {
        const updates: Record<string, unknown> = {};
        for (const k of ["title", "description", "status", "column_id", "sort_order", "data", "metadata", "block_id", "item_type"]) {
          if (body[k] !== undefined) updates[k] = body[k];
        }
        const { data, error } = await supabase.from("ops_data").update(updates).eq("id", body.data_id as string).eq("user_id", userId).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ item: data });
      }

      if (action === "move_data") {
        const updates: Record<string, unknown> = {};
        if (body.column_id !== undefined) updates.column_id = body.column_id;
        if (body.status !== undefined) updates.status = body.status;
        if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
        const { data, error } = await supabase.from("ops_data").update(updates).eq("id", body.data_id as string).eq("user_id", userId).select().single();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ item: data });
      }

      if (action === "delete_data") {
        const { error } = await supabase.from("ops_data").delete().eq("id", body.data_id as string).eq("user_id", userId);
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ success: true });
      }

      if (action === "list_data") {
        if (body.limit) {
          let query = supabase.from("ops_data").select("*").eq("app_id", body.app_id as string).eq("user_id", userId).order("sort_order").order("created_at", { ascending: false }).limit(body.limit as number);
          if (body.block_id) query = query.eq("block_id", body.block_id as string);
          if (body.item_type) query = query.eq("item_type", body.item_type as string);
          if (body.status) query = query.eq("status", body.status as string);
          if (body.column_id) query = query.eq("column_id", body.column_id as string);
          const { data, error } = await query;
          if (error) return jsonRes({ error: error.message }, 500);
          return jsonRes({ items: data });
        }
        const allItems: unknown[] = [];
        let offset = 0;
        const batchSize = 1000;
        while (true) {
          let query = supabase.from("ops_data").select("*").eq("app_id", body.app_id as string).eq("user_id", userId).order("sort_order").order("created_at", { ascending: false }).range(offset, offset + batchSize - 1);
          if (body.block_id) query = query.eq("block_id", body.block_id as string);
          if (body.item_type) query = query.eq("item_type", body.item_type as string);
          if (body.status) query = query.eq("status", body.status as string);
          if (body.column_id) query = query.eq("column_id", body.column_id as string);
          const { data, error } = await query;
          if (error) return jsonRes({ error: error.message }, 500);
          if (!data || data.length === 0) break;
          allItems.push(...data);
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        return jsonRes({ items: allItems });
      }

      if (action === "bulk_add_data") {
        const items = (body.items as Record<string, unknown>[]).map(item => ({
          app_id: body.app_id as string,
          block_id: (item.block_id as string) || null,
          item_type: item.item_type as string,
          title: item.title as string,
          description: (item.description as string) || null,
          status: (item.status as string) || "active",
          column_id: (item.column_id as string) || null,
          sort_order: (item.sort_order as number) ?? 0,
          data: item.data || {},
          metadata: item.metadata || {},
          user_id: userId,
        }));
        const { data, error } = await supabase.from("ops_data").insert(items).select();
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ items: data });
      }

      return jsonRes({ error: `Unknown ops action: ${action}` }, 400);
    }

    // ── Intelligence data access (read-only) ──────────────────────────
    if (requestType === "intelligence") {
      const action = body.action as string;
      const jsonRes = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!userId) return jsonRes({ error: "User ID required" }, 400);
      if (!action) return jsonRes({ error: "Missing action" }, 400);

      if (action === "list_ideas") {
        let q = supabase.from("intelligence_ideas").select("*")
          .eq("user_id", userId).order("priority", { ascending: false });
        if (body.status) q = q.eq("status", body.status as string);
        if (body.workspace_id) q = q.eq("workspace_id", body.workspace_id as string);
        if (body.is_banger !== undefined) q = q.eq("is_banger", body.is_banger as boolean);
        if (body.limit) q = q.limit(body.limit as number);
        const { data, error } = await q;
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ items: data, count: data?.length ?? 0 });
      }

      if (action === "list_competitors") {
        let q = supabase.from("intelligence_competitors").select("*")
          .eq("user_id", userId).order("subscriber_count", { ascending: false });
        if (body.workspace_id) q = q.eq("workspace_id", body.workspace_id as string);
        if (body.limit) q = q.limit(body.limit as number);
        const { data, error } = await q;
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ items: data, count: data?.length ?? 0 });
      }

      if (action === "list_videos") {
        let q = supabase.from("intelligence_videos").select("*")
          .eq("user_id", userId).order("view_count", { ascending: false });
        if (body.workspace_id) q = q.eq("workspace_id", body.workspace_id as string);
        if (body.is_outlier !== undefined) q = q.eq("is_outlier", body.is_outlier as boolean);
        if (body.limit) q = q.limit(body.limit as number);
        const { data, error } = await q;
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ items: data, count: data?.length ?? 0 });
      }

      if (action === "list_scripts") {
        let q = supabase.from("intelligence_scripts").select("*")
          .eq("user_id", userId).order("created_at", { ascending: false });
        if (body.workspace_id) q = q.eq("workspace_id", body.workspace_id as string);
        if (body.status) q = q.eq("status", body.status as string);
        if (body.limit) q = q.limit(body.limit as number);
        const { data, error } = await q;
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ items: data, count: data?.length ?? 0 });
      }

      if (action === "list_digests") {
        let q = supabase.from("intelligence_digests").select("*")
          .eq("user_id", userId).order("digest_date", { ascending: false });
        if (body.workspace_id) q = q.eq("workspace_id", body.workspace_id as string);
        if (body.limit) q = q.limit(body.limit as number);
        const { data, error } = await q;
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ items: data, count: data?.length ?? 0 });
      }

      if (action === "list_insights") {
        let q = supabase.from("intelligence_insights").select("*")
          .eq("user_id", userId).order("created_at", { ascending: false });
        if (body.workspace_id) q = q.eq("workspace_id", body.workspace_id as string);
        if (body.priority) q = q.eq("priority", body.priority as string);
        if (body.limit) q = q.limit(body.limit as number);
        const { data, error } = await q;
        if (error) return jsonRes({ error: error.message }, 500);
        return jsonRes({ items: data, count: data?.length ?? 0 });
      }

      return jsonRes({ error: `Unknown intelligence action: ${action}` }, 400);
    }

    // ── Automations Agent API ────────────────────────────────────────
    if (requestType === "automation") {
      const action = body.action as string;
      const autoRes = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      if (!action) return autoRes({ error: "Missing action" }, 400);

      if (action === "create") {
        if (!body.name || !body.cron_expression) return autoRes({ error: "name and cron_expression required" }, 400);
        const insertPayload: Record<string, unknown> = {
          name: body.name,
          cron_expression: body.cron_expression,
          prompt: body.prompt || "",
          description: body.description || null,
          timezone: body.timezone || "America/Vancouver",
          function_name: body.function_name || null,
          function_config: body.function_config || {},
          channels: body.channels || [],
          tags: body.tags || [],
          enabled: body.enabled !== undefined ? body.enabled : false,
          created_by: "agent",
          agent_name: (body.agent_name as string) || logAgentName,
          ...(userId ? { user_id: userId } : {}),
        };
        const { data, error } = await supabase.from("automations").insert(insertPayload).select().single();
        if (error) return autoRes({ error: error.message }, 500);
        return autoRes({ automation: data });
      }

      if (action === "update") {
        if (!body.automation_id) return autoRes({ error: "automation_id required" }, 400);
        const updates: Record<string, unknown> = {};
        for (const key of ["name", "description", "cron_expression", "timezone", "prompt", "function_name", "function_config", "channels", "tags", "enabled", "model", "max_turns", "timeout_seconds"]) {
          if (body[key] !== undefined) updates[key] = body[key];
        }
        const { data, error } = await supabase.from("automations").update(updates).eq("id", body.automation_id).select().single();
        if (error) return autoRes({ error: error.message }, 500);
        return autoRes({ automation: data });
      }

      if (action === "delete") {
        if (!body.automation_id) return autoRes({ error: "automation_id required" }, 400);
        const { error } = await supabase.from("automations").delete().eq("id", body.automation_id);
        if (error) return autoRes({ error: error.message }, 500);
        return autoRes({ success: true });
      }

      if (action === "list") {
        let q = supabase.from("automations").select("*").order("next_run_at", { ascending: true, nullsFirst: false });
        if (userId) q = q.eq("user_id", userId);
        if (body.enabled !== undefined) q = q.eq("enabled", body.enabled);
        if (body.tags) q = q.contains("tags", body.tags as string[]);
        const { data, error } = await q;
        if (error) return autoRes({ error: error.message }, 500);
        return autoRes({ automations: data });
      }

      if (action === "get") {
        if (!body.automation_id) return autoRes({ error: "automation_id required" }, 400);
        const { data: auto, error } = await supabase.from("automations").select("*").eq("id", body.automation_id).single();
        if (error) return autoRes({ error: error.message }, 500);
        const { data: runs } = await supabase.from("automation_executions").select("*")
          .eq("automation_id", body.automation_id).order("started_at", { ascending: false }).limit(5);
        return autoRes({ automation: { ...auto, recent_runs: runs || [] } });
      }

      if (action === "enable") {
        if (!body.automation_id) return autoRes({ error: "automation_id required" }, 400);
        const { data, error } = await supabase.from("automations").update({ enabled: true }).eq("id", body.automation_id).select().single();
        if (error) return autoRes({ error: error.message }, 500);
        return autoRes({ automation: data });
      }

      if (action === "disable") {
        if (!body.automation_id) return autoRes({ error: "automation_id required" }, 400);
        const { data, error } = await supabase.from("automations").update({ enabled: false }).eq("id", body.automation_id).select().single();
        if (error) return autoRes({ error: error.message }, 500);
        return autoRes({ automation: data });
      }

      if (action === "trigger") {
        if (!body.automation_id) return autoRes({ error: "automation_id required" }, 400);
        const agentName = (body.agent_name as string) || logAgentName;
        // Insert running execution
        const { data: exec, error: execErr } = await supabase.from("automation_executions").insert({
          automation_id: body.automation_id,
          status: "running",
          trigger_source: "agent",
          triggered_by: agentName,
        }).select().single();
        if (execErr) return autoRes({ error: execErr.message }, 500);
        // Fire automation-runner async
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        fetch(`${supabaseUrl}/functions/v1/automation-runner`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${svcKey}` },
          body: JSON.stringify({ automation_id: body.automation_id }),
        }).catch(e => console.error("Async trigger failed:", e));
        return autoRes({ execution: exec });
      }

      if (action === "list_runs") {
        if (!body.automation_id) return autoRes({ error: "automation_id required" }, 400);
        const limit = (body.limit as number) || 25;
        const { data, error } = await supabase.from("automation_executions").select("*")
          .eq("automation_id", body.automation_id).order("started_at", { ascending: false }).limit(limit);
        if (error) return autoRes({ error: error.message }, 500);
        return autoRes({ executions: data });
      }

      return autoRes({ error: `Unknown automation action: ${action}` }, 400);
    }

    // ── Memory injections ─────────────────────────────────────────────
    if (requestType === "memory") {
      const action = body.action as string;
      const memRes = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      if (!userId) return memRes({ error: "User ID required" }, 400);
      if (!action) return memRes({ error: "Missing action" }, 400);

      if (action === "list") {
        let q = supabase.from("memory_injections").select("*")
          .eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
        if (body.status) q = q.eq("status", body.status as string);
        const { data, error } = await q;
        if (error) return memRes({ error: error.message }, 500);
        return memRes({ items: data, count: data?.length ?? 0 });
      }

      if (action === "get") {
        if (!body.memory_id) return memRes({ error: "memory_id is required" }, 400);
        const { data, error } = await supabase.from("memory_injections").select("*")
          .eq("id", body.memory_id as string).eq("user_id", userId).single();
        if (error) return memRes({ error: error.message }, 500);
        return memRes({ item: data });
      }

      if (action === "submit") {
        if (!body.content) return memRes({ error: "content is required" }, 400);
        const content = body.content as string;

        const { data: memoryData, error: memoryError } = await supabase
          .from("memory_injections")
          .insert({ user_id: userId, content, status: "pending", submitted_at: new Date().toISOString() })
          .select().single();
        if (memoryError) return memRes({ error: memoryError.message }, 500);

        const logMessage = `🧠 Memory Injection Request\n\nMani wants to add this to memory, and this is important context.\n\n---\n${content}\n---\n\nIf you understood that, ask him for approval.`;
        const { error: logError } = await supabase.from("ai_log").insert({
          message: logMessage, category: "observation", is_read: false,
          user_id: userId, agent_name: logAgentName, agent_emoji: logAgentEmoji,
        });
        if (logError) console.error("Failed to create ai_log for memory:", logError.message);

        const contentPreview = content.length > 100 ? content.substring(0, 100) + "..." : content;
        const { error: questionError } = await supabase.from("ai_questions").insert({
          question: "Confirm memory injection?",
          context: JSON.stringify({ memory_id: memoryData.id, content_preview: contentPreview }),
          question_type: "approval", priority: "normal", status: "pending",
          user_id: userId, agent_name: logAgentName, agent_emoji: logAgentEmoji,
        });
        if (questionError) console.error("Failed to create ai_question for memory:", questionError.message);

        return memRes({ memory_injection: memoryData, success: true });
      }

      if (action === "approve") {
        if (!body.memory_id) return memRes({ error: "memory_id is required" }, 400);
        const { data, error } = await supabase.from("memory_injections")
          .update({ status: "approved", reviewed_at: new Date().toISOString() })
          .eq("id", body.memory_id as string).eq("user_id", userId).select().single();
        if (error) return memRes({ error: error.message }, 500);
        return memRes({ item: data, success: true });
      }

      if (action === "reject") {
        if (!body.memory_id) return memRes({ error: "memory_id is required" }, 400);
        const { data, error } = await supabase.from("memory_injections")
          .update({ status: "rejected", reviewed_at: new Date().toISOString() })
          .eq("id", body.memory_id as string).eq("user_id", userId).select().single();
        if (error) return memRes({ error: error.message }, 500);
        return memRes({ item: data, success: true });
      }

      if (action === "delete") {
        if (!body.memory_id) return memRes({ error: "memory_id is required" }, 400);
        const { error } = await supabase.from("memory_injections")
          .delete().eq("id", body.memory_id as string).eq("user_id", userId);
        if (error) return memRes({ error: error.message }, 500);
        return memRes({ success: true });
      }

      return memRes({ error: `Unknown memory action: ${action}` }, 400);
    }

    // ============ LEARNING LOG (Phase 5: Sherlock Brain) ============
    if (requestType === "learning") {
      const action = body.action as string;
      const learnRes = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      if (!userId) return learnRes({ error: "User ID required" }, 400);
      if (!action) return learnRes({ error: "Missing action" }, 400);

      if (action === "list") {
        let q = supabase.from("agent_learning_log").select("*")
          .eq("user_id", userId).order("created_at", { ascending: false });
        if (body.entry_type) q = q.eq("entry_type", body.entry_type as string);
        if (body.reviewed === true || body.reviewed === false) q = q.eq("reviewed", body.reviewed as boolean);
        if (body.source_automation_id) q = q.eq("source_automation_id", body.source_automation_id as string);
        const limit = (body.limit as number) || 50;
        q = q.limit(limit);
        const { data, error } = await q;
        if (error) return learnRes({ error: error.message }, 500);
        return learnRes({ entries: data, count: data?.length ?? 0 });
      }

      if (action === "get") {
        if (!body.entry_id) return learnRes({ error: "entry_id is required" }, 400);
        const { data, error } = await supabase.from("agent_learning_log").select("*")
          .eq("id", body.entry_id as string).eq("user_id", userId).single();
        if (error) return learnRes({ error: error.message }, 500);
        return learnRes({ entry: data });
      }

      if (action === "review") {
        if (!body.entry_id) return learnRes({ error: "entry_id is required" }, 400);
        if (!body.review_outcome) return learnRes({ error: "review_outcome is required (approved/rejected/modified)" }, 400);
        const { data, error } = await supabase.from("agent_learning_log")
          .update({
            reviewed: true,
            review_outcome: body.review_outcome as string,
            review_notes: (body.review_notes as string) || null,
          })
          .eq("id", body.entry_id as string).eq("user_id", userId).select().single();
        if (error) return learnRes({ error: error.message }, 500);
        return learnRes({ entry: data, success: true });
      }

      if (action === "stats") {
        // Summary stats for the learning log
        const { data: allEntries, error } = await supabase.from("agent_learning_log")
          .select("entry_type, action_taken, reviewed, review_outcome, created_at")
          .eq("user_id", userId);
        if (error) return learnRes({ error: error.message }, 500);

        const entries = allEntries || [];
        const byType: Record<string, number> = {};
        let actionsTotal = 0;
        let reviewedTotal = 0;
        let approvedTotal = 0;
        for (const e of entries) {
          byType[e.entry_type] = (byType[e.entry_type] || 0) + 1;
          if (e.action_taken) actionsTotal++;
          if (e.reviewed) {
            reviewedTotal++;
            if (e.review_outcome === "approved") approvedTotal++;
          }
        }

        return learnRes({
          total_entries: entries.length,
          by_type: byType,
          actions_taken: actionsTotal,
          reviewed: reviewedTotal,
          approved: approvedTotal,
          unreviewed: entries.length - reviewedTotal,
        });
      }

      return learnRes({ error: `Unknown learning action: ${action}` }, 400);
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
