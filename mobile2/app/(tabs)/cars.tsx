import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  ActionButton,
  EmptyState,
  HeroCard,
  Panel,
  Pill,
  ScreenScroll,
  SectionTitle,
  SegmentedControl,
  StatCard,
} from '@/components/mobile-kit';
import { AppTheme } from '@/constants/app-theme';
import {
  ChatInboxItem,
  ChatMessage,
  CrawlCar,
  CrawlTask,
  ForumComment,
  ForumPost,
  TrainCar,
  UserLite,
  forumCreateComment,
  forumCreatePost,
  forumListComments,
  forumListPosts,
  getChatInbox,
  getChatMessages,
  getCrawlCars,
  getCrawlTasks,
  getTrainCars,
  listUsers,
  sendChatMessage,
} from '@/lib/api';
import {
  previewComments,
  previewCrawlCars,
  previewCrawlTasks,
  previewInbox,
  previewMessages,
  previewPosts,
  previewTrainCars,
  previewUsers,
} from '@/lib/mock-data';
import { isPreviewMode } from '@/lib/preview';
import { useAuth } from '@/lib/auth-context';

type Mode = 'data' | 'forum' | 'chat';

export default function WorkbenchScreen() {
  const { token, me } = useAuth();
  const previewMode = isPreviewMode();
  const [mode, setMode] = useState<Mode>('data');
  const [trainCars, setTrainCars] = useState<TrainCar[]>(previewTrainCars);
  const [crawlCars, setCrawlCars] = useState<CrawlCar[]>(previewCrawlCars);
  const [tasks, setTasks] = useState<CrawlTask[]>(previewCrawlTasks);
  const [posts, setPosts] = useState<ForumPost[]>(previewPosts);
  const [commentMap, setCommentMap] = useState<Record<number, ForumComment[]>>(previewComments);
  const [postInput, setPostInput] = useState('');
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [inbox, setInbox] = useState<ChatInboxItem[]>(previewInbox);
  const [users, setUsers] = useState<UserLite[]>(previewUsers);
  const [activeChatUserId, setActiveChatUserId] = useState<number>(previewInbox[0]?.user.id ?? 0);
  const [chatInput, setChatInput] = useState('');
  const [chatMap, setChatMap] = useState<Record<number, ChatMessage[]>>(previewMessages);
  const [error, setError] = useState('');

  const loadRemote = useCallback(async () => {
    if (!token || previewMode) return;
    try {
      const [trainRes, crawlRes, taskRes, postRes, inboxRes, userRes] = await Promise.all([
        getTrainCars(token, { page: 1, page_size: 6 }),
        getCrawlCars(token, { page: 1, page_size: 6 }),
        getCrawlTasks(),
        forumListPosts(token),
        getChatInbox(token),
        listUsers(token),
      ]);
      setTrainCars(trainRes.items || []);
      setCrawlCars(crawlRes.items || []);
      setTasks(Array.isArray(taskRes) ? taskRes : []);
      setPosts(Array.isArray(postRes) ? postRes : []);
      setInbox(Array.isArray(inboxRes) ? inboxRes : []);
      setUsers(Array.isArray(userRes) ? userRes : []);
      if (inboxRes[0]?.user.id) {
        setActiveChatUserId(inboxRes[0].user.id);
      }
    } catch (e: any) {
      setError(e?.message || '加载工作台失败');
    }
  }, [previewMode, token]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  useEffect(() => {
    if (!token || previewMode || !activeChatUserId) return;
    getChatMessages(token, activeChatUserId)
      .then((messages) => {
        setChatMap((prev) => ({ ...prev, [activeChatUserId]: messages || [] }));
      })
      .catch((e: any) => setError(e?.message || '读取聊天失败'));
  }, [activeChatUserId, previewMode, token]);

  const postComment = async (postId: number) => {
    const value = commentInput[postId]?.trim();
    if (!value) return;
    if (previewMode) {
      setCommentMap((prev) => ({
        ...prev,
        [postId]: [
          ...(prev[postId] || []),
          {
            id: Date.now(),
            post_id: postId,
            content: value,
            created_at: '刚刚',
            user: {
              id: me?.id || 0,
              username: me?.username || 'me',
              role: me?.role || 'buyer',
              avatar_path: null,
            },
          },
        ],
      }));
      setCommentInput((prev) => ({ ...prev, [postId]: '' }));
      return;
    }
    if (!token) return;
    try {
      await forumCreateComment(token, postId, value);
      const list = await forumListComments(token, postId);
      setCommentMap((prev) => ({ ...prev, [postId]: list }));
      setCommentInput((prev) => ({ ...prev, [postId]: '' }));
    } catch (e: any) {
      setError(e?.message || '评论失败');
    }
  };

  const createPost = async () => {
    const value = postInput.trim();
    if (!value) return;
    if (previewMode) {
      setPosts((prev) => [
        {
          id: Date.now(),
          content: value,
          created_at: '刚刚',
          user: { id: me?.id || 0, username: me?.username || 'me', role: me?.role || 'buyer', avatar_path: null },
        },
        ...prev,
      ]);
      setPostInput('');
      return;
    }
    if (!token) return;
    try {
      await forumCreatePost(token, value);
      setPostInput('');
      const list = await forumListPosts(token);
      setPosts(list);
    } catch (e: any) {
      setError(e?.message || '发帖失败');
    }
  };

  const sendMessage = async () => {
    const value = chatInput.trim();
    if (!value || !activeChatUserId) return;
    if (previewMode) {
      setChatMap((prev) => ({
        ...prev,
        [activeChatUserId]: [
          ...(prev[activeChatUserId] || []),
          {
            id: Date.now(),
            sender_id: me?.id || 0,
            receiver_id: activeChatUserId,
            content: value,
            created_at: '刚刚',
          },
        ],
      }));
      setChatInput('');
      return;
    }
    if (!token) return;
    try {
      await sendChatMessage(token, activeChatUserId, value);
      const list = await getChatMessages(token, activeChatUserId);
      setChatMap((prev) => ({ ...prev, [activeChatUserId]: list }));
      setChatInput('');
    } catch (e: any) {
      setError(e?.message || '发送失败');
    }
  };

  const activeMessages = useMemo(() => chatMap[activeChatUserId] || [], [activeChatUserId, chatMap]);
  const activeInboxUser = useMemo(
    () => inbox.find((item) => item.user.id === activeChatUserId)?.user || users[0] || null,
    [activeChatUserId, inbox, users]
  );

  return (
    <ScreenScroll>
      <HeroCard
        eyebrow="Workbench"
        title="移动工作台"
        subtitle="把网页端的数据、社区和消息能力收束进一个适合手机连续操作的空间。"
        right={<Pill text={mode === 'data' ? '数据' : mode === 'forum' ? '社区' : '消息'} tone="green" />}
      />

      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { label: '数据中心', value: 'data' },
          { label: '论坛社区', value: 'forum' },
          { label: '私信消息', value: 'chat' },
        ]}
      />

      {mode === 'data' ? (
        <>
          <View style={styles.row}>
            <StatCard label="采集车源" value={`${crawlCars.length}`} tone="orange" />
            <StatCard label="训练集" value={`${trainCars.length}`} tone="cyan" />
          </View>
          <Panel>
            <SectionTitle title="采集任务" subtitle="保留网页端任务概览，移动端优先展示状态与城市。" />
            {tasks.length ? (
              tasks.map((task) => (
                <View key={task.task_id} style={styles.listCard}>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={styles.cardTitle}>{task.city_name || '未命名任务'}</Text>
                    <Text style={styles.metaText}>页码范围：{task.start_page || 1} - {task.end_page || 1}</Text>
                    <Text style={styles.metaText}>创建时间：{task.created_at || '-'}</Text>
                  </View>
                  <Pill text={task.status || 'unknown'} tone={task.status === 'completed' ? 'green' : 'orange'} />
                </View>
              ))
            ) : (
              <EmptyState title="暂无任务" desc="可以从网页端发起任务，移动端负责跟踪状态。" />
            )}
          </Panel>

          <Panel>
            <SectionTitle title="最新车源" subtitle="抓取结果改成更适合手机扫读的卡片结构。" />
            {crawlCars.map((item) => (
              <View key={item.source_car_id} style={styles.listCard}>
                <Text style={styles.cardTitle}>{item.title || '未命名车辆'}</Text>
                <Text style={styles.metaText}>ID：{item.source_car_id || '-'}</Text>
                <Text style={styles.metaText}>当前售价：{String(item.info?.['当前售价'] ?? '-')} 万</Text>
                <Text style={styles.metaText}>抓取时间：{item.crawl_time || '-'}</Text>
              </View>
            ))}
          </Panel>

          <Panel>
            <SectionTitle title="训练集快览" subtitle="把买家页的核心价值浓缩进移动端摘要。" />
            {trainCars.map((item) => (
              <View key={item.id} style={styles.listCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.cardTitle}>{item.brand} {item.model}</Text>
                    <Text style={styles.metaText}>{item.city || '-'} · {item.year || '-'} · {item.gearbox || '-'}</Text>
                  </View>
                  <Text style={styles.priceText}>{item.price_wan.toFixed(1)} 万</Text>
                </View>
              </View>
            ))}
          </Panel>
        </>
      ) : null}

      {mode === 'forum' ? (
        <Panel>
          <SectionTitle title="论坛社区" subtitle="帖子和评论在手机上统一改成轻卡片流。" />
          <TextInput
            style={[styles.input, styles.textarea]}
            value={postInput}
            onChangeText={setPostInput}
            placeholder="分享你的行情观察、议价经验或数据见解"
            placeholderTextColor={AppTheme.textMuted}
            multiline
          />
          <ActionButton label="发布帖子" onPress={createPost} />
          <View style={{ gap: 12 }}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.cardTitle}>{post.user.username}</Text>
                    <Text style={styles.metaText}>{post.created_at}</Text>
                  </View>
                  <Pill text={post.user.role} tone="blue" />
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                {(commentMap[post.id] || []).map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <Text style={styles.commentAuthor}>{comment.user.username}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                ))}
                <TextInput
                  style={styles.input}
                  value={commentInput[post.id] || ''}
                  onChangeText={(value) => setCommentInput((prev) => ({ ...prev, [post.id]: value }))}
                  placeholder="写一条评论..."
                  placeholderTextColor={AppTheme.textMuted}
                />
                <ActionButton label="发送评论" tone="secondary" onPress={() => postComment(post.id)} />
              </View>
            ))}
          </View>
        </Panel>
      ) : null}

      {mode === 'chat' ? (
        <>
          <Panel>
            <SectionTitle title="会话列表" subtitle="把网页端的侧边栏压缩成横向联系人带。" />
            <View style={styles.chipRow}>
              {inbox.map((item) => {
                const active = item.user.id === activeChatUserId;
                return (
                  <Pressable
                    key={item.user.id}
                    onPress={() => setActiveChatUserId(item.user.id)}
                    style={[styles.userChip, active ? styles.userChipActive : null]}>
                    <Text style={[styles.userChipText, active ? styles.userChipTextActive : null]}>
                      {item.user.username}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Panel>

          <Panel>
            <SectionTitle
              title={activeInboxUser ? `与 ${activeInboxUser.username} 的会话` : '消息会话'}
              subtitle="保留网页端消息能力，但让输入和阅读区更紧凑。"
            />
            {activeMessages.length ? (
              activeMessages.map((msg) => {
                const mine = msg.sender_id === me?.id;
                return (
                  <View key={msg.id} style={[styles.messageBubble, mine ? styles.messageMine : styles.messageOther]}>
                    <Text style={styles.messageText}>{msg.content}</Text>
                  </View>
                );
              })
            ) : (
              <EmptyState title="暂无消息" desc="选择一个联系人开始聊天。" />
            )}
            <TextInput
              style={[styles.input, styles.textareaSmall]}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="输入消息..."
              placeholderTextColor={AppTheme.textMuted}
              multiline
            />
            <ActionButton label="发送消息" onPress={sendMessage} />
          </Panel>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  listCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    backgroundColor: '#0a1222',
    padding: 14,
    gap: 4,
  },
  cardTitle: {
    color: AppTheme.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metaText: {
    color: AppTheme.textMuted,
    lineHeight: 18,
  },
  priceText: {
    color: AppTheme.emerald,
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#0a1222',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 16,
    color: AppTheme.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  textareaSmall: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  postCard: {
    borderRadius: 20,
    backgroundColor: '#0a1222',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    padding: 14,
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postContent: {
    color: AppTheme.text,
    lineHeight: 21,
  },
  commentCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    gap: 3,
  },
  commentAuthor: {
    color: AppTheme.cyan,
    fontWeight: '700',
  },
  commentText: {
    color: AppTheme.textMuted,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    backgroundColor: '#0a1222',
  },
  userChipActive: {
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderColor: 'rgba(34, 211, 238, 0.28)',
  },
  userChipText: {
    color: AppTheme.textMuted,
    fontWeight: '700',
  },
  userChipTextActive: {
    color: AppTheme.text,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 14,
    maxWidth: '88%',
  },
  messageMine: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(34, 211, 238, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.24)',
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#0a1222',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  messageText: {
    color: AppTheme.text,
    lineHeight: 20,
  },
  error: {
    color: AppTheme.red,
  },
});
