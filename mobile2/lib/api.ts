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

export type PredictPayload = {
  brand: string;
  age_years: number;
  engine: number;
  gearbox: string;
  transfer_cnt: number;
  price_new: number;
};

export type PredictResp = {
  predicted_price: number;
  price_unit: string;
};

export type CrawlCar = {
  source_car_id?: string;
  title?: string;
  crawl_time?: string;
  info?: Record<string, string | number | null>;
};

export type PageResp<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

export type RegisterPayload = {
  email: string;
  code: string;
  username: string;
  role: 'buyer' | 'seller';
  full_name?: string;
  password: string;
};

export type TrainCar = {
  id: number;
  source_car_id: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  displacement?: number | null;
  gearbox?: string | null;
  transfer_count?: number | null;
  city?: string | null;
  price_wan: number;
};

export type CrawlTask = {
  task_id: string;
  city_name?: string;
  status?: string;
  start_page?: number;
  end_page?: number;
  created_at?: string;
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

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
const AI_BASE_URL = process.env.EXPO_PUBLIC_AI_BASE_URL || 'http://127.0.0.1:8080';

export type AiProvider = 'qwen' | 'kimi' | 'deepseek';

export type AiSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type AiMessage = {
  id?: string;
  role: 'user' | 'ai' | 'assistant';
  content: string;
  created_at?: string;
};

export type RagDoc = {
  id: string;
  filename: string;
  created_at?: string;
};

export type RagSearchHit = {
  content: string;
  filename: string;
  score: number;
};

function withQuery(path: string, params?: Record<string, string | number | undefined>) {
  if (!params) return path;
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `${path}?${q}` : path;
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      detail = e?.detail || e?.message || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

async function requestAI<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${AI_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      detail = e?.detail || e?.message || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const body = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      detail = e?.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

export function sendEmailCode(email: string) {
  return request<{ message: string }>(
    '/auth/email/code',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    undefined
  );
}

export function register(payload: RegisterPayload) {
  return request<UserMe>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    undefined
  );
}

export function getMe(token: string) {
  return request<UserMe>('/me', undefined, token);
}

export function predict(payload: PredictPayload, token: string) {
  return request<PredictResp>(
    '/predict',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export function getCrawlCars(
  token: string,
  params: { page: number; page_size: number; keyword?: string }
) {
  return request<PageResp<CrawlCar>>(withQuery('/crawl-cars', params), undefined, token);
}

export function getTrainCars(token: string, params: { page: number; page_size: number }) {
  return request<PageResp<TrainCar>>(withQuery('/train-cars', params), undefined, token);
}

export function getCrawlTasks() {
  return request<CrawlTask[]>('/crawl-tasks');
}

export function forumListPosts(token: string) {
  return request<ForumPost[]>('/forum/posts', undefined, token);
}

export function forumCreatePost(token: string, content: string) {
  return request<{ ok: boolean; id: number }>(
    '/forum/posts',
    { method: 'POST', body: JSON.stringify({ content }) },
    token
  );
}

export function forumListComments(token: string, postId: number) {
  return request<ForumComment[]>(`/forum/posts/${postId}/comments`, undefined, token);
}

export function forumCreateComment(token: string, postId: number, content: string) {
  return request<{ ok: boolean; id: number }>(
    `/forum/posts/${postId}/comments`,
    { method: 'POST', body: JSON.stringify({ content }) },
    token
  );
}

export function listUsers(token: string) {
  return request<UserLite[]>('/users', undefined, token);
}

export function getUserProfile(token: string, userId: number) {
  return request<UserProfile>(`/users/${userId}`, undefined, token);
}

export function getChatInbox(token: string) {
  return request<ChatInboxItem[]>('/chat/inbox', undefined, token);
}

export function getChatMessages(token: string, userId: number) {
  return request<ChatMessage[]>(`/chat/${userId}`, undefined, token);
}

export function sendChatMessage(token: string, userId: number, content: string) {
  return request<{ ok: boolean; id: number }>(
    `/chat/${userId}`,
    { method: 'POST', body: JSON.stringify({ content }) },
    token
  );
}

export function aiListSessions(token: string) {
  return requestAI<AiSession[]>('/ai/chat/sessions', undefined, token);
}

export function aiCreateSession(token: string, title?: string) {
  return requestAI<AiSession>(
    '/ai/chat/sessions',
    {
      method: 'POST',
      body: JSON.stringify({ title: title || '新对话' }),
    },
    token
  );
}

export function aiListMessages(token: string, sessionId: string) {
  return requestAI<AiMessage[]>(`/ai/chat/sessions/${sessionId}/messages`, undefined, token);
}

export function aiDeleteSession(token: string, sessionId: string) {
  return requestAI<{ ok: boolean }>(
    `/ai/chat/sessions/${sessionId}`,
    { method: 'DELETE' },
    token
  );
}

function parseSseText(raw: string) {
  const lines = raw.split('\n');
  let full = '';
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const json = JSON.parse(payload);
      if (json?.delta) {
        full += String(json.delta);
      }
    } catch {}
  }
  return full.trim();
}

export async function aiChatOnce(
  token: string,
  payload: {
    question: string;
    provider: AiProvider;
    session_id?: string;
    rag_enabled?: boolean;
    mcp_enabled?: boolean;
  }
) {
  const res = await fetch(`${AI_BASE_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      detail = e?.detail || e?.message || detail;
    } catch {}
    throw new Error(detail);
  }
  const raw = await res.text();
  const text = parseSseText(raw);
  if (!text) {
    throw new Error('AI 返回为空');
  }
  return text;
}

export function ragListDocs(token: string) {
  return requestAI<RagDoc[]>('/ai/rag/docs', undefined, token);
}

export function ragSearch(token: string, query: string) {
  return requestAI<RagSearchHit[]>(
    '/ai/rag/search',
    {
      method: 'POST',
      body: JSON.stringify({ query }),
    },
    token
  );
}

export async function ragUploadText(token: string, filename: string, content: string) {
  const form = new FormData();
  const blob = new Blob([content], { type: 'text/plain' });
  form.append('file', blob, filename || 'mobile-note.txt');

  const res = await fetch(`${AI_BASE_URL}/ai/rag/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      detail = e?.detail || e?.message || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<RagDoc>;
}

export function ragDelete(token: string, docId: string) {
  return requestAI<{ ok: boolean }>(`/ai/rag/docs/${docId}`, { method: 'DELETE' }, token);
}
