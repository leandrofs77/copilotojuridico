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
      account_access_control: {
        Row: {
          access_status: string | null
          approved_at: string | null
          approved_by: string | null
          billing_status: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          office_name: string | null
          pause_reason: string | null
          plan_name: string | null
          suspended_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_status?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          office_name?: string | null
          pause_reason?: string | null
          plan_name?: string | null
          suspended_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_status?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          office_name?: string | null
          pause_reason?: string | null
          plan_name?: string | null
          suspended_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      account_licenses: {
        Row: {
          access_ends_at: string | null
          billing_provider: string | null
          created_at: string
          created_by_admin: string | null
          id: string
          license_status: string
          license_type: string
          notes: string | null
          plan_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_ends_at?: string | null
          billing_provider?: string | null
          created_at?: string
          created_by_admin?: string | null
          id?: string
          license_status?: string
          license_type?: string
          notes?: string | null
          plan_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_ends_at?: string | null
          billing_provider?: string | null
          created_at?: string
          created_by_admin?: string | null
          id?: string
          license_status?: string
          license_type?: string
          notes?: string | null
          plan_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          case_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          case_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          case_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_action_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          new_status: string | null
          old_status: string | null
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          reason?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      ai_execution_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          estimated_cost: number | null
          execution_time_ms: number | null
          id: string
          model_used: string | null
          prompt_id: string | null
          status: string | null
          tokens_input: number | null
          tokens_output: number | null
          tool_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          estimated_cost?: number | null
          execution_time_ms?: number | null
          id?: string
          model_used?: string | null
          prompt_id?: string | null
          status?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tool_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          estimated_cost?: number | null
          execution_time_ms?: number | null
          id?: string
          model_used?: string | null
          prompt_id?: string | null
          status?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          tool_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_execution_logs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          active: boolean | null
          avg_response_time: number | null
          cost_per_1k_tokens: number | null
          created_at: string | null
          display_name: string | null
          id: string
          model_name: string
          priority: number | null
          provider: string
          success_rate: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          avg_response_time?: number | null
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          model_name: string
          priority?: number | null
          provider: string
          success_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          avg_response_time?: number | null
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          model_name?: string
          priority?: number | null
          provider?: string
          success_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          max_tokens: number | null
          model_preferred: string | null
          name: string
          prompt_content: string
          temperature: number | null
          tool_name: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          max_tokens?: number | null
          model_preferred?: string | null
          name: string
          prompt_content?: string
          temperature?: number | null
          tool_name: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          max_tokens?: number | null
          model_preferred?: string | null
          name?: string
          prompt_content?: string
          temperature?: number | null
          tool_name?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      ai_provider_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string | null
          id: string
          is_default: boolean | null
          provider: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          provider: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          cost_alert_threshold: number | null
          created_at: string | null
          default_model: string | null
          enable_fallback: boolean | null
          enable_logging: boolean | null
          fallback_model: string | null
          id: string
          max_tokens_default: number | null
          temperature_default: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cost_alert_threshold?: number | null
          created_at?: string | null
          default_model?: string | null
          enable_fallback?: boolean | null
          enable_logging?: boolean | null
          fallback_model?: string | null
          id?: string
          max_tokens_default?: number | null
          temperature_default?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cost_alert_threshold?: number | null
          created_at?: string | null
          default_model?: string | null
          enable_fallback?: boolean | null
          enable_logging?: boolean | null
          fallback_model?: string | null
          id?: string
          max_tokens_default?: number | null
          temperature_default?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          case_id: string | null
          created_at: string
          estimated_cost: number | null
          feature_name: string | null
          id: string
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          provider: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          estimated_cost?: number | null
          feature_name?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          estimated_cost?: number | null
          feature_name?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_context_signals: {
        Row: {
          case_id: string
          content: string
          created_at: string | null
          id: string
          signal_analysis: Json | null
          source_type: string
          user_id: string
        }
        Insert: {
          case_id: string
          content: string
          created_at?: string | null
          id?: string
          signal_analysis?: Json | null
          source_type?: string
          user_id: string
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string | null
          id?: string
          signal_analysis?: Json | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_context_signals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_deadlines: {
        Row: {
          case_id: string
          created_at: string
          deadline_date: string
          deadline_type: string
          id: string
          responsible_user: string | null
          risk_level: string
          status: string
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          deadline_date: string
          deadline_type?: string
          id?: string
          responsible_user?: string | null
          risk_level?: string
          status?: string
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          deadline_date?: string
          deadline_type?: string
          id?: string
          responsible_user?: string | null
          risk_level?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_deadlines_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_evidence_checklist: {
        Row: {
          case_id: string
          created_at: string
          description: string
          evidence_type: string
          id: string
          importance_level: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          description: string
          evidence_type: string
          id?: string
          importance_level?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string
          evidence_type?: string
          id?: string
          importance_level?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_evidence_checklist_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_evidence_simulation: {
        Row: {
          case_id: string
          created_at: string | null
          current_strength: string | null
          estimated_success_probability: string | null
          evidence_impact_analysis: Json | null
          id: string
          missing_critical_evidence: Json | null
          missing_recommended_evidence: Json | null
          potential_strength: string | null
          simulation_summary: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          current_strength?: string | null
          estimated_success_probability?: string | null
          evidence_impact_analysis?: Json | null
          id?: string
          missing_critical_evidence?: Json | null
          missing_recommended_evidence?: Json | null
          potential_strength?: string | null
          simulation_summary?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          current_strength?: string | null
          estimated_success_probability?: string | null
          evidence_impact_analysis?: Json | null
          id?: string
          missing_critical_evidence?: Json | null
          missing_recommended_evidence?: Json | null
          potential_strength?: string | null
          simulation_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_evidence_simulation_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_intake_analysis: {
        Row: {
          analysis_summary: string | null
          complexity_level: string | null
          converted_case_id: string | null
          created_at: string
          description: string | null
          estimated_duration: string | null
          id: string
          legal_area: string | null
          recommendation: string | null
          risk_factors: Json | null
          status: string
          strengths: Json | null
          success_probability: string | null
          uploaded_documents: Json | null
          user_id: string
          viability_level: string | null
        }
        Insert: {
          analysis_summary?: string | null
          complexity_level?: string | null
          converted_case_id?: string | null
          created_at?: string
          description?: string | null
          estimated_duration?: string | null
          id?: string
          legal_area?: string | null
          recommendation?: string | null
          risk_factors?: Json | null
          status?: string
          strengths?: Json | null
          success_probability?: string | null
          uploaded_documents?: Json | null
          user_id: string
          viability_level?: string | null
        }
        Update: {
          analysis_summary?: string | null
          complexity_level?: string | null
          converted_case_id?: string | null
          created_at?: string
          description?: string | null
          estimated_duration?: string | null
          id?: string
          legal_area?: string | null
          recommendation?: string | null
          risk_factors?: Json | null
          status?: string
          strengths?: Json | null
          success_probability?: string | null
          uploaded_documents?: Json | null
          user_id?: string
          viability_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_intake_analysis_converted_case_id_fkey"
            columns: ["converted_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_next_actions: {
        Row: {
          action_description: string
          action_type: string
          case_id: string
          created_at: string
          generated_by_ai: boolean | null
          id: string
          impact_score: number | null
          priority: string
          source: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_description: string
          action_type?: string
          case_id: string
          created_at?: string
          generated_by_ai?: boolean | null
          id?: string
          impact_score?: number | null
          priority?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          case_id?: string
          created_at?: string
          generated_by_ai?: boolean | null
          id?: string
          impact_score?: number | null
          priority?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_next_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_parties: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          document_number: string | null
          email: string | null
          id: string
          name: string
          observations: string | null
          party_type: Database["public"]["Enums"]["party_type"]
          phone: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          email?: string | null
          id?: string
          name: string
          observations?: string | null
          party_type?: Database["public"]["Enums"]["party_type"]
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          email?: string | null
          id?: string
          name?: string
          observations?: string | null
          party_type?: Database["public"]["Enums"]["party_type"]
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_parties_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_process_events: {
        Row: {
          case_id: string
          detected_at: string | null
          event_date: string | null
          event_text: string | null
          event_type: string | null
          id: string
          source: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          detected_at?: string | null
          event_date?: string | null
          event_text?: string | null
          event_type?: string | null
          id?: string
          source?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          detected_at?: string | null
          event_date?: string | null
          event_text?: string | null
          event_type?: string | null
          id?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_process_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_process_monitoring: {
        Row: {
          case_id: string
          court: string | null
          created_at: string
          id: string
          last_checked_at: string | null
          last_event_date: string | null
          last_event_summary: string | null
          process_number: string | null
          status: string
          user_id: string
        }
        Insert: {
          case_id: string
          court?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_event_date?: string | null
          last_event_summary?: string | null
          process_number?: string | null
          status?: string
          user_id: string
        }
        Update: {
          case_id?: string
          court?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_event_date?: string | null
          last_event_summary?: string | null
          process_number?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_process_monitoring_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_strategic_analysis: {
        Row: {
          case_id: string
          counterarguments: Json | null
          created_at: string
          id: string
          jurisprudence_summary: string | null
          possible_theses: Json | null
          risk_factors: Json | null
          strategic_recommendations: string | null
          strengths: Json | null
          success_probability: string | null
          updated_at: string
          user_id: string
          weaknesses: Json | null
        }
        Insert: {
          case_id: string
          counterarguments?: Json | null
          created_at?: string
          id?: string
          jurisprudence_summary?: string | null
          possible_theses?: Json | null
          risk_factors?: Json | null
          strategic_recommendations?: string | null
          strengths?: Json | null
          success_probability?: string | null
          updated_at?: string
          user_id: string
          weaknesses?: Json | null
        }
        Update: {
          case_id?: string
          counterarguments?: Json | null
          created_at?: string
          id?: string
          jurisprudence_summary?: string | null
          possible_theses?: Json | null
          risk_factors?: Json | null
          strategic_recommendations?: string | null
          strengths?: Json | null
          success_probability?: string | null
          updated_at?: string
          user_id?: string
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "case_strategic_analysis_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_strategy_radar: {
        Row: {
          case_id: string
          confidence_score: number | null
          created_at: string
          generated_by_ai: boolean | null
          id: string
          recommended_actions: Json | null
          recommended_evidence: Json | null
          risk_score: number | null
          strategic_advantages: Json | null
          strategic_summary: string | null
          strategic_weaknesses: Json | null
          success_probability: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id: string
          confidence_score?: number | null
          created_at?: string
          generated_by_ai?: boolean | null
          id?: string
          recommended_actions?: Json | null
          recommended_evidence?: Json | null
          risk_score?: number | null
          strategic_advantages?: Json | null
          strategic_summary?: string | null
          strategic_weaknesses?: Json | null
          success_probability?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string
          confidence_score?: number | null
          created_at?: string
          generated_by_ai?: boolean | null
          id?: string
          recommended_actions?: Json | null
          recommended_evidence?: Json | null
          risk_score?: number | null
          strategic_advantages?: Json | null
          strategic_summary?: string | null
          strategic_weaknesses?: Json | null
          success_probability?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_strategy_radar_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_temporal_analysis: {
        Row: {
          case_id: string
          created_at: string | null
          deadline_risk: string | null
          id: string
          limitation_risk: string | null
          possible_deadlines: Json | null
          time_sensitivity_analysis: string | null
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          deadline_risk?: string | null
          id?: string
          limitation_risk?: string | null
          possible_deadlines?: Json | null
          time_sensitivity_analysis?: string | null
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          deadline_risk?: string | null
          id?: string
          limitation_risk?: string | null
          possible_deadlines?: Json | null
          time_sensitivity_analysis?: string | null
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_temporal_analysis_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_viability_analysis: {
        Row: {
          analysis_summary: string | null
          case_id: string
          complexity_level: string | null
          created_at: string
          effort_estimation: string | null
          estimated_duration: string | null
          id: string
          recommendation: string | null
          risk_factors: Json | null
          strengths: Json | null
          success_probability: string | null
          user_id: string
          viability_level: string | null
        }
        Insert: {
          analysis_summary?: string | null
          case_id: string
          complexity_level?: string | null
          created_at?: string
          effort_estimation?: string | null
          estimated_duration?: string | null
          id?: string
          recommendation?: string | null
          risk_factors?: Json | null
          strengths?: Json | null
          success_probability?: string | null
          user_id: string
          viability_level?: string | null
        }
        Update: {
          analysis_summary?: string | null
          case_id?: string
          complexity_level?: string | null
          created_at?: string
          effort_estimation?: string | null
          estimated_duration?: string | null
          id?: string
          recommendation?: string | null
          risk_factors?: Json | null
          strengths?: Json | null
          success_probability?: string | null
          user_id?: string
          viability_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_viability_analysis_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_visual_diagnostics: {
        Row: {
          case_id: string
          complexity_score: number | null
          conflict_intensity_score: number | null
          created_at: string | null
          evidence_score: number | null
          financial_score: number | null
          id: string
          overall_case_strength: number | null
          recommended_actions: Json | null
          risk_level: string | null
          timing_score: number | null
          updated_at: string | null
          urgency_score: number | null
          user_id: string
          viability_score: number | null
          visual_summary: string | null
        }
        Insert: {
          case_id: string
          complexity_score?: number | null
          conflict_intensity_score?: number | null
          created_at?: string | null
          evidence_score?: number | null
          financial_score?: number | null
          id?: string
          overall_case_strength?: number | null
          recommended_actions?: Json | null
          risk_level?: string | null
          timing_score?: number | null
          updated_at?: string | null
          urgency_score?: number | null
          user_id: string
          viability_score?: number | null
          visual_summary?: string | null
        }
        Update: {
          case_id?: string
          complexity_score?: number | null
          conflict_intensity_score?: number | null
          created_at?: string | null
          evidence_score?: number | null
          financial_score?: number | null
          id?: string
          overall_case_strength?: number | null
          recommended_actions?: Json | null
          risk_level?: string | null
          timing_score?: number | null
          updated_at?: string | null
          urgency_score?: number | null
          user_id?: string
          viability_score?: number | null
          visual_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_visual_diagnostics_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string | null
          court: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          legal_area: string | null
          observations: string | null
          status: Database["public"]["Enums"]["case_status"]
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          case_number?: string | null
          court?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          legal_area?: string | null
          observations?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          case_number?: string | null
          court?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          legal_area?: string | null
          observations?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_notifications: {
        Row: {
          case_id: string
          client_id: string | null
          created_at: string
          id: string
          message: string
          message_type: string
          sent_at: string | null
          sent_via: string | null
          status: string
          user_id: string
        }
        Insert: {
          case_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          message: string
          message_type?: string
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          user_id: string
        }
        Update: {
          case_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          sent_at?: string | null
          sent_via?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          storage_path: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          storage_path?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          storage_path?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          content: Json | null
          created_at: string | null
          html_content: string | null
          id: string
          page_category: string
          page_slug: string
          page_title: string
          published: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          html_content?: string | null
          id?: string
          page_category?: string
          page_slug: string
          page_title: string
          published?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          html_content?: string | null
          id?: string
          page_category?: string
          page_slug?: string
          page_title?: string
          published?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      document_analysis_jobs: {
        Row: {
          analysis_phase: string | null
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          document_id: string
          error: string | null
          id: string
          payload: Json | null
          priority: number | null
          result: Json | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          analysis_phase?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          document_id: string
          error?: string | null
          id?: string
          payload?: Json | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          analysis_phase?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string
          error?: string | null
          id?: string
          payload?: Json | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_analysis_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_analysis: string | null
          ai_classification: string | null
          ai_provider_used: string | null
          ai_summary: string | null
          analysis_cache_key: string | null
          analysis_completed_at: string | null
          analysis_started_at: string | null
          analysis_status: string | null
          analysis_version: string | null
          case_id: string
          content_hash: string | null
          created_at: string
          created_by: string | null
          delete_from_supabase_after_processing: boolean | null
          document_date: string | null
          external_file_id: string | null
          external_folder_id: string | null
          external_provider: string | null
          external_web_url: string | null
          extracted_text: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_temp_copy: boolean | null
          mime_type: string | null
          name: string
          observations: string | null
          original_filename: string | null
          processing_status: Database["public"]["Enums"]["document_status"]
          queued_for_analysis: boolean | null
          source: string | null
          storage_mode: string | null
          storage_path: string | null
          supabase_deleted_at: string | null
          updated_at: string
          updated_by: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_classification?: string | null
          ai_provider_used?: string | null
          ai_summary?: string | null
          analysis_cache_key?: string | null
          analysis_completed_at?: string | null
          analysis_started_at?: string | null
          analysis_status?: string | null
          analysis_version?: string | null
          case_id: string
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          delete_from_supabase_after_processing?: boolean | null
          document_date?: string | null
          external_file_id?: string | null
          external_folder_id?: string | null
          external_provider?: string | null
          external_web_url?: string | null
          extracted_text?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_temp_copy?: boolean | null
          mime_type?: string | null
          name: string
          observations?: string | null
          original_filename?: string | null
          processing_status?: Database["public"]["Enums"]["document_status"]
          queued_for_analysis?: boolean | null
          source?: string | null
          storage_mode?: string | null
          storage_path?: string | null
          supabase_deleted_at?: string | null
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          ai_classification?: string | null
          ai_provider_used?: string | null
          ai_summary?: string | null
          analysis_cache_key?: string | null
          analysis_completed_at?: string | null
          analysis_started_at?: string | null
          analysis_status?: string | null
          analysis_version?: string | null
          case_id?: string
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          delete_from_supabase_after_processing?: boolean | null
          document_date?: string | null
          external_file_id?: string | null
          external_folder_id?: string | null
          external_provider?: string | null
          external_web_url?: string | null
          extracted_text?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_temp_copy?: boolean | null
          mime_type?: string | null
          name?: string
          observations?: string | null
          original_filename?: string | null
          processing_status?: Database["public"]["Enums"]["document_status"]
          queued_for_analysis?: boolean | null
          source?: string | null
          storage_mode?: string | null
          storage_path?: string | null
          supabase_deleted_at?: string | null
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      external_file_links: {
        Row: {
          created_at: string | null
          document_id: string | null
          external_file_id: string | null
          external_file_name: string | null
          external_folder_id: string | null
          external_web_url: string | null
          id: string
          last_synced_at: string | null
          provider: string
          sync_direction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          external_file_id?: string | null
          external_file_name?: string | null
          external_folder_id?: string | null
          external_web_url?: string | null
          id?: string
          last_synced_at?: string | null
          provider: string
          sync_direction?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          external_file_id?: string | null
          external_file_name?: string | null
          external_folder_id?: string | null
          external_web_url?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          sync_direction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_file_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      external_storage_connections: {
        Row: {
          access_token_encrypted: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          provider_account_email: string | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          provider_account_email?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          provider_account_email?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      external_storage_folders: {
        Row: {
          connection_id: string
          created_at: string | null
          folder_id: string | null
          folder_name: string | null
          folder_path: string | null
          id: string
          is_default: boolean | null
          provider: string
          usage_type: string
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          folder_id?: string | null
          folder_name?: string | null
          folder_path?: string | null
          id?: string
          is_default?: boolean | null
          provider: string
          usage_type?: string
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          folder_id?: string | null
          folder_name?: string | null
          folder_path?: string | null
          id?: string
          is_default?: boolean | null
          provider?: string
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_storage_folders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "external_storage_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_events: {
        Row: {
          case_id: string
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          description: string | null
          document_id: string | null
          event_category: Database["public"]["Enums"]["event_category"]
          event_date: string
          evidence_type: Database["public"]["Enums"]["evidence_type"] | null
          id: string
          is_manual: boolean
          observations: string | null
          relevance: Database["public"]["Enums"]["relevance_level"] | null
          source_document_id: string | null
          source_type: Database["public"]["Enums"]["event_source_type"]
          title: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_id?: string | null
          event_category?: Database["public"]["Enums"]["event_category"]
          event_date: string
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null
          id?: string
          is_manual?: boolean
          observations?: string | null
          relevance?: Database["public"]["Enums"]["relevance_level"] | null
          source_document_id?: string | null
          source_type?: Database["public"]["Enums"]["event_source_type"]
          title: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_id?: string | null
          event_category?: Database["public"]["Enums"]["event_category"]
          event_date?: string
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null
          id?: string
          is_manual?: boolean
          observations?: string | null
          relevance?: Database["public"]["Enums"]["relevance_level"] | null
          source_document_id?: string | null
          source_type?: Database["public"]["Enums"]["event_source_type"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_events_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_legal_documents: {
        Row: {
          case_id: string
          content: string
          created_at: string
          document_type: string
          generated_by_ai: boolean | null
          generation_context: Json | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          case_id: string
          content?: string
          created_at?: string
          document_type?: string
          generated_by_ai?: boolean | null
          generation_context?: Json | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string
          document_type?: string
          generated_by_ai?: boolean | null
          generation_context?: Json | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_legal_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_search_index: {
        Row: {
          created_at: string
          embedding_generated_at: string | null
          embedding_model: string | null
          entry_id: string
          id: string
          search_vector: unknown
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding_generated_at?: string | null
          embedding_model?: string | null
          entry_id: string
          id?: string
          search_vector?: unknown
          user_id: string
        }
        Update: {
          created_at?: string
          embedding_generated_at?: string | null
          embedding_model?: string | null
          entry_id?: string
          id?: string
          search_vector?: unknown
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_search_index_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "legal_knowledge_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_similarity_links: {
        Row: {
          created_at: string
          id: string
          match_type: string | null
          similar_case_id: string
          similarity_reasons: Json | null
          similarity_score: number | null
          source_case_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_type?: string | null
          similar_case_id: string
          similarity_reasons?: Json | null
          similarity_score?: number | null
          source_case_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_type?: string | null
          similar_case_id?: string
          similarity_reasons?: Json | null
          similarity_score?: number | null
          source_case_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_similarity_links_similar_case_id_fkey"
            columns: ["similar_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_similarity_links_source_case_id_fkey"
            columns: ["source_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_knowledge_entries: {
        Row: {
          case_id: string | null
          confidence_score: number | null
          content: string
          created_at: string
          entry_type: string
          generated_by_ai: boolean | null
          id: string
          is_archived: boolean | null
          is_favorite: boolean | null
          is_manual: boolean | null
          legal_area: string | null
          metadata: Json | null
          outcome: string | null
          relevance_score: number | null
          search_text: string | null
          source_id: string | null
          source_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          confidence_score?: number | null
          content: string
          created_at?: string
          entry_type?: string
          generated_by_ai?: boolean | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_manual?: boolean | null
          legal_area?: string | null
          metadata?: Json | null
          outcome?: string | null
          relevance_score?: number | null
          search_text?: string | null
          source_id?: string | null
          source_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          confidence_score?: number | null
          content?: string
          created_at?: string
          entry_type?: string
          generated_by_ai?: boolean | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_manual?: boolean | null
          legal_area?: string | null
          metadata?: Json | null
          outcome?: string | null
          relevance_score?: number | null
          search_text?: string | null
          source_id?: string | null
          source_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_knowledge_entries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_writing_profiles: {
        Row: {
          argument_patterns: Json | null
          created_at: string | null
          id: string
          profile_name: string
          sample_documents_count: number | null
          signature_phrases: Json | null
          structure_patterns: Json | null
          style_summary: string | null
          tone: string | null
          updated_at: string | null
          user_id: string
          vocabulary_patterns: Json | null
        }
        Insert: {
          argument_patterns?: Json | null
          created_at?: string | null
          id?: string
          profile_name: string
          sample_documents_count?: number | null
          signature_phrases?: Json | null
          structure_patterns?: Json | null
          style_summary?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id: string
          vocabulary_patterns?: Json | null
        }
        Update: {
          argument_patterns?: Json | null
          created_at?: string | null
          id?: string
          profile_name?: string
          sample_documents_count?: number | null
          signature_phrases?: Json | null
          structure_patterns?: Json | null
          style_summary?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string
          vocabulary_patterns?: Json | null
        }
        Relationships: []
      }
      legal_writing_samples: {
        Row: {
          created_at: string | null
          document_id: string | null
          extracted_text: string | null
          id: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          extracted_text?: string | null
          id?: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          extracted_text?: string | null
          id?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_writing_samples_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_writing_samples_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "legal_writing_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reward_type: string
          reward_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reward_type: string
          reward_value?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reward_type?: string
          reward_value?: number
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          id: string
          partner_level: string
          referral_code_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_level?: string
          referral_code_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_level?: string
          referral_code_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          oab_number: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          oab_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          oab_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_value: number
          created_at: string
          id: string
          referred_user_id: string
          referrer_user_id: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          commission_value?: number
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_user_id: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          commission_value?: number
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          case_id: string
          content_json: Json | null
          content_text: string | null
          created_at: string
          created_by: string | null
          generated_at: string
          generated_by_ai: boolean
          id: string
          notes: string | null
          pending_items: string[] | null
          report_type: Database["public"]["Enums"]["report_type"]
          status: Database["public"]["Enums"]["report_status"]
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          content_json?: Json | null
          content_text?: string | null
          created_at?: string
          created_by?: string | null
          generated_at?: string
          generated_by_ai?: boolean
          id?: string
          notes?: string | null
          pending_items?: string[] | null
          report_type?: Database["public"]["Enums"]["report_type"]
          status?: Database["public"]["Enums"]["report_status"]
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          content_json?: Json | null
          content_text?: string | null
          created_at?: string
          created_by?: string | null
          generated_at?: string
          generated_by_ai?: boolean
          id?: string
          notes?: string | null
          pending_items?: string[] | null
          report_type?: Database["public"]["Enums"]["report_type"]
          status?: Database["public"]["Enums"]["report_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_license_valid: { Args: { _user_id: string }; Returns: boolean }
      get_access_status: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      search_knowledge: {
        Args: {
          _entry_type?: string
          _legal_area?: string
          _limit?: number
          _query: string
          _user_id: string
        }
        Returns: {
          case_id: string
          content: string
          entry_id: string
          entry_type: string
          legal_area: string
          outcome: string
          rank: number
          relevance_score: number
          tags: string[]
          title: string
        }[]
      }
    }
    Enums: {
      activity_action:
        | "case_created"
        | "case_updated"
        | "case_archived"
        | "case_deleted"
        | "document_uploaded"
        | "document_deleted"
        | "event_created"
        | "event_updated"
        | "event_deleted"
        | "report_generated"
        | "login"
        | "document_processed"
      app_role: "admin" | "moderator" | "user" | "superadmin"
      case_status: "ativo" | "arquivado" | "encerrado" | "pendente"
      confidence_level: "alto" | "medio" | "baixo"
      document_status: "pendente" | "processando" | "processado" | "erro"
      event_category:
        | "fato"
        | "decisao"
        | "prazo"
        | "audiencia"
        | "pericia"
        | "outro"
      event_source_type: "manual" | "documento" | "ia" | "importacao"
      evidence_type:
        | "documental"
        | "testemunhal"
        | "pericial"
        | "digital"
        | "outro"
      party_type:
        | "autor"
        | "reu"
        | "testemunha"
        | "perito"
        | "advogado"
        | "juiz"
        | "outro"
      relevance_level: "alta" | "media" | "baixa"
      report_status: "rascunho" | "gerado" | "revisado" | "finalizado"
      report_type: "completo" | "resumido" | "cronologia" | "dossie"
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
    Enums: {
      activity_action: [
        "case_created",
        "case_updated",
        "case_archived",
        "case_deleted",
        "document_uploaded",
        "document_deleted",
        "event_created",
        "event_updated",
        "event_deleted",
        "report_generated",
        "login",
        "document_processed",
      ],
      app_role: ["admin", "moderator", "user", "superadmin"],
      case_status: ["ativo", "arquivado", "encerrado", "pendente"],
      confidence_level: ["alto", "medio", "baixo"],
      document_status: ["pendente", "processando", "processado", "erro"],
      event_category: [
        "fato",
        "decisao",
        "prazo",
        "audiencia",
        "pericia",
        "outro",
      ],
      event_source_type: ["manual", "documento", "ia", "importacao"],
      evidence_type: [
        "documental",
        "testemunhal",
        "pericial",
        "digital",
        "outro",
      ],
      party_type: [
        "autor",
        "reu",
        "testemunha",
        "perito",
        "advogado",
        "juiz",
        "outro",
      ],
      relevance_level: ["alta", "media", "baixa"],
      report_status: ["rascunho", "gerado", "revisado", "finalizado"],
      report_type: ["completo", "resumido", "cronologia", "dossie"],
    },
  },
} as const
