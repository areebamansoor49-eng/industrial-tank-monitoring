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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged_at: string | null
          id: string
          message: string
          metadata: Json
          organization_id: string
          resolved_at: string | null
          sensor_id: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          site_id: string | null
          status: Database["public"]["Enums"]["alert_status"]
          tank_id: string | null
          threshold_value: number | null
          title: string
          triggered_at: string
          triggered_value: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          id?: string
          message: string
          metadata?: Json
          organization_id: string
          resolved_at?: string | null
          sensor_id?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          site_id?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          tank_id?: string | null
          threshold_value?: number | null
          title: string
          triggered_at?: string
          triggered_value?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          id?: string
          message?: string
          metadata?: Json
          organization_id?: string
          resolved_at?: string | null
          sensor_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          site_id?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          tank_id?: string | null
          threshold_value?: number | null
          title?: string
          triggered_at?: string
          triggered_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          completed_at: string | null
          created_at: string
          delivered_volume: number | null
          dispatched_at: string | null
          id: string
          metadata: Json
          notes: string | null
          organization_id: string
          planned_volume: number | null
          product: string | null
          reference_number: string
          scheduled_at: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          supplier: string | null
          tank_id: string | null
          updated_at: string
          volume_unit: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          delivered_volume?: number | null
          dispatched_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          planned_volume?: number | null
          product?: string | null
          reference_number: string
          scheduled_at?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          supplier?: string | null
          tank_id?: string | null
          updated_at?: string
          volume_unit?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          delivered_volume?: number | null
          dispatched_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          planned_volume?: number | null
          product?: string | null
          reference_number?: string
          scheduled_at?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          supplier?: string | null
          tank_id?: string | null
          updated_at?: string
          volume_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          device_code: string
          device_type: string
          firmware_version: string | null
          gateway_id: string | null
          id: string
          last_seen_at: string | null
          manufacturer: string | null
          metadata: Json
          model: string | null
          name: string
          organization_id: string
          serial_number: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["device_status"]
          tank_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_code: string
          device_type: string
          firmware_version?: string | null
          gateway_id?: string | null
          id?: string
          last_seen_at?: string | null
          manufacturer?: string | null
          metadata?: Json
          model?: string | null
          name: string
          organization_id: string
          serial_number?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          tank_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_code?: string
          device_type?: string
          firmware_version?: string | null
          gateway_id?: string | null
          id?: string
          last_seen_at?: string | null
          manufacturer?: string | null
          metadata?: Json
          model?: string | null
          name?: string
          organization_id?: string
          serial_number?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          tank_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      gateways: {
        Row: {
          created_at: string
          firmware_version: string | null
          gateway_code: string
          id: string
          last_seen_at: string | null
          manufacturer: string | null
          metadata: Json
          model: string | null
          name: string
          organization_id: string
          serial_number: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["device_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          firmware_version?: string | null
          gateway_code: string
          id?: string
          last_seen_at?: string | null
          manufacturer?: string | null
          metadata?: Json
          model?: string | null
          name: string
          organization_id: string
          serial_number?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          firmware_version?: string | null
          gateway_code?: string
          id?: string
          last_seen_at?: string | null
          manufacturer?: string | null
          metadata?: Json
          model?: string | null
          name?: string
          organization_id?: string
          serial_number?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gateways_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateways_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          description: string | null
          id: string
          metadata: Json
          opened_at: string
          organization_id: string
          resolved_at: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["incident_status"]
          tank_id: string | null
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          metadata?: Json
          opened_at?: string
          organization_id: string
          resolved_at?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          tank_id?: string | null
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          metadata?: Json
          opened_at?: string
          organization_id?: string
          resolved_at?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          tank_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          configuration: Json
          created_at: string
          endpoint: string | null
          gateway_id: string | null
          id: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          last_connected_at: string | null
          last_error: string | null
          name: string
          organization_id: string
          site_id: string | null
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          endpoint?: string | null
          gateway_id?: string | null
          id?: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          last_connected_at?: string | null
          last_error?: string | null
          name: string
          organization_id: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          endpoint?: string | null
          gateway_id?: string | null
          id?: string
          integration_type?: Database["public"]["Enums"]["integration_type"]
          last_connected_at?: string | null
          last_error?: string | null
          name?: string
          organization_id?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      sensors: {
        Row: {
          created_at: string
          device_id: string | null
          gateway_id: string | null
          id: string
          max_value: number | null
          measurement: string
          metadata: Json
          min_value: number | null
          name: string
          organization_id: string
          sensor_code: string
          sensor_type: string
          site_id: string | null
          status: Database["public"]["Enums"]["sensor_status"]
          tank_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          gateway_id?: string | null
          id?: string
          max_value?: number | null
          measurement: string
          metadata?: Json
          min_value?: number | null
          name: string
          organization_id: string
          sensor_code: string
          sensor_type: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["sensor_status"]
          tank_id?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          gateway_id?: string | null
          id?: string
          max_value?: number | null
          measurement?: string
          metadata?: Json
          min_value?: number | null
          name?: string
          organization_id?: string
          sensor_code?: string
          sensor_type?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["sensor_status"]
          tank_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensors_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensors_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensors_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensors_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["site_status"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["site_status"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["site_status"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tanks: {
        Row: {
          capacity: number | null
          capacity_unit: string
          created_at: string
          description: string | null
          gateway_id: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          product: string | null
          site_id: string
          status: Database["public"]["Enums"]["tank_status"]
          tank_code: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          capacity_unit?: string
          created_at?: string
          description?: string | null
          gateway_id?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          product?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["tank_status"]
          tank_code: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          capacity_unit?: string
          created_at?: string
          description?: string | null
          gateway_id?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          product?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["tank_status"]
          tank_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tanks_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tanks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tanks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry: {
        Row: {
          device_id: string | null
          gateway_id: string | null
          id: string
          metadata: Json
          metric: string
          organization_id: string
          quality: string
          received_at: string
          recorded_at: string
          sensor_id: string | null
          site_id: string | null
          tank_id: string | null
          unit: string | null
          value: number
        }
        Insert: {
          device_id?: string | null
          gateway_id?: string | null
          id?: string
          metadata?: Json
          metric: string
          organization_id: string
          quality?: string
          received_at?: string
          recorded_at: string
          sensor_id?: string | null
          site_id?: string | null
          tank_id?: string | null
          unit?: string | null
          value: number
        }
        Update: {
          device_id?: string | null
          gateway_id?: string | null
          id?: string
          metadata?: Json
          metric?: string
          organization_id?: string
          quality?: string
          received_at?: string
          recorded_at?: string
          sensor_id?: string | null
          site_id?: string | null
          tank_id?: string | null
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_latest: {
        Row: {
          device_id: string | null
          gateway_id: string | null
          id: string
          metadata: Json
          metric: string
          organization_id: string
          quality: string
          received_at: string
          recorded_at: string
          sensor_id: string | null
          site_id: string | null
          tank_id: string | null
          unit: string | null
          updated_at: string
          value: number
        }
        Insert: {
          device_id?: string | null
          gateway_id?: string | null
          id?: string
          metadata?: Json
          metric: string
          organization_id: string
          quality?: string
          received_at?: string
          recorded_at: string
          sensor_id?: string | null
          site_id?: string | null
          tank_id?: string | null
          unit?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          device_id?: string | null
          gateway_id?: string | null
          id?: string
          metadata?: Json
          metric?: string
          organization_id?: string
          quality?: string
          received_at?: string
          recorded_at?: string
          sensor_id?: string | null
          site_id?: string | null
          tank_id?: string | null
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_latest_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_latest_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_latest_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_latest_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_latest_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_latest_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_for_current_user: {
        Args: {
          organization_country?: string
          organization_industry?: string
          organization_name: string
          organization_slug: string
          organization_timezone?: string
        }
        Returns: {
          country: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      record_simulated_tank_telemetry: {
        Args: {
          p_flow_rate: number
          p_level: number
          p_organization_id: string
          p_site_id: string
          p_tank_id: string
          p_temperature: number
          p_totalized_volume: number
          p_volume_unit?: string
        }
        Returns: Json
      }
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical"
      alert_status: "open" | "acknowledged" | "resolved"
      delivery_status: "scheduled" | "in_transit" | "completed" | "cancelled"
      device_status: "online" | "offline" | "warning" | "maintenance"
      incident_status: "open" | "investigating" | "resolved" | "closed"
      integration_status:
        | "configured"
        | "connected"
        | "disconnected"
        | "error"
        | "disabled"
      integration_type: "mqtt" | "modbus" | "opcua" | "rest_api" | "simulator"
      organization_role: "owner" | "admin" | "operator" | "viewer"
      organization_status: "active" | "suspended" | "archived"
      sensor_status: "active" | "inactive" | "fault"
      site_status: "operational" | "maintenance" | "offline" | "archived"
      tank_status: "normal" | "warning" | "critical" | "offline" | "maintenance"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      alert_severity: ["info", "warning", "critical"],
      alert_status: ["open", "acknowledged", "resolved"],
      delivery_status: ["scheduled", "in_transit", "completed", "cancelled"],
      device_status: ["online", "offline", "warning", "maintenance"],
      incident_status: ["open", "investigating", "resolved", "closed"],
      integration_status: [
        "configured",
        "connected",
        "disconnected",
        "error",
        "disabled",
      ],
      integration_type: ["mqtt", "modbus", "opcua", "rest_api", "simulator"],
      organization_role: ["owner", "admin", "operator", "viewer"],
      organization_status: ["active", "suspended", "archived"],
      sensor_status: ["active", "inactive", "fault"],
      site_status: ["operational", "maintenance", "offline", "archived"],
      tank_status: ["normal", "warning", "critical", "offline", "maintenance"],
    },
  },
} as const
