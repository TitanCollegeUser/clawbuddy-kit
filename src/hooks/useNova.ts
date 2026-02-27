import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  NovaTemplate,
  NovaEmail,
  NovaSequence,
  NovaCampaign,
  NovaDailyMetric,
} from "@/types/nova";
import { toast } from "sonner";

// ── Templates ───────────────────────────────────────────────────────────────
export function useTemplates() {
  return useQuery({
    queryKey: ["nova-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nova_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NovaTemplate[];
    },
    staleTime: 30_000,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<NovaTemplate>) => {
      const { data, error } = await supabase
        .from("nova_templates")
        .insert([t as any])
        .select()
        .single();
      if (error) throw error;
      return data as unknown as NovaTemplate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nova-templates"] });
      toast.success("Template created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<NovaTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("nova_templates")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as NovaTemplate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nova-templates"] });
      toast.success("Template updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("nova_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nova-templates"] });
      toast.success("Template deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Emails ──────────────────────────────────────────────────────────────────
export function useEmails(filters?: {
  status?: string;
  search?: string;
  campaignId?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["nova-emails", filters],
    queryFn: async () => {
      let q = supabase
        .from("nova_emails")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.campaignId) q = q.eq("campaign_id", filters.campaignId);
      if (filters?.search) {
        q = q.or(
          `to_address.ilike.%${filters.search}%,to_name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
        );
      }

      const limit = filters?.limit || 25;
      const offset = filters?.offset || 0;
      q = q.range(offset, offset + limit - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { emails: (data || []) as unknown as NovaEmail[], count: count || 0 };
    },
    staleTime: 30_000,
  });
}

// ── Sequences ───────────────────────────────────────────────────────────────
export function useSequences() {
  return useQuery({
    queryKey: ["nova-sequences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nova_sequences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NovaSequence[];
    },
    staleTime: 30_000,
  });
}

export function useCreateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<NovaSequence>) => {
      const payload = {
        ...s,
        steps: JSON.parse(JSON.stringify(s.steps || [])),
      };
      const { data, error } = await supabase
        .from("nova_sequences")
        .insert([payload as any])
        .select()
        .single();
      if (error) throw error;
      return data as unknown as NovaSequence;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nova-sequences"] });
      toast.success("Sequence created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<NovaSequence> & { id: string }) => {
      const payload = { ...updates } as any;
      if (payload.steps) payload.steps = JSON.parse(JSON.stringify(payload.steps));
      const { data, error } = await supabase
        .from("nova_sequences")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as NovaSequence;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nova-sequences"] });
      toast.success("Sequence updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("nova_sequences")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nova-sequences"] });
      toast.success("Sequence deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Campaigns ───────────────────────────────────────────────────────────────
export function useCampaigns() {
  return useQuery({
    queryKey: ["nova-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nova_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NovaCampaign[];
    },
    staleTime: 30_000,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<NovaCampaign>) => {
      const { data, error } = await supabase
        .from("nova_campaigns")
        .insert([c as any])
        .select()
        .single();
      if (error) throw error;
      return data as unknown as NovaCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nova-campaigns"] });
      toast.success("Campaign created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<NovaCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from("nova_campaigns")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as NovaCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nova-campaigns"] });
      toast.success("Campaign updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Daily Metrics ───────────────────────────────────────────────────────────
export function useNovaDailyMetrics(days = 30) {
  return useQuery({
    queryKey: ["nova-daily-metrics", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("nova_daily_metrics")
        .select("*")
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as NovaDailyMetric[];
    },
    staleTime: 60_000,
  });
}

// ── Aggregate Stats (computed from Supabase data) ───────────────────────────
export function useEmailStats() {
  return useQuery({
    queryKey: ["nova-email-stats"],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("nova_emails")
        .select("status, open_count, click_count, meeting_booked", {
          count: "exact",
        });
      if (error) throw error;
      const emails = data || [];
      const total = count || 0;

      if (total === 0) {
        return {
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalReplied: 0,
          totalBounced: 0,
          totalMeetings: 0,
          openRate: 0,
          clickRate: 0,
          replyRate: 0,
          bounceRate: 0,
        };
      }

      const sent = emails.filter((e) =>
        ["sending", "delivered", "opened", "clicked", "replied"].includes(e.status)
      ).length;
      const delivered = emails.filter((e) =>
        ["delivered", "opened", "clicked", "replied"].includes(e.status)
      ).length;
      const opened = emails.filter((e) =>
        ["opened", "clicked", "replied"].includes(e.status)
      ).length;
      const clicked = emails.filter((e) =>
        ["clicked", "replied"].includes(e.status)
      ).length;
      const replied = emails.filter((e) => e.status === "replied").length;
      const bounced = emails.filter((e) => e.status === "bounced").length;
      const meetings = emails.filter((e) => e.meeting_booked).length;

      return {
        totalSent: sent,
        totalDelivered: delivered,
        totalOpened: opened,
        totalClicked: clicked,
        totalReplied: replied,
        totalBounced: bounced,
        totalMeetings: meetings,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        replyRate: sent > 0 ? (replied / sent) * 100 : 0,
        bounceRate: total > 0 ? (bounced / total) * 100 : 0,
      };
    },
    staleTime: 30_000,
  });
}

// ── Realtime Subscription ───────────────────────────────────────────────────
export function useEmailsRealtime(onNewEmail: (email: NovaEmail) => void) {
  const channel = supabase
    .channel("nova-emails-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "nova_emails" },
      (payload) => {
        onNewEmail(payload.new as unknown as NovaEmail);
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
