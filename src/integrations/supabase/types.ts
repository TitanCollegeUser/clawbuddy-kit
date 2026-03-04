export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_details: Json | null
          action_type: string
          actor_id: string | null
          actor_name: string
          comment: string | null
          created_at: string | null
          id: string
          task_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          actor_id?: string | null
          actor_name: string
          comment?: string | null
          created_at?: string | null
          id?: string
          task_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          actor_id?: string | null
          actor_name?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          avatar_color: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
          webhook_secret: string
        }
        Insert: {
          avatar_color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id: string
          webhook_secret?: string
        }
        Update: {
          avatar_color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          content: string
          created_at: string | null
          data: Json | null
          id: string
          insight_type: string
          is_read: boolean | null
          target_user_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          data?: Json | null
          id?: string
          insight_type: string
          is_read?: boolean | null
          target_user_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          insight_type?: string
          is_read?: boolean | null
          target_user_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_log: {
        Row: {
          agent_emoji: string | null
          agent_name: string | null
          category: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          user_id: string | null
        }
        Insert: {
          agent_emoji?: string | null
          agent_name?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          user_id?: string | null
        }
        Update: {
          agent_emoji?: string | null
          agent_name?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_questions: {
        Row: {
          agent_emoji: string | null
          agent_name: string | null
          answer: string | null
          answered_at: string | null
          approval_response: boolean | null
          context: string | null
          created_at: string | null
          id: string
          priority: string | null
          question: string
          question_type: string | null
          related_task_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_emoji?: string | null
          agent_name?: string | null
          answer?: string | null
          answered_at?: string | null
          approval_response?: boolean | null
          context?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          question: string
          question_type?: string | null
          related_task_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_emoji?: string | null
          agent_name?: string | null
          answer?: string | null
          answered_at?: string | null
          approval_response?: boolean | null
          context?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          question?: string
          question_type?: string | null
          related_task_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bujji_questions_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_status: {
        Row: {
          agent_emoji: string | null
          agent_id: string | null
          agent_name: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          ring_color: string | null
          status_message: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_emoji?: string | null
          agent_id?: string | null
          agent_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          ring_color?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_emoji?: string | null
          agent_id?: string | null
          agent_name?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          ring_color?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_status_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_score_categories: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          name: string
          position: number
          scoreboard_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          position?: number
          scoreboard_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          position?: number
          scoreboard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_score_categories_scoreboard_id_fkey"
            columns: ["scoreboard_id"]
            isOneToOne: false
            referencedRelation: "arena_scoreboards"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_scoreboards: {
        Row: {
          created_at: string
          id: string
          office_id: string
          primary_metric_name: string
          primary_metric_unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          office_id: string
          primary_metric_name?: string
          primary_metric_unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          office_id?: string
          primary_metric_name?: string
          primary_metric_unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_scoreboards_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: true
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_scores: {
        Row: {
          agent_name: string
          category_id: string
          created_at: string
          id: string
          metadata: Json
          value: number
        }
        Insert: {
          agent_name: string
          category_id: string
          created_at?: string
          id?: string
          metadata?: Json
          value?: number
        }
        Update: {
          agent_name?: string
          category_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "arena_scores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "arena_score_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_channels: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          is_default: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          is_default?: boolean
          name: string
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          is_default?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_executions: {
        Row: {
          automation_id: string
          created_at: string
          deliveries: Json | null
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          output: string | null
          output_html: string | null
          started_at: string
          status: string
          tokens_used: number | null
          trigger_source: string
          triggered_by: string | null
        }
        Insert: {
          automation_id: string
          created_at?: string
          deliveries?: Json | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          output?: string | null
          output_html?: string | null
          started_at?: string
          status: string
          tokens_used?: number | null
          trigger_source?: string
          triggered_by?: string | null
        }
        Update: {
          automation_id?: string
          created_at?: string
          deliveries?: Json | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          output?: string | null
          output_html?: string | null
          started_at?: string
          status?: string
          tokens_used?: number | null
          trigger_source?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          agent_name: string | null
          channels: Json
          created_at: string
          created_by: string
          cron_expression: string
          description: string | null
          enabled: boolean
          fail_count: number
          function_config: Json | null
          function_name: string | null
          id: string
          last_run_at: string | null
          last_status: string | null
          max_turns: number
          model: string
          name: string
          next_run_at: string | null
          ops_app_id: string | null
          prompt: string
          run_count: number
          tags: string[] | null
          template_config: Json | null
          template_id: string | null
          timeout_seconds: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_name?: string | null
          channels?: Json
          created_at?: string
          created_by?: string
          cron_expression: string
          description?: string | null
          enabled?: boolean
          fail_count?: number
          function_config?: Json | null
          function_name?: string | null
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          max_turns?: number
          model?: string
          name: string
          next_run_at?: string | null
          ops_app_id?: string | null
          prompt: string
          run_count?: number
          tags?: string[] | null
          template_config?: Json | null
          template_id?: string | null
          timeout_seconds?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          agent_name?: string | null
          channels?: Json
          created_at?: string
          created_by?: string
          cron_expression?: string
          description?: string | null
          enabled?: boolean
          fail_count?: number
          function_config?: Json | null
          function_name?: string | null
          id?: string
          last_run_at?: string | null
          last_status?: string | null
          max_turns?: number
          model?: string
          name?: string
          next_run_at?: string | null
          ops_app_id?: string | null
          prompt?: string
          run_count?: number
          tags?: string[] | null
          template_config?: Json | null
          template_id?: string | null
          timeout_seconds?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_ops_app_id_fkey"
            columns: ["ops_app_id"]
            isOneToOne: false
            referencedRelation: "ops_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      board_columns: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          position: number
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          position: number
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_memory_logs: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string
          id: string
          log_date: string
          updated_at: string
          updated_by: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content?: string
          created_at?: string
          id?: string
          log_date: string
          updated_at?: string
          updated_by?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string
          id?: string
          log_date?: string
          updated_at?: string
          updated_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_memory_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          action_items: Json | null
          assumptions: Json | null
          created_at: string
          description: string | null
          goal_type: string
          id: string
          sent_to_bujji_at: string | null
          status: string
          target_unit: string | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          action_items?: Json | null
          assumptions?: Json | null
          created_at?: string
          description?: string | null
          goal_type?: string
          id?: string
          sent_to_bujji_at?: string | null
          status?: string
          target_unit?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          action_items?: Json | null
          assumptions?: Json | null
          created_at?: string
          description?: string | null
          goal_type?: string
          id?: string
          sent_to_bujji_at?: string | null
          status?: string
          target_unit?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: []
      }
      identity_files: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string
          file_key: string
          id: string
          updated_at: string
          updated_by: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content?: string
          created_at?: string
          file_key: string
          id?: string
          updated_at?: string
          updated_by?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string
          file_key?: string
          id?: string
          updated_at?: string
          updated_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_files_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_competitors: {
        Row: {
          channel_id: string
          country: string | null
          created_at: string | null
          handle: string | null
          id: string
          last_synced_at: string | null
          subscriber_count: number | null
          subscribr_id: number | null
          thumbnail_url: string | null
          title: string
          user_id: string
          video_count: number | null
          view_count: number | null
          workspace_id: string
        }
        Insert: {
          channel_id: string
          country?: string | null
          created_at?: string | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          subscriber_count?: number | null
          subscribr_id?: number | null
          thumbnail_url?: string | null
          title: string
          user_id: string
          video_count?: number | null
          view_count?: number | null
          workspace_id: string
        }
        Update: {
          channel_id?: string
          country?: string | null
          created_at?: string | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          subscriber_count?: number | null
          subscribr_id?: number | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          video_count?: number | null
          view_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_competitors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_digests: {
        Row: {
          competitor_highlights: Json | null
          created_at: string | null
          digest_date: string
          id: string
          insights: Json | null
          is_read: boolean | null
          metrics: Json | null
          summary_html: string | null
          title: string | null
          top_performers: Json | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          competitor_highlights?: Json | null
          created_at?: string | null
          digest_date: string
          id?: string
          insights?: Json | null
          is_read?: boolean | null
          metrics?: Json | null
          summary_html?: string | null
          title?: string | null
          top_performers?: Json | null
          user_id: string
          workspace_id: string
        }
        Update: {
          competitor_highlights?: Json | null
          created_at?: string | null
          digest_date?: string
          id?: string
          insights?: Json | null
          is_read?: boolean | null
          metrics?: Json | null
          summary_html?: string | null
          title?: string | null
          top_performers?: Json | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_digests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_ideas: {
        Row: {
          ai_response: string | null
          angle: string | null
          banger_confirmed_at: string | null
          category: string | null
          community_gate: string | null
          created_at: string | null
          evolution_history: Json | null
          feedback_history: Json | null
          id: string
          idea_number: number | null
          is_banger: boolean | null
          notes: string | null
          outlier_score: number | null
          priority: number | null
          sherlock_insights: string | null
          source_reference: string | null
          source_type: string | null
          status: string | null
          subscribr_idea_id: number | null
          suggested_length: number | null
          thumbnail_concept: string | null
          title: string
          topic: string | null
          updated_at: string | null
          user_feedback: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          ai_response?: string | null
          angle?: string | null
          banger_confirmed_at?: string | null
          category?: string | null
          community_gate?: string | null
          created_at?: string | null
          evolution_history?: Json | null
          feedback_history?: Json | null
          id?: string
          idea_number?: number | null
          is_banger?: boolean | null
          notes?: string | null
          outlier_score?: number | null
          priority?: number | null
          sherlock_insights?: string | null
          source_reference?: string | null
          source_type?: string | null
          status?: string | null
          subscribr_idea_id?: number | null
          suggested_length?: number | null
          thumbnail_concept?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          ai_response?: string | null
          angle?: string | null
          banger_confirmed_at?: string | null
          category?: string | null
          community_gate?: string | null
          created_at?: string | null
          evolution_history?: Json | null
          feedback_history?: Json | null
          id?: string
          idea_number?: number | null
          is_banger?: boolean | null
          notes?: string | null
          outlier_score?: number | null
          priority?: number | null
          sherlock_insights?: string | null
          source_reference?: string | null
          source_type?: string | null
          status?: string | null
          subscribr_idea_id?: number | null
          suggested_length?: number | null
          thumbnail_concept?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_ideas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_insights: {
        Row: {
          content: string
          created_at: string | null
          data: Json | null
          id: string
          insight_type: string | null
          is_pinned: boolean | null
          is_read: boolean | null
          priority: string | null
          title: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          data?: Json | null
          id?: string
          insight_type?: string | null
          is_pinned?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          title: string
          user_id: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          insight_type?: string | null
          is_pinned?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          title?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_insights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_scripts: {
        Row: {
          angle: string | null
          canvas_url: string | null
          content_preview: string | null
          created_at: string | null
          has_outline: boolean | null
          has_script: boolean | null
          id: string
          idea_id: string | null
          production_status: string | null
          status: string | null
          subscribr_script_id: number | null
          title: string
          topic: string | null
          updated_at: string | null
          user_id: string
          word_count: number | null
          workspace_id: string
        }
        Insert: {
          angle?: string | null
          canvas_url?: string | null
          content_preview?: string | null
          created_at?: string | null
          has_outline?: boolean | null
          has_script?: boolean | null
          id?: string
          idea_id?: string | null
          production_status?: string | null
          status?: string | null
          subscribr_script_id?: number | null
          title: string
          topic?: string | null
          updated_at?: string | null
          user_id: string
          word_count?: number | null
          workspace_id: string
        }
        Update: {
          angle?: string | null
          canvas_url?: string | null
          content_preview?: string | null
          created_at?: string | null
          has_outline?: boolean | null
          has_script?: boolean | null
          id?: string
          idea_id?: string | null
          production_status?: string | null
          status?: string | null
          subscribr_script_id?: number | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string
          word_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_scripts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "intelligence_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_scripts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_videos: {
        Row: {
          channel_id: string | null
          channel_title: string | null
          comment_count: number | null
          created_at: string | null
          duration: string | null
          first_seen_at: string | null
          id: string
          is_outlier: boolean | null
          last_synced_at: string | null
          like_count: number | null
          outlier_score: number | null
          published_at: string | null
          thumbnail_url: string | null
          title: string
          user_id: string
          video_id: string
          view_count: number | null
          views_per_hour: number | null
          workspace_id: string
        }
        Insert: {
          channel_id?: string | null
          channel_title?: string | null
          comment_count?: number | null
          created_at?: string | null
          duration?: string | null
          first_seen_at?: string | null
          id?: string
          is_outlier?: boolean | null
          last_synced_at?: string | null
          like_count?: number | null
          outlier_score?: number | null
          published_at?: string | null
          thumbnail_url?: string | null
          title: string
          user_id: string
          video_id: string
          view_count?: number | null
          views_per_hour?: number | null
          workspace_id: string
        }
        Update: {
          channel_id?: string | null
          channel_title?: string | null
          comment_count?: number | null
          created_at?: string | null
          duration?: string | null
          first_seen_at?: string | null
          id?: string
          is_outlier?: boolean | null
          last_synced_at?: string | null
          like_count?: number | null
          outlier_score?: number | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          video_id?: string
          view_count?: number | null
          views_per_hour?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_videos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_injections: {
        Row: {
          content: string
          created_at: string
          id: string
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      musashi_state: {
        Row: {
          id: string
          last_updated: string | null
          last_used_numbers: number[] | null
          user_id: string
        }
        Insert: {
          id?: string
          last_updated?: string | null
          last_used_numbers?: number[] | null
          user_id?: string
        }
        Update: {
          id?: string
          last_updated?: string | null
          last_used_numbers?: number[] | null
          user_id?: string
        }
        Relationships: []
      }
      office_activity_log: {
        Row: {
          action: string
          agent_name: string
          created_at: string
          detail: string | null
          id: string
          log_type: string
          office_id: string
          task_id: string | null
        }
        Insert: {
          action: string
          agent_name: string
          created_at?: string
          detail?: string | null
          id?: string
          log_type?: string
          office_id: string
          task_id?: string | null
        }
        Update: {
          action?: string
          agent_name?: string
          created_at?: string
          detail?: string | null
          id?: string
          log_type?: string
          office_id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_activity_log_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_agents: {
        Row: {
          bio: string | null
          created_at: string
          current_task_id: string | null
          current_thought: string | null
          desk_position_x: number
          desk_position_y: number
          fur_color: string
          fur_highlight: string
          id: string
          metadata: Json
          name: string
          neon_color: string
          office_id: string
          persona: string | null
          role: string
          secret_sauce: string | null
          skills: string[]
          species: string
          status: string
          suit_color: string
          target_agent: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          current_task_id?: string | null
          current_thought?: string | null
          desk_position_x?: number
          desk_position_y?: number
          fur_color?: string
          fur_highlight?: string
          id?: string
          metadata?: Json
          name: string
          neon_color?: string
          office_id: string
          persona?: string | null
          role?: string
          secret_sauce?: string | null
          skills?: string[]
          species?: string
          status?: string
          suit_color?: string
          target_agent?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          current_task_id?: string | null
          current_thought?: string | null
          desk_position_x?: number
          desk_position_y?: number
          fur_color?: string
          fur_highlight?: string
          id?: string
          metadata?: Json
          name?: string
          neon_color?: string
          office_id?: string
          persona?: string | null
          role?: string
          secret_sauce?: string | null
          skills?: string[]
          species?: string
          status?: string
          suit_color?: string
          target_agent?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_agents_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_deliverables: {
        Row: {
          agent_name: string
          created_at: string
          description: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          metadata: Json
          office_id: string
          task_id: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          description?: string | null
          file_name: string
          file_type?: string
          file_url: string
          id?: string
          metadata?: Json
          office_id: string
          task_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          metadata?: Json
          office_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_deliverables_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_events: {
        Row: {
          agent_name: string
          created_at: string
          event_type: string
          id: string
          office_id: string
          payload: Json
          processed: boolean
          task_id: string | null
        }
        Insert: {
          agent_name: string
          created_at?: string
          event_type: string
          id?: string
          office_id: string
          payload?: Json
          processed?: boolean
          task_id?: string | null
        }
        Update: {
          agent_name?: string
          created_at?: string
          event_type?: string
          id?: string
          office_id?: string
          payload?: Json
          processed?: boolean
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "office_events_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_tasks: {
        Row: {
          assigned_agents: string[]
          client_name: string | null
          completed_agents: string[]
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          office_id: string
          progress: number
          started_at: string | null
          status: string
          title: string
          total_agents: number
        }
        Insert: {
          assigned_agents?: string[]
          client_name?: string | null
          completed_agents?: string[]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          office_id: string
          progress?: number
          started_at?: string | null
          status?: string
          title: string
          total_agents?: number
        }
        Update: {
          assigned_agents?: string[]
          client_name?: string | null
          completed_agents?: string[]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          office_id?: string
          progress?: number
          started_at?: string | null
          status?: string
          title?: string
          total_agents?: number
        }
        Relationships: [
          {
            foreignKeyName: "office_tasks_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          created_at: string
          description: string | null
          director_color: string
          director_name: string
          director_species: string
          id: string
          metadata: Json
          name: string
          site_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          director_color?: string
          director_name?: string
          director_species?: string
          id?: string
          metadata?: Json
          name: string
          site_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          director_color?: string
          director_name?: string
          director_species?: string
          id?: string
          metadata?: Json
          name?: string
          site_type?: string
          user_id?: string
        }
        Relationships: []
      }
      ops_apps: {
        Row: {
          agent_name: string | null
          agent_type: string | null
          config: Json | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          page_order: string[] | null
          status: string | null
          theme: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name?: string | null
          agent_type?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          page_order?: string[] | null
          status?: string | null
          theme?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string | null
          agent_type?: string | null
          config?: Json | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          page_order?: string[] | null
          status?: string | null
          theme?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ops_blocks: {
        Row: {
          block_type: string
          config: Json | null
          created_at: string | null
          id: string
          page_id: string
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          block_type: string
          config?: Json | null
          created_at?: string | null
          id?: string
          page_id: string
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          block_type?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          page_id?: string
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "ops_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_data: {
        Row: {
          app_id: string
          block_id: string | null
          column_id: string | null
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          item_type: string
          metadata: Json | null
          sort_order: number | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_id: string
          block_id?: string | null
          column_id?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          item_type: string
          metadata?: Json | null
          sort_order?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_id?: string
          block_id?: string | null
          column_id?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          item_type?: string
          metadata?: Json | null
          sort_order?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_data_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "ops_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_data_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "ops_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_pages: {
        Row: {
          app_id: string
          config: Json | null
          created_at: string | null
          icon: string | null
          id: string
          layout: string | null
          name: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          app_id: string
          config?: Json | null
          created_at?: string | null
          icon?: string | null
          id?: string
          layout?: string | null
          name: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          config?: Json | null
          created_at?: string | null
          icon?: string | null
          id?: string
          layout?: string | null
          name?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_pages_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "ops_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_comms: {
        Row: {
          id: string
          user_id: string
          from_agent: string
          from_emoji: string | null
          to_agent: string
          message: string
          message_type: string
          priority: string
          status: string
          parent_id: string | null
          related_task_id: string | null
          metadata: Json
          created_at: string
          read_at: string | null
          replied_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          from_agent: string
          from_emoji?: string | null
          to_agent: string
          message: string
          message_type?: string
          priority?: string
          status?: string
          parent_id?: string | null
          related_task_id?: string | null
          metadata?: Json
          created_at?: string
          read_at?: string | null
          replied_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          from_agent?: string
          from_emoji?: string | null
          to_agent?: string
          message?: string
          message_type?: string
          priority?: string
          status?: string
          parent_id?: string | null
          related_task_id?: string | null
          metadata?: Json
          created_at?: string
          read_at?: string | null
          replied_at?: string | null
        }
        Relationships: []
      }
      pending_tasks: {
        Row: {
          action: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          id: string
          payload: Json
          priority: string
          result: Json | null
          started_at: string | null
          status: string
          task_type: string
          user_id: string
        }
        Insert: {
          action: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json
          priority?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          task_type: string
          user_id: string
        }
        Update: {
          action?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json
          priority?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      raw_reports: {
        Row: {
          created_at: string | null
          error_message: string | null
          function_id: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          processed_report_id: string | null
          raw_data: Json
          report_type: string
          source: string
          status: string | null
          user_id: string | null
          webhook_endpoint_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          function_id?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processed_report_id?: string | null
          raw_data: Json
          report_type: string
          source: string
          status?: string | null
          user_id?: string | null
          webhook_endpoint_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          function_id?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processed_report_id?: string | null
          raw_data?: Json
          report_type?: string
          source?: string
          status?: string | null
          user_id?: string | null
          webhook_endpoint_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_reports_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "webhook_functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_reports_processed_report_id_fkey"
            columns: ["processed_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_reports_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          html_content: string
          id: string
          is_read: boolean | null
          report_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          html_content: string
          id?: string
          is_read?: boolean | null
          report_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          html_content?: string
          id?: string
          is_read?: boolean | null
          report_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      skill_operations: {
        Row: {
          created_at: string
          description: string | null
          endpoint_path: string
          example_request: Json | null
          example_response: Json | null
          http_method: string
          id: string
          name: string
          position: number
          request_body_schema: Json | null
          response_schema: Json | null
          skill_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          endpoint_path: string
          example_request?: Json | null
          example_response?: Json | null
          http_method?: string
          id?: string
          name: string
          position?: number
          request_body_schema?: Json | null
          response_schema?: Json | null
          skill_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          endpoint_path?: string
          example_request?: Json | null
          example_response?: Json | null
          http_method?: string
          id?: string
          name?: string
          position?: number
          request_body_schema?: Json | null
          response_schema?: Json | null
          skill_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_operations_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          additional_notes: string | null
          agent_name: string | null
          agent_type: string
          allowed_tools: string[]
          api_base_url: string | null
          api_key_encrypted: string | null
          auth_format: string
          auth_header: string
          auth_type: string
          bujji_feedback: string | null
          bujji_status: string | null
          connection_config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          input_schema: Json
          name: string
          output_format: string
          protocol_type: string | null
          reviewed_at: string | null
          skill_markdown: string | null
          status: string
          submitted_at: string | null
          title: string
          updated_at: string
          use_cases: string[] | null
        }
        Insert: {
          additional_notes?: string | null
          agent_name?: string | null
          agent_type?: string
          allowed_tools?: string[]
          api_base_url?: string | null
          api_key_encrypted?: string | null
          auth_format?: string
          auth_header?: string
          auth_type?: string
          bujji_feedback?: string | null
          bujji_status?: string | null
          connection_config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          input_schema?: Json
          name: string
          output_format?: string
          protocol_type?: string | null
          reviewed_at?: string | null
          skill_markdown?: string | null
          status?: string
          submitted_at?: string | null
          title: string
          updated_at?: string
          use_cases?: string[] | null
        }
        Update: {
          additional_notes?: string | null
          agent_name?: string | null
          agent_type?: string
          allowed_tools?: string[]
          api_base_url?: string | null
          api_key_encrypted?: string | null
          auth_format?: string
          auth_header?: string
          auth_type?: string
          bujji_feedback?: string | null
          bujji_status?: string | null
          connection_config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          input_schema?: Json
          name?: string
          output_format?: string
          protocol_type?: string | null
          reviewed_at?: string | null
          skill_markdown?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
          use_cases?: string[] | null
        }
        Relationships: []
      }
      sub_agent_sessions: {
        Row: {
          agent_id: string
          completed_at: string | null
          cost: number | null
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: string
          input_params: Json | null
          input_tokens: number | null
          messages_count: number | null
          output_tokens: number | null
          result_full: string | null
          result_summary: string | null
          session_key: string
          started_at: string
          status: string
          task_description: string
          tokens_used: number | null
          tools_used: string[] | null
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_params?: Json | null
          input_tokens?: number | null
          messages_count?: number | null
          output_tokens?: number | null
          result_full?: string | null
          result_summary?: string | null
          session_key: string
          started_at?: string
          status?: string
          task_description: string
          tokens_used?: number | null
          tools_used?: string[] | null
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_params?: Json | null
          input_tokens?: number | null
          messages_count?: number | null
          output_tokens?: number | null
          result_full?: string | null
          result_summary?: string | null
          session_key?: string
          started_at?: string
          status?: string
          task_description?: string
          tokens_used?: number | null
          tools_used?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_agent_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "sub_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_agent_tasks: {
        Row: {
          agent_id: string
          assigned_by: string
          completed_at: string | null
          created_at: string
          id: string
          kanban_task_id: string | null
          priority: string
          session_id: string | null
          status: string
          task_description: string
        }
        Insert: {
          agent_id: string
          assigned_by?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          kanban_task_id?: string | null
          priority?: string
          session_id?: string | null
          status?: string
          task_description: string
        }
        Update: {
          agent_id?: string
          assigned_by?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          kanban_task_id?: string | null
          priority?: string
          session_id?: string | null
          status?: string
          task_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "sub_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_agent_tasks_kanban_task_id_fkey"
            columns: ["kanban_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_agent_tasks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sub_agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_agents: {
        Row: {
          allowed_tools: string[] | null
          avg_task_duration_ms: number | null
          config: Json | null
          cost_this_month: number | null
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          error_count: number | null
          id: string
          last_active: string | null
          max_concurrent_tasks: number | null
          model: string
          monthly_cost_budget: number | null
          monthly_token_budget: number | null
          name: string
          status: string
          success_rate: number | null
          system_prompt: string | null
          timeout_minutes: number | null
          tokens_used_this_month: number | null
          total_sessions: number | null
          total_tasks_completed: number | null
          updated_at: string
          workspace: string
        }
        Insert: {
          allowed_tools?: string[] | null
          avg_task_duration_ms?: number | null
          config?: Json | null
          cost_this_month?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          error_count?: number | null
          id?: string
          last_active?: string | null
          max_concurrent_tasks?: number | null
          model: string
          monthly_cost_budget?: number | null
          monthly_token_budget?: number | null
          name: string
          status?: string
          success_rate?: number | null
          system_prompt?: string | null
          timeout_minutes?: number | null
          tokens_used_this_month?: number | null
          total_sessions?: number | null
          total_tasks_completed?: number | null
          updated_at?: string
          workspace: string
        }
        Update: {
          allowed_tools?: string[] | null
          avg_task_duration_ms?: number | null
          config?: Json | null
          cost_this_month?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          error_count?: number | null
          id?: string
          last_active?: string | null
          max_concurrent_tasks?: number | null
          model?: string
          monthly_cost_budget?: number | null
          monthly_token_budget?: number | null
          name?: string
          status?: string
          success_rate?: number | null
          system_prompt?: string | null
          timeout_minutes?: number | null
          tokens_used_this_month?: number | null
          total_sessions?: number | null
          total_tasks_completed?: number | null
          updated_at?: string
          workspace?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          created_at: string | null
          due_date: string | null
          id: string
          task_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          task_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          task_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          assigned_at: string | null
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_budgets: {
        Row: {
          actual_cost: number | null
          created_at: string | null
          currency: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          created_at?: string | null
          currency?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          created_at?: string | null
          currency?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_budgets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          board_column_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_bujji: boolean | null
          description: string | null
          due_date: string | null
          id: string
          position: number | null
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          board_column_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_bujji?: boolean | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          board_column_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_bujji?: boolean | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_board_column_id_fkey"
            columns: ["board_column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ai_name: string
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          notification_preferences: Json
          onboarding_completed: boolean
          theme_preference: string
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          ai_name?: string
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          notification_preferences?: Json
          onboarding_completed?: boolean
          theme_preference?: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          ai_name?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notification_preferences?: Json
          onboarding_completed?: boolean
          theme_preference?: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          auto_process: boolean
          created_at: string
          function_id: string
          id: string
          is_active: boolean
          name: string
          secret: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_process?: boolean
          created_at?: string
          function_id: string
          id?: string
          is_active?: boolean
          name: string
          secret?: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_process?: boolean
          created_at?: string
          function_id?: string
          id?: string
          is_active?: boolean
          name?: string
          secret?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "webhook_functions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_functions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          prompt_template: string
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          prompt_template?: string
          report_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prompt_template?: string
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_next_run: {
        Args: { cron_expr: string; tz?: string }
        Returns: string
      }
      owns_office: { Args: { _office_id: string }; Returns: boolean }
      owns_ops_app: { Args: { _app_id: string }; Returns: boolean }
      owns_ops_page: { Args: { _page_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
