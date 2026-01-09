/**
 * Database Types for AuraFlow
 * 
 * These types match the Supabase database schema exactly.
 * They are used to provide type safety for all database operations.
 * 
 * To regenerate these types from your Supabase schema:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          is_public: boolean;
          invite_code: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_public?: boolean;
          invite_code?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_public?: boolean;
          invite_code?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      members: {
        Row: {
          group_id: string;
          user_id: string;
          role: "admin" | "member";
          aura_points: number;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: "admin" | "member";
          aura_points?: number;
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          aura_points?: number;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          group_id: string;
          from_id: string;
          to_id: string | null;
          amount: number;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          from_id: string;
          to_id?: string | null;
          amount: number;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          from_id?: string;
          to_id?: string | null;
          amount?: number;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_from_id_fkey";
            columns: ["from_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_to_id_fkey";
            columns: ["to_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      rewards: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          cost: number;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          cost: number;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          cost?: number;
          icon?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types for working with the database
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific table types for easier use
export type Profile = Tables<"profiles">;
export type Group = Tables<"groups">;
export type Member = Tables<"members">;
export type Transaction = Tables<"transactions">;
export type Reward = Tables<"rewards">;

// Member with profile for leaderboard
export type MemberWithProfile = Member & {
  profile: Profile;
};

// Group with members count
export type GroupWithMembersCount = Group & {
  members_count: number;
};
