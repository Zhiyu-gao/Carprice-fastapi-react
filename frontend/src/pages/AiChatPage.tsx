import { useState, useRef, useEffect } from "react";
import { Card, Input, Button, theme, Select, Switch, message, Popconfirm } from "antd";
import { ArrowUpOutlined, PlusOutlined } from "@ant-design/icons";
import { getToken } from "../auth/token";

const { TextArea } = Input;
const { useToken } = theme;

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

export default function AiChatPage() {
  const { token } = useToken();

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<"kimi" | "deepseek" | "qwen">("qwen");
  const [ragEnabled, setRagEnabled] = useState(false);
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [docs, setDocs] = useState<{ id: string; filename: string }[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    const res = await fetch(`${AI_BASE_URL}/ai/chat/sessions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    if (!activeSessionId && Array.isArray(data) && data[0]) {
      setActiveSessionId(data[0].id);
    }
  };

  const fetchDocs = async () => {
    const res = await fetch(`${AI_BASE_URL}/ai/rag/docs`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    setDocs(
      Array.isArray(data)
        ? data.map((d: any) => ({ id: d.id, filename: d.filename }))
        : []
    );
  };

  const uploadDoc = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
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
    fetchDocs();
  };

  const fetchMessages = async (sessionId: string) => {
    const res = await fetch(
      `${AI_BASE_URL}/ai/chat/sessions/${sessionId}/messages`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );
    const data = await res.json();
    const mapped = (Array.isArray(data) ? data : []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages(mapped);
  };

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
    fetchSessions();
  };

  useEffect(() => {
    fetchSessions();
    fetchDocs();
  }, []);

  useEffect(() => {
    if (activeSessionId) fetchMessages(activeSessionId);
  }, [activeSessionId]);

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

    let sessionId = activeSessionId;
    if (!sessionId) {
      const res = await fetch(`${AI_BASE_URL}/ai/chat/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ title: "新对话" }),
      });
      const data = await res.json();
      sessionId = data.id;
      setActiveSessionId(sessionId);
      await fetchSessions();
    }

    const q = question;
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

    const reader = res.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

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
          setLoading(false);
          fetchSessions();
          return;
        }
        const parsed = JSON.parse(data);
        if (parsed.delta) appendAiToken(parsed.delta);
      }
    }
  };

  return (
    <Card
      bodyStyle={{
        height: "100vh",
        padding: 0,
        background: token.colorBgLayout,
        display: "flex",
      }}
    >
      {/* 左侧会话列表 */}
      <div
        style={{
          width: 260,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600 }}>对话</span>
          <Button size="small" icon={<PlusOutlined />} onClick={createSession}>
            新建
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                background:
                  s.id === activeSessionId
                    ? token.colorFillSecondary
                    : "transparent",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.title}
                </span>
                <Popconfirm
                  title="确定删除该对话？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => deleteSession(s.id)}
                >
                  <Button size="small">删</Button>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            padding: "12px 16px",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>资料库</div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadDoc(f);
              e.currentTarget.value = "";
            }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: token.colorTextSecondary }}>
            {docs.length ? docs.map((d) => <div key={d.id}>{d.filename}</div>) : "暂无文档"}
          </div>
        </div>
      </div>

      {/* 右侧聊天区 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* 顶部标题栏 */}
        <div
          style={{
            height: 56,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgLayout,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: token.colorText }}>
            AI 聊天
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Select
              value={provider}
              onChange={(v) => setProvider(v)}
              style={{ width: 140 }}
              options={[
                { label: "Kimi", value: "kimi" },
                { label: "DeepSeek", value: "deepseek" },
                { label: "Qwen", value: "qwen" },
              ]}
            />
            <span style={{ fontSize: 12 }}>RAG</span>
            <Switch size="small" checked={ragEnabled} onChange={setRagEnabled} />
            <span style={{ fontSize: 12 }}>MCP</span>
            <Switch size="small" checked={mcpEnabled} onChange={setMcpEnabled} />
          </div>
        </div>

        {/* 消息区（独立滚动） */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 0",
            background: token.colorBgLayout,
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  margin: "10px 0",
                }}
              >
                <div
                  style={{
                    background:
                      m.role === "user"
                        ? token.colorPrimary
                        : token.colorBgContainer,
                    color: token.colorText,
                    padding: "12px 16px",
                    borderRadius: 14,
                    maxWidth: "70%",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* 输入区（sticky 底部） */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: token.colorBgLayout,
            padding: "16px 0",
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
            <div
              style={{
                background: token.colorBgContainer,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 6px 4px 14px",
              }}
            >
              <TextArea
                value={question}
                autoSize={{ minRows: 1, maxRows: 6 }}
                onChange={(e) => setQuestion(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder="输入你的问题…"
                bordered={false}
                style={{
                  background: "transparent",
                  color: token.colorText,
                  resize: "none",
                  padding: "6px 0",
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
                  width: 36,
                  height: 36,
                  minWidth: 36,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
