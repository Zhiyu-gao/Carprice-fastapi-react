import type {
  AiMessage,
  AiSession,
  ChatInboxItem,
  ChatMessage,
  CrawlCar,
  CrawlTask,
  ForumComment,
  ForumPost,
  RagDoc,
  TrainCar,
  UserLite,
  UserMe,
  UserProfile,
} from '@/lib/api';

export const previewMe: UserMe = {
  id: 1,
  email: 'preview@nrydawang.shop',
  username: 'zhiyu',
  role: 'admin',
  full_name: 'Preview User',
  is_active: 1,
  created_at: '2026-03-27T10:00:00',
  avatar_path: null,
};

export const previewProfile: UserProfile = {
  id: 1,
  email: 'preview@nrydawang.shop',
  username: 'zhiyu',
  role: 'admin',
  full_name: 'Preview User',
  avatar_path: null,
  created_at: '2026-03-27T10:00:00',
};

export const previewTrainCars: TrainCar[] = [
  { id: 1, source_car_id: 'A1001', brand: '特斯拉', model: 'Model 3 后驱', year: 2023, displacement: 0, gearbox: '电动车单速', transfer_count: 0, city: '上海', price_wan: 21.8 },
  { id: 2, source_car_id: 'A1002', brand: '宝马', model: '325Li M 运动', year: 2022, displacement: 2, gearbox: '自动', transfer_count: 1, city: '杭州', price_wan: 22.6 },
  { id: 3, source_car_id: 'A1003', brand: '理想', model: 'L7 Pro', year: 2024, displacement: 1.5, gearbox: '自动', transfer_count: 0, city: '深圳', price_wan: 29.2 },
];

export const previewCrawlCars: CrawlCar[] = [
  {
    source_car_id: 'CR-001',
    title: '2023款 特斯拉 Model Y 后轮驱动版',
    crawl_time: '2026-03-27 10:11:00',
    info: { 当前售价: 24.9, 表显里程: '2.6万公里', 车龄: '2年' },
  },
  {
    source_car_id: 'CR-002',
    title: '2022款 宝马 325Li M 运动套装',
    crawl_time: '2026-03-27 10:18:00',
    info: { 当前售价: 22.8, 表显里程: '3.1万公里', 车龄: '3年' },
  },
  {
    source_car_id: 'CR-003',
    title: '2024款 理想 L7 Pro',
    crawl_time: '2026-03-27 10:24:00',
    info: { 当前售价: 29.9, 表显里程: '0.8万公里', 车龄: '1年' },
  },
];

export const previewCrawlTasks: CrawlTask[] = [
  {
    task_id: 'task-shanghai',
    city_name: '上海',
    status: 'running',
    start_page: 1,
    end_page: 12,
    created_at: '2026-03-27 09:58:00',
  },
  {
    task_id: 'task-hangzhou',
    city_name: '杭州',
    status: 'completed',
    start_page: 1,
    end_page: 6,
    created_at: '2026-03-27 08:32:00',
  },
];

export const previewPosts: ForumPost[] = [
  {
    id: 1,
    content: '最近 Model Y 二手成交价明显回暖，大家体感如何？',
    created_at: '2026-03-27 09:20:00',
    user: { id: 2, username: 'buyer_chen', role: 'buyer', avatar_path: null },
  },
  {
    id: 2,
    content: '我把 AI 分析和历史训练集一起看，感觉对议价特别有帮助。',
    created_at: '2026-03-27 08:40:00',
    user: { id: 3, username: 'seller_wu', role: 'seller', avatar_path: null },
  },
];

export const previewComments: Record<number, ForumComment[]> = {
  1: [
    {
      id: 11,
      post_id: 1,
      content: '上海这边确实热了，尤其是低里程车源。',
      created_at: '2026-03-27 09:31:00',
      user: { id: 3, username: 'seller_wu', role: 'seller', avatar_path: null },
    },
  ],
  2: [
    {
      id: 12,
      post_id: 2,
      content: '预测页的估值和论坛经验帖一起看，会更有底气。',
      created_at: '2026-03-27 08:54:00',
      user: { id: 2, username: 'buyer_chen', role: 'buyer', avatar_path: null },
    },
  ],
};

export const previewUsers: UserLite[] = [
  { id: 2, username: 'buyer_chen', role: 'buyer', avatar_path: null },
  { id: 3, username: 'seller_wu', role: 'seller', avatar_path: null },
  { id: 4, username: 'admin_li', role: 'admin', avatar_path: null },
];

export const previewInbox: ChatInboxItem[] = [
  {
    user: { id: 2, username: 'buyer_chen', role: 'buyer', avatar_path: null },
    last_message: '这台 325Li 你觉得还能谈多少？',
    last_time: '2026-03-27 09:42:00',
  },
  {
    user: { id: 3, username: 'seller_wu', role: 'seller', avatar_path: null },
    last_message: '我刚把论坛里的成交案例整理好了。',
    last_time: '2026-03-27 08:58:00',
  },
];

export const previewMessages: Record<number, ChatMessage[]> = {
  2: [
    { id: 1, sender_id: 2, receiver_id: 1, content: '这台 325Li 你觉得还能谈多少？', created_at: '2026-03-27 09:40:00' },
    { id: 2, sender_id: 1, receiver_id: 2, content: '按平台均价看，我建议先从 22.2 万去试探。', created_at: '2026-03-27 09:42:00' },
  ],
  3: [
    { id: 3, sender_id: 3, receiver_id: 1, content: '我刚把论坛里的成交案例整理好了。', created_at: '2026-03-27 08:58:00' },
  ],
};

export const previewAiSessions: AiSession[] = [
  { id: 'session-1', title: '特斯拉行情分析', created_at: '2026-03-27 09:00:00', updated_at: '2026-03-27 09:18:00' },
  { id: 'session-2', title: '325Li 比价建议', created_at: '2026-03-27 08:10:00', updated_at: '2026-03-27 08:48:00' },
];

export const previewAiMessages: AiMessage[] = [
  { role: 'user', content: '帮我判断一台 2023 年 Model Y 24.9 万是否值得入手' },
  { role: 'ai', content: '结合你当前截图里的里程、车龄和训练集均价，这个价格处于合理区间偏低位，建议重点核查电池健康和出险记录。' },
];

export const previewDocs: RagDoc[] = [
  { id: 'doc-1', filename: '上海成交案例汇总.md', created_at: '2026-03-20 12:00:00' },
  { id: 'doc-2', filename: '宝马 3 系价格带.txt', created_at: '2026-03-21 18:30:00' },
];
