import { useState, useRef, useEffect } from "react";
import { Card, Input, Button, theme } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";
import { getToken } from "../auth/token";

const { TextArea } = Input;
const { useToken } = theme;

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL;

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function AiChatPage() {
  const { token } = useToken();

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

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
      body: JSON.stringify({ question: q }),
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
        flexDirection: "column",
      }}
    >
      {/* 顶部标题栏 */}
      <div
        style={{
          height: 56,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: token.colorText,
          }}
        >
          AI 聊天
        </span>
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
    </Card>
  );
}
