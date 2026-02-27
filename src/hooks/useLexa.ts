import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CallRecord, Campaign, DailyMetric, LexaLead } from "@/types/lexa";

// ── Millis AI proxy helper ──────────────────────────────────────────────────
export async function millisProxy<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("millis-proxy", {
    body: { method, path, body: body || null },
  });
  if (error) throw new Error(error.message);
  return data as T;
}

// ── Call Records ────────────────────────────────────────────────────────────
export function useCalls(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  callType?: string;
  sentiment?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["lexa-calls", options],
    queryFn: async () => {
      let query = supabase
        .from("lexa_calls")
        .select("*", { count: "exact" });

      if (options?.status) query = query.eq("call_status", options.status);
      if (options?.callType) query = query.eq("call_type", options.callType);
      if (options?.sentiment) query = query.eq("sentiment", options.sentiment);
      if (options?.search) {
        query = query.or(
          `caller_number.ilike.%${options.search}%,summary.ilike.%${options.search}%,session_id.ilike.%${options.search}%`
        );
      }

      const sortCol = options?.sortBy || "created_at";
      const sortDir = options?.sortDir || "desc";
      query = query.order(sortCol, { ascending: sortDir === "asc" });

      const limit = options?.limit || 25;
      const offset = options?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { calls: (data || []) as CallRecord[], total: count || 0 };
    },
    staleTime: 30_000,
  });
}

export function useCallDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["lexa-call-detail", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from("lexa_calls")
        .select("*")
        .eq("session_id", sessionId)
        .single();
      if (error) throw error;
      return data as CallRecord;
    },
    enabled: !!sessionId,
  });
}

// ── Daily Metrics ───────────────────────────────────────────────────────────
export function useDailyMetrics(days: number = 30) {
  return useQuery({
    queryKey: ["lexa-daily-metrics", days],
    queryFn: async () => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const { data, error } = await supabase
        .from("lexa_daily_metrics")
        .select("*")
        .gte("date", fromDate.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as DailyMetric[];
    },
    staleTime: 60_000,
  });
}

// ── Campaigns ───────────────────────────────────────────────────────────────
export function useCampaigns() {
  return useQuery({
    queryKey: ["lexa-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lexa_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Campaign[];
    },
    staleTime: 30_000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Partial<Campaign>) => {
      const { data, error } = await supabase
        .from("lexa_campaigns")
        .insert(campaign)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lexa-campaigns"] });
    },
  });
}

// ── Millis AI Direct API (via proxy) ────────────────────────────────────────
export function useMillisCredits() {
  return useQuery({
    queryKey: ["millis-credits"],
    queryFn: async () => {
      return await millisProxy<{ credit_balance?: number }>("GET", "/user/info");
    },
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
}

// ── Aggregate Stats (computed from Supabase data) ───────────────────────────
export function useCallStats() {
  return useQuery({
    queryKey: ["lexa-call-stats"],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("lexa_calls")
        .select("call_status, duration_seconds, total_cost, call_metrics, call_type, sentiment", {
          count: "exact",
        });
      if (error) throw error;
      const calls = data || [];
      const total = count || 0;

      if (total === 0) {
        return { totalCalls: 0, totalMinutes: 0, avgDuration: 0, answerRate: 0, avgLatency: 0, totalCost: 0 };
      }

      const totalDuration = calls.reduce((s, c) => s + Number(c.duration_seconds || 0), 0);
      const answered = calls.filter((c) =>
        ["user-ended", "agent-ended", "api-ended"].includes(c.call_status)
      ).length;
      const latencies = calls
        .map((c: any) => c.call_metrics?.utterance_latency?.avg)
        .filter(Boolean);
      const avgLatency = latencies.length > 0
        ? latencies.reduce((s: number, l: number) => s + l, 0) / latencies.length : 0;
      const totalCost = calls.reduce((s, c) => s + Number(c.total_cost || 0), 0);

      return {
        totalCalls: total,
        totalMinutes: totalDuration / 60,
        avgDuration: totalDuration / total,
        answerRate: (answered / total) * 100,
        avgLatency,
        totalCost,
      };
    },
    staleTime: 30_000,
  });
}

// ── Realtime Subscription ───────────────────────────────────────────────────
export function useCallsRealtime(onNewCall: (call: CallRecord) => void) {
  const channel = supabase
    .channel("lexa-calls-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "lexa_calls" },
      (payload) => { onNewCall(payload.new as CallRecord); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ── Leads ──────────────────────────────────────────────────────────────────
export function useLeads(options?: {
  campaignId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["lexa-leads", options],
    queryFn: async () => {
      let query = supabase
        .from("lexa_leads")
        .select("*", { count: "exact" });

      if (options?.campaignId) query = query.eq("campaign_id", options.campaignId);
      if (options?.status) query = query.eq("status", options.status);
      if (options?.search) {
        query = query.or(
          `name.ilike.%${options.search}%,phone.ilike.%${options.search}%,company.ilike.%${options.search}%,email.ilike.%${options.search}%`
        );
      }

      query = query.order("created_at", { ascending: false });

      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { leads: (data || []) as LexaLead[], total: count || 0 };
    },
    staleTime: 15_000,
  });
}

export function useCreateLeadsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leads: Partial<LexaLead>[]) => {
      // Batch insert in chunks of 100
      const chunks: Partial<LexaLead>[][] = [];
      for (let i = 0; i < leads.length; i += 100) {
        chunks.push(leads.slice(i, i + 100));
      }
      let inserted = 0;
      for (const chunk of chunks) {
        const { error } = await supabase.from("lexa_leads").insert(chunk);
        if (error) throw error;
        inserted += chunk.length;
      }
      return { inserted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lexa-leads"] });
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { data, error } = await supabase
        .from("lexa_leads")
        .update({ status })
        .eq("id", leadId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lexa-leads"] });
    },
  });
}

export function useLaunchCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      // Update campaign status to running
      const { error: updateErr } = await supabase
        .from("lexa_campaigns")
        .update({ status: "running" })
        .eq("id", campaignId);
      if (updateErr) throw updateErr;

      // Invoke the campaign runner edge function
      const { data, error } = await supabase.functions.invoke("lexa-campaign-runner", {
        body: { campaign_id: campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lexa-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["lexa-leads"] });
    },
  });
}

export function useLeadsRealtime(onUpdate: (lead: LexaLead) => void) {
  const channel = supabase
    .channel("lexa-leads-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "lexa_leads" },
      (payload) => { onUpdate(payload.new as LexaLead); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
