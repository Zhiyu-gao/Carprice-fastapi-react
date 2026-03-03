import { useState, useRef, useEffect, useCallback } from "react";
import { Input, Button, Select, Switch, message, Popconfirm, Typography, Space, Drawer, Grid } from "antd";
import {
  ArrowUpOutlined,
  PlusOutlined,
  DeleteOutlined,
  RobotOutlined,
  MessageOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { getToken } from "../auth/token";

const { TextArea } = Input;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL;

type Message = {
  role: "user" | "ai";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type RagDoc = {
  id: string;
  filename: string;
};

// 样式常量
const sidebarStyle: React.CSSProperties = {
  width: 280,
  background: "rgba(15, 23, 42, 0.8)",
  borderRight: "1px solid rgba(255, 255, 255, 0.08)",
  display: "flex",
  flexDirection: "column",
  backdropFilter: "blur(12px)",
};

const chatAreaStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "#020617",
};

const messageBubbleUser: React.CSSProperties = {
  background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
  color: "white",
  padding: "12px 16px",
  borderRadius: "16px 16px 4px 16px",
  maxWidth: "70%",
  whiteSpace: "pre-wrap",
  lineHeight: 1.6,
  boxShadow: "0 4px 12px rgba(34, 211, 238, 0.2)",
};

const messageBubbleAI: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  color: "#e2e8f0",
  padding: "12px 16px",
  borderRadius: "16px 16px 16px 4px",
  maxWidth: "70%",
  whiteSpace: "pre-wrap",
  lineHeight: 1.6,
};

