export type UserMe = {
  id: number;
  email: string;
  username: string;
  role: string;
  full_name: string | null;
  is_active: number;
  created_at: string;
  avatar_path?: string | null;
};

export type TrainCar = {
  id: number;
  source_car_id: string;
  brand?: string | null;
  brand_confidence?: number | null;
  brand_source?: string | null;
  model?: string | null;
  year?: number | null;
  displacement?: number | null;
  gearbox?: string | null;
  transfer_count?: number | null;
  city?: string | null;
  price_wan: number;
};

export type PageResp<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

export type AdminOverview = {
  total_users: number;
  active_users: number;
  banned_users: number;
  total_crawl: number;
  total_train: number;
};

export type AdminMetrics = {
  cpu_percent: number;
  memory_percent: number;
  memory_total_gb: number;
  memory_used_gb: number;
  disk_percent: number;
  disk_total_gb: number;
  disk_used_gb: number;
};

export type AdminUser = {
  id: number;
  email: string;
  username: string;
  role: string;
  is_active: number;
  created_at: string;
};

export type CrawlCar = {
  car_id?: string;
  source_car_id?: string;
  title?: string;
  tags?: string[];
  info?: Record<string, string | number | null>;
  image_path?: string;
  image_url?: string;
  source_url?: string;
  params_url?: string | null;
  param_car_id?: string | null;
  vehicle_params?: {
    sections?: Array<{
      title?: string;
      items?: Array<{ name?: string; value?: string | number | null }>;
    }>;
    raw_lines?: string[];
    raw_text?: string;
    [key: string]: unknown;
  } | null;
  raw_data?: Record<string, unknown> | null;
  crawl_time?: string;
};

export type UserProfile = {
  id: number;
  username: string;
  role: string;
  email: string;
  full_name: string | null;
  avatar_path?: string | null;
  created_at: string;
};

export type ForumPost = {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    role: string;
    avatar_path?: string | null;
  };
};

export type ForumComment = {
  id: number;
  post_id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    role: string;
    avatar_path?: string | null;
  };
};

export type ChatMessage = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
};

export type ChatInboxItem = {
  user: {
    id: number;
    username: string;
    role: string;
    avatar_path?: string | null;
  };
  last_message: string;
  last_time: string;
};

export type UserLite = {
  id: number;
  username: string;
  role: string;
  avatar_path?: string | null;
};
