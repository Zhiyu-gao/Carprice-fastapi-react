import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ActionButton,
  HeroCard,
  Panel,
  Pill,
  ScreenScroll,
  SectionTitle,
  SegmentedControl,
} from '@/components/mobile-kit';
import { AppTheme } from '@/constants/app-theme';
import {
  AiMessage,
  AiProvider,
  RagDoc,
  aiChatOnce,
  aiCreateSession,
  aiListMessages,
  aiListSessions,
  ragDelete,
  ragListDocs,
  ragUploadText,
} from '@/lib/api';
import { previewAiMessages, previewAiSessions, previewDocs } from '@/lib/mock-data';
import { isPreviewMode } from '@/lib/preview';
import { useAuth } from '@/lib/auth-context';

type Mode = 'chat' | 'docs';

export default function AiScreen() {
  const { token } = useAuth();
  const previewMode = isPreviewMode();
  const [mode, setMode] = useState<Mode>('chat');
  const [provider, setProvider] = useState<AiProvider>('qwen');
  const [ragEnabled, setRagEnabled] = useState(true);
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>(previewAiMessages);
  const [docs, setDocs] = useState<RagDoc[]>(previewDocs);
  const [sessionId, setSessionId] = useState<string | null>(previewAiSessions[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadText, setUploadText] = useState('这是一段用于移动端演示的知识库文档，适合在视频里展示上传效果。');

  const loadRemote = useCallback(async () => {
    if (!token || previewMode) return;
    try {
      const [sessions, documents] = await Promise.all([aiListSessions(token), ragListDocs(token)]);
      setSessionId(sessions[0]?.id ?? null);
      setDocs(Array.isArray(documents) ? documents : []);
    } catch (e: any) {
      setError(e?.message || '加载 AI 数据失败');
    }
  }, [previewMode, token]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  useEffect(() => {
    if (!token || !sessionId || previewMode) return;
    aiListMessages(token, sessionId)
      .then((list) => setMessages(Array.isArray(list) ? list : []))
      .catch((e: any) => setError(e?.message || '读取会话失败'));
  }, [previewMode, sessionId, token]);

  const ask = async () => {
    if (!question.trim()) return;
    if (previewMode) {
      const q = question.trim();
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: q },
        { role: 'ai', content: '这是截图预览模式下的示例回答。真实环境会连到多模型 AI 服务与 RAG 知识库。' },
      ]);
      setQuestion('');
      return;
    }
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      let sid = sessionId;
      if (!sid) {
        const session = await aiCreateSession(token, question.slice(0, 18));
        sid = session.id;
        setSessionId(sid);
      }
      const q = question.trim();
      setMessages((prev) => [...prev, { role: 'user', content: q }]);
      setQuestion('');
      const answer = await aiChatOnce(token, {
        question: q,
        provider,
        session_id: sid || undefined,
        rag_enabled: ragEnabled,
        mcp_enabled: mcpEnabled,
      });
      setMessages((prev) => [...prev, { role: 'ai', content: answer }]);
    } catch (e: any) {
      setError(e?.message || '提问失败');
    } finally {
      setLoading(false);
    }
  };

  const uploadDoc = async () => {
    if (!uploadText.trim()) return;
    if (previewMode) {
      setDocs((prev) => [{ id: `doc-${prev.length + 1}`, filename: 'mobile-preview-note.txt' }, ...prev]);
      setUploadText('');
      return;
    }
    if (!token) return;
    try {
      await ragUploadText(token, 'mobile-preview-note.txt', uploadText);
      setUploadText('');
      await loadRemote();
    } catch (e: any) {
      setError(e?.message || '上传失败');
    }
  };

  const removeDoc = async (docId: string) => {
    if (previewMode) {
      setDocs((prev) => prev.filter((doc) => doc.id !== docId));
      return;
    }
    if (!token) return;
    try {
      await ragDelete(token, docId);
      await loadRemote();
    } catch (e: any) {
      setError(e?.message || '删除文档失败');
    }
  };

  return (
    <ScreenScroll>
      <HeroCard
        eyebrow="AI Assistant"
        title="多模型问答工作流"
        subtitle="保留网页端的 provider 切换、RAG 和 MCP 组合，同时把知识库管理也压进了手机端。"
        right={<Pill text={provider.toUpperCase()} tone="pink" />}
      />

      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { label: '对话', value: 'chat' },
          { label: '知识库', value: 'docs' },
        ]}
      />

      <Panel>
        <SectionTitle title="模型控制" subtitle="针对移动场景保留最常用的切换项。" />
        <View style={styles.providerRow}>
          {(['qwen', 'kimi', 'deepseek'] as AiProvider[]).map((item) => {
            const active = item === provider;
            return (
              <Pressable
                key={item}
                style={[styles.providerChip, active ? styles.providerChipActive : null]}
                onPress={() => setProvider(item)}>
                <Text style={[styles.providerText, active ? styles.providerTextActive : null]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>RAG</Text>
          <Switch value={ragEnabled} onValueChange={setRagEnabled} />
          <Text style={styles.switchLabel}>MCP</Text>
          <Switch value={mcpEnabled} onValueChange={setMcpEnabled} />
        </View>
      </Panel>

      {mode === 'chat' ? (
        <Panel>
          <SectionTitle title="会话窗口" subtitle="面向手机重构成可读性更强的气泡流。 " />
          <View style={{ gap: 10 }}>
            {messages.map((msg, index) => (
              <View
                key={`${msg.role}-${index}`}
                style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={styles.bubbleLabel}>{msg.role === 'user' ? '你' : 'AI'}</Text>
                <Text style={styles.bubbleText}>{msg.content}</Text>
              </View>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={question}
            onChangeText={setQuestion}
            placeholder="例如：帮我判断一台低里程 Model Y 是否值得买"
            placeholderTextColor={AppTheme.textMuted}
            multiline
          />
          <ActionButton label={loading ? '生成中...' : '发送问题'} onPress={ask} disabled={loading} />
          {loading ? <ActivityIndicator color={AppTheme.cyan} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Panel>
      ) : (
        <Panel>
          <SectionTitle title="知识库文档" subtitle="上传、查看、清理都能在手机端直接完成。" />
          <TextInput
            style={[styles.input, styles.textarea]}
            value={uploadText}
            onChangeText={setUploadText}
            placeholder="把适合保存在知识库中的文本粘贴到这里"
            placeholderTextColor={AppTheme.textMuted}
            multiline
          />
          <ActionButton label="上传文本到知识库" onPress={uploadDoc} />
          <View style={{ gap: 10 }}>
            {docs.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Pill text="RAG 文档" tone="blue" />
                  <Text style={styles.docName}>{doc.filename}</Text>
                </View>
                <ActionButton label="删除" tone="secondary" onPress={() => removeDoc(doc.id)} />
              </View>
            ))}
          </View>
        </Panel>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  providerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  providerChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    backgroundColor: '#0a1222',
  },
  providerChipActive: {
    borderColor: 'rgba(244, 114, 182, 0.32)',
    backgroundColor: 'rgba(244, 114, 182, 0.12)',
  },
  providerText: {
    color: AppTheme.textMuted,
    fontWeight: '700',
  },
  providerTextActive: {
    color: AppTheme.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    color: AppTheme.text,
    fontWeight: '700',
  },
  bubble: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  userBubble: {
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  aiBubble: {
    backgroundColor: '#0a1222',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  bubbleLabel: {
    color: AppTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  bubbleText: {
    color: AppTheme.text,
    lineHeight: 20,
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
    minHeight: 110,
    textAlignVertical: 'top',
  },
  docRow: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#0a1222',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docName: {
    color: AppTheme.text,
    fontWeight: '700',
  },
  error: {
    color: AppTheme.red,
  },
});