export default function AiChatPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<"kimi" | "deepseek" | "qwen">("qwen");
  const [ragEnabled, setRagEnabled] = useState(false);
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [docs, setDocs] = useState<{ id: string; filename: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    const res = await fetch(`${AI_BASE_URL}/ai/chat/sessions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    if (!activeSessionId && Array.isArray(data) && data[0]) {
      setActiveSessionId(data[0].id);
    }
  }, [activeSessionId]);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`${AI_BASE_URL}/ai/rag/docs`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setDocs(
        Array.isArray(data)
          ? data.map((d: unknown) => {
              const doc = d as Partial<RagDoc>;
              return { id: String(doc.id || ""), filename: String(doc.filename || "") };
            }).filter((doc) => doc.id && doc.filename)
          : []
      );
    } catch {
      message.error("获取文档列表失败");
    }
  }, []);

  const uploadDoc = async (file: File) => {
    setUploadingDoc(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${AI_BASE_URL}/ai/rag/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        message.error(err.detail || "上传失败");
        return;
      }
      message.success("上传成功");
      void fetchDocs();
    } catch {
      message.error("上传失败");
    } finally {
      setUploadingDoc(false);
    }
  };

  const deleteDoc = async (docId: string) => {
    setDeletingDocId(docId);
    try {
      const res = await fetch(`${AI_BASE_URL}/ai/rag/docs/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json();
        message.error(err.detail || "删除文档失败");
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      message.success("文档已删除");
    } catch {
      message.error("删除文档失败");
    } finally {
      setDeletingDocId(null);
    }
  };

  const fetchMessages = useCallback(async (sessionId: string) => {
    const res = await fetch(
      `${AI_BASE_URL}/ai/chat/sessions/${sessionId}/messages`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
    const data = await res.json();
    const mapped = (Array.isArray(data) ? data : []).map((m: unknown) => {
      const item = m as Partial<Message>;
      const role: Message["role"] = item.role === "ai" ? "ai" : "user";
      return {
        role,
        content: String(item.content || ""),
      };
    });
    setMessages(mapped);
  }, []);

  const createSession = async () => {
    const res = await fetch(`${AI_BASE_URL}/ai/chat/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ title: "新对话" }),
    });
    const data = await res.json();
    await fetchSessions();
    setActiveSessionId(data.id);
    setMessages([]);
    setQuestion("");
  };

  const deleteSession = async (sessionId: string) => {
    const res = await fetch(`${AI_BASE_URL}/ai/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) {
      message.error("删除失败");
      return;
    }
    message.success("已删除");
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
    void fetchSessions();
  };

  useEffect(() => {
    void fetchSessions();
    void fetchDocs();
  }, [fetchDocs, fetchSessions]);

  useEffect(() => {
    if (activeSessionId) {
      void fetchMessages(activeSessionId);
    }
  }, [activeSessionId, fetchMessages]);

  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const appendAiToken = (tokenText: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "ai") {
        return [...prev.slice(0, -1), { role: "ai", content: last.content + tokenText }];
      }
      return [...prev, { role: "ai", content: tokenText }];
    });
  };

  const handleAsk = async () => {
    if (!question.trim() || loading) return;

    try {
      const q = question.trim();
      let sessionId = activeSessionId;
      if (!sessionId) {
        const res = await fetch(`${AI_BASE_URL}/ai/chat/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ title: q.slice(0, 20) || "新对话" }),
        });
        const data = await res.json();
        sessionId = data.id;
        setActiveSessionId(sessionId);
        await fetchSessions();
      }

      setQuestion("");
      setLoading(true);
      setMessages((prev) => [...prev, { role: "user", content: q }]);

      const res = await fetch(`${AI_BASE_URL}/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          question: q,
          session_id: sessionId,
          provider,
          rag_enabled: ragEnabled,
          mcp_enabled: mcpEnabled,
        }),
      });
      if (!res.ok || !res.body) {
        setLoading(false);
        message.error("聊天请求失败");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let doneReceived = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.startsWith("data:")) continue;
          const data = part.replace("data:", "").trim();
          if (data === "[DONE]") {
            doneReceived = true;
            setLoading(false);
            fetchSessions();
            return;
          }

          let parsed: {
            error?: string;
            delta?: string;
            status?: string;
            progress?: number;
            session_id?: string;
          };
          try {
            parsed = JSON.parse(data);
          } catch {
            continue;
          }

          if (parsed.error) {
            setLoading(false);
            message.error(parsed.error);
            return;
          }
          if (parsed.session_id && !activeSessionId) {
            setActiveSessionId(parsed.session_id);
          }
          if (parsed.delta) appendAiToken(parsed.delta);
        }
      }

      if (!doneReceived) {
        message.warning("连接中断，回答可能不完整");
      }
    } catch {
      message.error("请求中断，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const providers = [
    { value: "kimi", label: "Kimi", color: "#22d3ee" },
    { value: "deepseek", label: "DeepSeek", color: "#f97316" },
    { value: "qwen", label: "Qwen", color: "#a78bfa" },
  ];

  const renderSidebar = () => (
    <div style={{ ...sidebarStyle, width: isMobile ? "100%" : 280, height: "100%" }}>
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RobotOutlined style={{ color: "#22d3ee", fontSize: 20 }} />
          <Text strong style={{ color: "white", fontSize: 16 }}>
            AI 助手
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createSession}
          style={{
            background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
            border: "none",
          }}
        >
          新建
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => {
              setActiveSessionId(s.id);
              if (isMobile) setSidebarOpen(false);
            }}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              background: s.id === activeSessionId ? "rgba(34, 211, 238, 0.15)" : "transparent",
              borderRadius: 8,
              marginBottom: 8,
              border: s.id === activeSessionId ? "1px solid rgba(34, 211, 238, 0.3)" : "1px solid transparent",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                <MessageOutlined style={{ color: s.id === activeSessionId ? "#22d3ee" : "#64748B", fontSize: 14 }} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: s.id === activeSessionId ? "white" : "#94A3B8",
                    fontSize: 14,
                  }}
                >
                  {s.title}
                </span>
              </div>
              <Popconfirm
                title="确定删除该对话？"
                okText="删除"
                cancelText="取消"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  deleteSession(s.id);
                }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined style={{ color: "#64748B", fontSize: 12 }} />}
                  onClick={(e) => e.stopPropagation()}
                  style={{ padding: "0 4px" }}
                />
              </Popconfirm>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <FileTextOutlined style={{ color: "#fbbf24", fontSize: 14 }} />
          <Text strong style={{ color: "white", fontSize: 14 }}>
            资料库
          </Text>
        </div>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md"
          disabled={uploadingDoc}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadDoc(f);
            e.currentTarget.value = "";
          }}
          style={{
            width: "100%",
            padding: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 6,
            color: "#94A3B8",
            fontSize: 12,
          }}
        />
        <div style={{ marginTop: 8, fontSize: 12 }}>
          {docs.length ? (
            docs.map((d) => (
              <div
                key={d.id}
                style={{
                  color: "#64748B",
                  padding: "2px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  • {d.filename}
                </span>
                <Popconfirm
                  title="删除该文档？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => deleteDoc(d.id)}
                >
                  <Button
                    type="text"
                    size="small"
                    loading={deletingDocId === d.id}
                    icon={<DeleteOutlined style={{ color: "#f87171", fontSize: 12 }} />}
                    style={{ padding: 0, minWidth: 20 }}
                  />
                </Popconfirm>
              </div>
            ))
          ) : (
            <Text style={{ color: "#64748B" }}>暂无文档</Text>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", minHeight: "calc(100vh - 64px)", background: "#020617" }}>
      {!isMobile && renderSidebar()}
      {isMobile && (
        <Drawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          placement="left"
          width="88vw"
          styles={{ body: { padding: 0, height: "100%" } }}
        >
          {renderSidebar()}
        </Drawer>
      )}

      {/* 右侧聊天区 */}
      <div style={chatAreaStyle}>
        {/* 顶部标题栏 */}
        <div
          style={{
            height: 64,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "0 12px" : "0 32px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ color: "#cbd5e1" }} />}
                onClick={() => setSidebarOpen(true)}
              />
            )}
            <ThunderboltOutlined style={{ color: "#22d3ee", fontSize: 18 }} />
            <Text strong style={{ fontSize: 16, color: "white" }}>
              {providers.find((p) => p.value === provider)?.label} AI 聊天
            </Text>
          </div>
          <Space size={isMobile ? 8 : 16} wrap>
            <Select
              value={provider}
              onChange={(v) => setProvider(v)}
              style={{ width: isMobile ? 100 : 120 }}
              options={providers.map((p) => ({
                label: (
                  <span style={{ color: p.color }}>{p.label}</span>
                ),
                value: p.value,
              }))}
              dropdownStyle={{ background: "#1e293b" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <DatabaseOutlined style={{ color: "#34d399", fontSize: 14 }} />
              <Text style={{ color: "#94A3B8", fontSize: 13 }}>RAG</Text>
              <Switch
                size="small"
                checked={ragEnabled}
                onChange={setRagEnabled}
                style={{ backgroundColor: ragEnabled ? "#34d399" : undefined }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ThunderboltOutlined style={{ color: "#f97316", fontSize: 14 }} />
              <Text style={{ color: "#94A3B8", fontSize: 13 }}>MCP</Text>
              <Switch
                size="small"
                checked={mcpEnabled}
                onChange={setMcpEnabled}
                style={{ backgroundColor: mcpEnabled ? "#f97316" : undefined }}
              />
            </div>
          </Space>
        </div>

        {/* 消息区 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "16px 12px" : "32px",
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <RobotOutlined style={{ fontSize: 64, color: "rgba(34, 211, 238, 0.3)" }} />
                <Title level={4} style={{ color: "white", marginTop: 24, marginBottom: 8 }}>
                  开始与 AI 助手对话
                </Title>
                <Text style={{ color: "#64748B" }}>
                  支持 Kimi、DeepSeek、Qwen 等多种大模型，可开启 RAG 和 MCP 增强功能
                </Text>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  margin: "16px 0",
                }}
              >
                <div style={{ ...(m.role === "user" ? messageBubbleUser : messageBubbleAI), maxWidth: isMobile ? "92%" : "70%" }}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* 输入区 */}
        <div
          style={{
            padding: "24px 32px",
            paddingBottom: isMobile ? "max(16px, env(safe-area-inset-bottom))" : "24px",
            paddingInline: isMobile ? 12 : 32,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                padding: isMobile ? "8px 8px 8px 12px" : "8px 8px 8px 16px",
              }}
            >
              <TextArea
                className="ai-chat-input"
                value={question}
                autoSize={{ minRows: 1, maxRows: 6 }}
                onChange={(e) => setQuestion(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder="输入你的问题，按 Enter 发送，Shift + Enter 换行..."
                bordered={false}
                style={{
                  background: "transparent",
                  color: "white",
                  resize: "none",
                  padding: "8px 0",
                  fontSize: 15,
                  lineHeight: "22px",
                }}
              />

              <Button
                type="primary"
                shape="circle"
                icon={<ArrowUpOutlined />}
                loading={loading}
                onClick={handleAsk}
                style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(34, 211, 238, 0.3)",
                }}
              />
            </div>
            <Text style={{ color: "#64748B", fontSize: 12, display: "block", marginTop: 8, textAlign: "center" }}>
              AI 生成内容仅供参考，请核实重要信息
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
