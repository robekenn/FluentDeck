export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      languages: {
        Row: {
          user_id: string;
          id: string;
          name: string;
          code: string;
          direction: "ltr" | "rtl";
          accent: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          id?: string;
          name: string;
          code?: string;
          direction?: "ltr" | "rtl";
          accent?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          id?: string;
          name?: string;
          code?: string;
          direction?: "ltr" | "rtl";
          accent?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      decks: {
        Row: {
          user_id: string;
          id: string;
          language_id: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          id?: string;
          language_id: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          id?: string;
          language_id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          user_id: string;
          id: string;
          deck_id: string;
          front: string;
          back: string;
          transliteration: string;
          example: string;
          notes: string;
          tags: string[];
          due_date: string;
          interval_days: number;
          ease_factor: number;
          repetitions: number;
          lapses: number;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          id?: string;
          deck_id: string;
          front: string;
          back: string;
          transliteration?: string;
          example?: string;
          notes?: string;
          tags?: string[];
          due_date?: string;
          interval_days?: number;
          ease_factor?: number;
          repetitions?: number;
          lapses?: number;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          id?: string;
          deck_id?: string;
          front?: string;
          back?: string;
          transliteration?: string;
          example?: string;
          notes?: string;
          tags?: string[];
          due_date?: string;
          interval_days?: number;
          ease_factor?: number;
          repetitions?: number;
          lapses?: number;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};