import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  slug: string;
  type: 'video' | 'graphic' | 'graphics' | 'marketing' | 'both' | 'all';
  order_num: number;
  active: boolean;
};

export type Video = {
  id: string;
  title: string;
  category_id: string;
  tier: 'premium' | 'standard';
  video_url: string;
  thumbnail_url: string;
  description: string;
  order_num: number;
  active: boolean;
  created_at: string;
  categories?: Category;
};

export type Graphic = {
  id: string;
  title: string;
  category_id: string;
  image_url: string;
  description: string;
  order_num: number;
  active: boolean;
  created_at: string;
  categories?: Category;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: string;
};

export type NavItem = {
  id: string;
  label: string;
  url: string;
  order_num: number;
  active: boolean;
};
