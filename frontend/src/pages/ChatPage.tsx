import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Input,
  Button,
  Space,
  message,
  Avatar,
  Tag,
  List,
  Modal,
  Select,
} from "antd";
import { api, getErrorMessage } from "../api/client";
import type { ChatInboxItem, ChatMessage, UserLite, UserProfile } from "../api/types";

const { Title, Text } = Typography;
const { TextArea } = Input;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const roleColor = (role?: string) => {
  if (role === "admin") return "gold";
  if (role === "buyer") return "green";
  if (role === "seller") return "blue";
  return "default";
};

export default function ChatPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const targetId = Number(userId);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [inbox, setInbox] = useState<ChatInboxItem[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatUserId, setNewChatUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMe = async () => {
    try {
      const res = await api.get<UserProfile>("/me");
      setMe(res.data);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取用户信息失败"));
    }
  };

  const loadInbox = async () => {
    try {
      const res = await api.get<ChatInboxItem[]>("/chat/inbox");
      setInbox(res.data || []);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取聊天列表失败"));
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get<UserLite[]>("/users");
      setUsers(res.data || []);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取用户列表失败"));
    }
  };

  const loadProfile = async () => {
    try {
      const res = await api.get<UserProfile>(`/users/${targetId}`);
      setProfile(res.data);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取用户信息失败"));
    }
  };

  const loadMessages = async () => {
    try {
      const res = await api.get<ChatMessage[]>(`/chat/${targetId}`);
      setMessages(res.data || []);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取聊天记录失败"));
    }
  };

  const send = async () => {
    if (!content.trim()) return;
    try {
      await api.post(`/chat/${targetId}`, { content });
      setContent("");
      loadMessages();
    } catch (e: any) {
      message.error(getErrorMessage(e, "发送失败"));
    }
  };

  useEffect(() => {
    loadMe();
    loadInbox();
    loadUsers();
  }, []);

  useEffect(() => {
    if (!targetId) return;
    loadProfile();
    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [targetId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const avatar = profile?.avatar_path
    ? `${API_BASE_URL}/files/${profile.avatar_path}`
    : undefined;

  return (
    <Card>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ width: 260 }}>
          <Space style={{ marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0 }}>
              聊天
            </Title>
            <Button size="small" onClick={() => setNewChatOpen(true)}>
              新建
            </Button>
          </Space>
          <List
            dataSource={inbox}
            renderItem={(item) => (
              <List.Item
                key={item.user.id}
                style={{
                  cursor: "pointer",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
                onClick={() => navigate(`/chat/${item.user.id}`)}
              >
                <List.Item.Meta
                  avatar={
                    item.user.avatar_path ? (
                      <Avatar src={`${API_BASE_URL}/files/${item.user.avatar_path}`} />
                    ) : (
                      <Avatar>{item.user.username.slice(0, 1)}</Avatar>
                    )
                  }
                  title={
                    <Space>
                      <span>{item.user.username}</span>
                      <Tag color={roleColor(item.user.role)}>{item.user.role}</Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary" ellipsis style={{ display: "block", maxWidth: 160 }}>
                      {item.last_message}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        <div style={{ flex: 1 }}>
          <Space align="center">
            <Avatar src={avatar}>{profile?.username?.slice(0, 1)}</Avatar>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                与 {profile?.username || "用户"} 聊天
              </Title>
              <Tag color={roleColor(profile?.role)}>{profile?.role}</Tag>
            </div>
          </Space>

          <div
            style={{
              marginTop: 16,
              height: 420,
              overflowY: "auto",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: 12,
              background: "var(--background-secondary)",
            }}
          >
            {messages.map((m) => {
              const isMe = m.sender_id === me?.id;
              const bubbleAlign = isMe ? "flex-end" : "flex-start";
              const bubbleBg = isMe ? "rgba(34,211,238,0.2)" : "rgba(148,163,184,0.12)";
              const avatarSrc = isMe
                ? me?.avatar_path
                  ? `${API_BASE_URL}/files/${me.avatar_path}`
                  : undefined
                : avatar;
              const initial = isMe
                ? me?.username?.slice(0, 1)
                : profile?.username?.slice(0, 1);
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: bubbleAlign, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    {!isMe && <Avatar src={avatarSrc}>{initial}</Avatar>}
                    <div
                      style={{
                        background: bubbleBg,
                        borderRadius: 12,
                        padding: "8px 12px",
                        maxWidth: 420,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(m.created_at).toLocaleString()}
                      </Text>
                      <div>{m.content}</div>
                    </div>
                    {isMe && <Avatar src={avatarSrc}>{initial}</Avatar>}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ marginTop: 12 }}>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="输入消息..."
            />
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <Button type="primary" onClick={send}>
                发送
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={newChatOpen}
        onCancel={() => setNewChatOpen(false)}
        onOk={() => {
          if (!newChatUserId) return;
          setNewChatOpen(false);
          navigate(`/chat/${newChatUserId}`);
        }}
        title="新建聊天"
      >
        <Select
          style={{ width: "100%" }}
          placeholder="选择用户"
          options={users.map((u) => ({
            label: `${u.username} (${u.role})`,
            value: u.id,
          }))}
          onChange={(v) => setNewChatUserId(Number(v))}
        />
      </Modal>
    </Card>
  );
}
