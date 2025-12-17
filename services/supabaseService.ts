
import { supabase } from './supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

// Table names mapping from local store names to Supabase table names
export const TABLES = {
  SPACES: 'spaces',
  LISTS: 'lists',
  TASKS: 'tasks',
  PRODUCTS: 'products',
  AI_TOOLS: 'ai_tools',
  PROJECTS: 'projects',
  TEMPLATES: 'project_templates',
  TRANSACTIONS: 'transactions',
  FOLDER_ITEMS: 'folder_items',
  NOTIFICATIONS: 'notifications',
  BOOKS: 'books',
  CHAPTERS: 'chapters',
  COMMENTS: 'task_comments'
};

export const supabaseService = {
  
  async getAll<T>(table: string): Promise<T[]> {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return data as T[];
  },

  async addItem<T>(table: string, item: any): Promise<T> {
    // Remove "id" if needed or ensure Supabase accepts provided UUIDs.
    // Our schema defaults ID to uuid_generate_v4(), but if we provide one, it uses it.
    // We also need to inject current user_id for RLS to work/insert to be valid.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const itemWithUser = { ...item, user_id: user.id };

    const { data, error } = await supabase.from(table).insert(itemWithUser).select().single();
    if (error) throw error;
    return data as T;
  },

  async updateItem<T>(table: string, id: string, updates: any): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as T;
  },

  async deleteItem(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }
};
