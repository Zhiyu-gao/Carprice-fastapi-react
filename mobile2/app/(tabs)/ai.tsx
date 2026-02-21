import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppTheme } from '@/constants/app-theme';
import {
  AiMessage,
  AiProvider,
  AiSession,
  RagDoc,
  RagSearchHit,
  aiChatOnce,
  aiCreateSession,
  aiDeleteSession,
  aiListMessages,
  aiListSessions,
  ragDelete,
  ragListDocs,
  ragSearch,
  ragUploadText,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AiScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<AiProvider>('qwen');
  const [ragEnabled, setRagEnabled] = useState(false);
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [question, setQuestion] = useState('');

  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);

  const [docs, setDocs] = useState<RagDoc[]>([]);
  const [ragQuery, setRagQuery] = useState('');
  const [ragHits, setRagHits] = useState<RagSearchHit[]>([]);
  const [uploadName, setUploadName] = useState('mobile-note.txt');
  const [uploadText, setUploadText] = useState('');

  const activeProviderLabel = useMemo(() => provider.toUpperCase(), [provider]);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    const list = await aiListSessions(token);
    setSessions(Array.isArray(list) ? list : []);
    if (!sessionId && list[0]?.id) setSessionId(list[0].id);
  }, [sessionId, token]);

  const loadMessages = useCallback(async () => {
    if (!token || !sessionId) return;
    const list = await aiListMessages(token, sessionId);
    setMessages(Array.isArray(list) ? list : []);
  }, [sessionId, token]);

  const loadDocs = useCallback(async () => {
    if (!token) return;
    const list = await ragListDocs(token);
    setDocs(Array.isArray(list) ? list : []);
  }, [token]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token || !mounted) return;
      try {
        setError('');
        await Promise.all([loadSessions(), loadDocs()]);
      } catch (e: any) {
        if (mounted) setError(e?.message || '初始化 AI 页面失败');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadDocs, loadSessions, token]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const createSession = async () => {
    if (!token) return;
    try {
      const s = await aiCreateSession(token, '新对话');
      setSessionId(s.id);
      await loadSessions();
      setMessages([]);
    } catch (e: any) {
      setError(e?.message || '创建会话失败');
    }
  };

  const removeSession = async (id: string) => {
    if (!token) return;
    try {
      await aiDeleteSession(token, id);
      if (sessionId === id) {
        setSessionId(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (e: any) {
      setError(e?.message || '删除会话失败');
    }
  };

  const ask = async () => {
    if (!token || !question.trim()) return;
    const q = question.trim();
    setQuestion('');
    setLoading(true);
    setError('');
    try {
      let sid = sessionId;
      if (!sid) {
        const s = await aiCreateSession(token, q.slice(0, 20));
        sid = s.id;
        setSessionId(sid);
      }
      setMessages((prev) => [...prev, { role: 'user', content: q }]);
      const answer = await aiChatOnce(token, {
        question: q,
        provider,
        session_id: sid || undefined,
        rag_enabled: ragEnabled,
        mcp_enabled: mcpEnabled,
      });
      setMessages((prev) => [...prev, { role: 'ai', content: answer }]);
      await loadSessions();
    } catch (e: any) {
      setError(e?.message || '提问失败');
    } finally {
      setLoading(false);
    }
  };

  const doRagSearch = async () => {
    if (!token || !ragQuery.trim()) return;
    try {
      const hits = await ragSearch(token, ragQuery.trim());
      setRagHits(Array.isArray(hits) ? hits : []);
    } catch (e: any) {
      setError(e?.message || 'RAG 检索失败');
    }
  };

  const onUploadDoc = async () => {
    if (!token) return;
    if (!uploadText.trim()) {
      setError('请先输入要上传到RAG的文本内容');
      return;
    }
    try {
      await ragUploadText(token, uploadName.trim() || 'mobile-note.txt', uploadText.trim());
      setUploadText('');
      await loadDocs();
    } catch (e: any) {
      setError(e?.message || '上传失败');
    }
  };

  const onDeleteDoc = async (docId: string) => {
    if (!token) return;
    try {
      await ragDelete(token, docId);
      await loadDocs();
    } catch (e: any) {
      setError(e?.message || '删除文档失败');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>AI 助手</Text>
        <Text style={styles.sub}>当前模型：{activeProviderLabel}</Text>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.providerRow}>
        {(['qwen', 'kimi', 'deepseek'] as AiProvider[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.providerBtn, provider === p ? styles.providerBtnActive : null]}
            onPress={() => setProvider(p)}>
            <Text style={[styles.providerText, provider === p ? styles.providerTextActive : null]}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>RAG 检索</Text>
        <Switch value={ragEnabled} onValueChange={setRagEnabled} />
        <Text style={styles.switchLabel}>MCP 工具</Text>
        <Switch value={mcpEnabled} onValueChange={setMcpEnabled} />
      </View>

      <View style={styles.sessionRow}>
        <Pressable onPress={createSession} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>新建会话</Text>
        </Pressable>
        <FlatList
          horizontal
          data={sessions}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.sessionChip}>
              <Pressable onPress={() => setSessionId(item.id)}>
                <Text style={[styles.sessionText, sessionId === item.id ? styles.sessionTextActive : null]}>
                  {item.title}
                </Text>
              </Pressable>
              <Pressable onPress={() => removeSession(item.id)}>
                <Text style={styles.deleteText}>删除</Text>
              </Pressable>
            </View>
          )}
        />
      </View>

      <ScrollView style={styles.messagesBox}>
        {messages.map((m, i) => (
          <View key={`${m.role}-${i}`} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}
        {loading ? <ActivityIndicator color="#22d3ee" style={{ marginTop: 8 }} /> : null}
      </ScrollView>

      <View style={styles.askRow}>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="输入你的问题"
          placeholderTextColor="#64748b"
        />
        <Pressable style={styles.sendBtn} onPress={ask} disabled={loading}>
          <Text style={styles.sendBtnText}>发送</Text>
        </Pressable>
      </View>

      <View style={styles.ragSection}>
        <Text style={styles.ragTitle}>RAG 文档({docs.length})</Text>
        <TextInput
          style={styles.input}
          value={uploadName}
          onChangeText={setUploadName}
          placeholder="上传文件名（如 note.txt）"
          placeholderTextColor="#64748b"
        />
        <TextInput
          style={[styles.input, { minHeight: 84 }]}
          value={uploadText}
          onChangeText={setUploadText}
          multiline
          textAlignVertical="top"
          placeholder="输入要写入RAG的文本内容"
          placeholderTextColor="#64748b"
        />
        <View style={styles.docActionRow}>
          <Pressable style={styles.actionBtn} onPress={onUploadDoc}>
            <Text style={styles.actionBtnText}>上传文本</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={loadDocs}>
            <Text style={styles.actionBtnText}>刷新文档</Text>
          </Pressable>
        </View>
        {docs.slice(0, 3).map((d) => (
          <View key={d.id} style={styles.docRow}>
            <Text style={styles.docName} numberOfLines={1}>
              {d.filename}
            </Text>
            <Pressable onPress={() => onDeleteDoc(d.id)}>
              <Text style={styles.deleteText}>删除</Text>
            </Pressable>
          </View>
        ))}
        <TextInput
          style={styles.input}
          value={ragQuery}
          onChangeText={setRagQuery}
          placeholder="输入检索词"
          placeholderTextColor="#64748b"
        />
        <Pressable style={styles.actionBtn} onPress={doRagSearch}>
          <Text style={styles.actionBtnText}>检索</Text>
        </Pressable>
        {ragHits.slice(0, 3).map((h, idx) => (
          <View key={`${h.filename}-${idx}`} style={styles.hitCard}>
            <Text style={styles.hitFile}>{h.filename}</Text>
            <Text style={styles.hitScore}>score: {h.score?.toFixed?.(4) ?? '-'}</Text>
            <Text style={styles.hitText} numberOfLines={4}>
              {h.content}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.bg,
    padding: 14,
    gap: 12,
  },
  hero: {
    backgroundColor: AppTheme.card,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 3,
  },
  title: {
    color: AppTheme.text,
    fontSize: 24,
    fontWeight: '700',
  },
  sub: {
    color: AppTheme.textMuted,
  },
  error: {
    color: AppTheme.red,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  providerBtn: {
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: AppTheme.bgSoft,
  },
  providerBtnActive: {
    borderColor: AppTheme.cyan,
    backgroundColor: '#092335',
  },
  providerText: {
    color: AppTheme.textMuted,
    fontWeight: '600',
  },
  providerTextActive: {
    color: AppTheme.cyan,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppTheme.card,
    borderWidth: 1,
    borderColor: AppTheme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  switchLabel: {
    color: AppTheme.text,
    fontSize: 13,
  },
  sessionRow: {
    gap: 8,
  },
  actionBtn: {
    backgroundColor: AppTheme.cyan,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    color: AppTheme.bg,
    fontWeight: '700',
  },
  sessionChip: {
    backgroundColor: AppTheme.cardStrong,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionText: {
    color: AppTheme.textMuted,
  },
  sessionTextActive: {
    color: AppTheme.cyan,
    fontWeight: '700',
  },
  deleteText: {
    color: AppTheme.red,
    fontSize: 12,
  },
  messagesBox: {
    flex: 1,
    backgroundColor: AppTheme.bgSoft,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  bubble: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    maxWidth: '90%',
  },
  userBubble: {
    backgroundColor: '#0e3250',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#1a2840',
    alignSelf: 'flex-start',
  },
  bubbleText: {
    color: AppTheme.text,
    lineHeight: 20,
  },
  askRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: AppTheme.bgSoft,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: AppTheme.text,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  sendBtn: {
    backgroundColor: AppTheme.cyan,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sendBtnText: {
    color: AppTheme.bg,
    fontWeight: '700',
  },
  ragSection: {
    gap: 8,
    backgroundColor: AppTheme.card,
    borderWidth: 1,
    borderColor: AppTheme.border,
    borderRadius: 12,
    padding: 10,
  },
  docActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppTheme.cardStrong,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  docName: {
    color: AppTheme.text,
    flex: 1,
    marginRight: 10,
  },
  ragTitle: {
    color: AppTheme.text,
    fontWeight: '700',
  },
  hitCard: {
    backgroundColor: AppTheme.cardStrong,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  hitFile: {
    color: AppTheme.cyan,
    fontWeight: '700',
  },
  hitScore: {
    color: AppTheme.textMuted,
    fontSize: 12,
  },
  hitText: {
    color: AppTheme.text,
  },
});
