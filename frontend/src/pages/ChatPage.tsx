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
import {
  MessageOutlined,
  SendOutlined,
  PlusOutlined,
  UserOutlined,
  CrownOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

const gradientButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
  border: "none",
  borderRadius: 8,
  height: 40,
  fontWeight: 600,
};

const roleConfig = (role?: string) => {
  if (role === "admin") return { color: "#f59e0b", icon: <CrownOutlined />, text: "管理员" };
  if (role === "buyer") return { color: "#10b981", icon: <ShoppingOutlined />, text: "买家" };
  if (role === "seller") return { color: "#22d3ee", icon: <UserOutlined />, text: "卖家" };
  return { color: "#64748b", icon: <UserOutlined />, text: "用户" };
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

  const renderAvatar = (avatarPath?: string | null, username?: string, size: number = 40) => {
    if (avatarPath) {
      return (
        <Avatar
          src={`${API_BASE_URL}/files/${avatarPath}`}
          size={size}
          style={{ border: "2px solid rgba(34, 211, 238, 0.3)" }}
        />
      );
    }
    const initial = (username || "?").slice(0, 1).toUpperCase();
    return (
      <Avatar
        size={size}
        style={{
          background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
          border: "2px solid rgba(34, 211, 238, 0.3)",
        }}
      >
        {initial}
      </Avatar>
    );
  };

  const currentRole = roleConfig(profile?.role);

  return (
    <div style={{ padding: "24px", height: "calc(100vh - 64px)" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <MessageOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          消息中心
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          与其他用户实时交流
        </Text>
      </div>

      <Card style={{ ...cardStyle, height: "calc(100% - 80px)" }} bodyStyle={{ padding: 0, height: "100%" }}>
        <div style={{ display: "flex", height: "100%" }}>
          {/* 左侧聊天列表 */}
          <div
            style={{
              width: 300,
              borderRight: "1px solid rgba(148, 163, 184, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Text strong style={{ color: "#f1f5f9", fontSize: 16 }}>
                  聊天列表
                </Text>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setNewChatOpen(true)}
                  style={gradientButtonStyle}
                >
                  新建
                </Button>
              </Space>
            </div>
            <List
              dataSource={inbox}
              style={{ flex: 1, overflow: "auto" }}
              renderItem={(item) => {
                const role = roleConfig(item.user.role);
                const isActive = targetId === item.user.id;
                return (
                  <List.Item
                    key={item.user.id}
                    style={{
                      cursor: "pointer",
                      padding: "12px 16px",
                      background: isActive ? "rgba(34, 211, 238, 0.1)" : "transparent",
                      borderLeft: isActive ? "3px solid #22d3ee" : "3px solid transparent",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => navigate(`/chat/${item.user.id}`)}
                  >
                    <List.Item.Meta
                      avatar={renderAvatar(item.user.avatar_path, item.user.username)}
                      title={
                        <Space>
                          <Text strong style={{ color: "#f1f5f9" }}>
                            {item.user.username}
                          </Text>
                          <Tag
                            style={{
                              background: `${role.color}20`,
                              color: role.color,
                              border: `1px solid ${role.color}40`,
                              fontSize: 10,
                            }}
                          >
                            {role.text}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Text
                          ellipsis
                          style={{
                            display: "block",
                            maxWidth: 180,
                            color: "#64748b",
                            fontSize: 12,
                          }}
                        >
                          {item.last_message}
                        </Text>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </div>

          {/* 右侧聊天区域 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {targetId ? (
              <>
                {/* 聊天头部 */}
                <div
                  style={{
                    padding: 16,
                    borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {renderAvatar(profile?.avatar_path, profile?.username)}
                  <div>
                    <Title level={5} style={{ margin: 0, color: "#f1f5f9" }}>
                      {profile?.username || "用户"}
                    </Title>
                    <Tag
                      style={{
                        background: `${currentRole.color}20`,
                        color: currentRole.color,
                        border: `1px solid ${currentRole.color}40`,
                        marginTop: 4,
                      }}
                    >
                      {currentRole.icon} {currentRole.text}
                    </Tag>
                  </div>
                </div>

                {/* 消息区域 */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 20,
                    background: "rgba(2, 6, 23, 0.3)",
                  }}
                >
                  {messages.map((m) => {
                    const isMe = m.sender_id === me?.id;
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          justifyContent: isMe ? "flex-end" : "flex-start",
                          marginBottom: 16,
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", maxWidth: "70%" }}>
                          {!isMe && renderAvatar(profile?.avatar_path, profile?.username)}
                          <div>
                            <div
                              style={{
                                background: isMe
                                  ? "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)"
                                  : "rgba(148, 163, 184, 0.15)",
                                borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                padding: "12px 16px",
                                color: isMe ? "white" : "#e2e8f0",
                                boxShadow: isMe ? "0 4px 12px rgba(34, 211, 238, 0.2)" : "none",
                              }}
                            >
                              <div style={{ lineHeight: 1.6 }}>{m.content}</div>
                            </div>
                            <Text
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                                marginTop: 4,
                                display: "block",
                                textAlign: isMe ? "right" : "left",
                              }}
                            >
                              {new Date(m.created_at).toLocaleString()}
                            </Text>
                          </div>
                          {isMe && renderAvatar(me?.avatar_path, me?.username)}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* 输入区域 */}
                <div
                  style={{
                    padding: 16,
                    borderTop: "1px solid rgba(148, 163, 184, 0.1)",
                    background: "rgba(15, 23, 42, 0.4)",
                  }}
                >
                  <TextArea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder="输入消息..."
                    style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#e2e8f0",
                      marginBottom: 12,
                    }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <div style={{ textAlign: "right" }}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={send}
                      style={gradientButtonStyle}
                    >
                      发送
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  color: "#64748b",
                }}
              >
                <MessageOutlined style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }} />
                <Text style={{ color: "#64748b", fontSize: 16 }}>选择一个聊天开始对话</Text>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 新建聊天弹窗 */}
      <Modal
        open={newChatOpen}
        onCancel={() => setNewChatOpen(false)}
        onOk={() => {
          if (!newChatUserId) return;
          setNewChatOpen(false);
          navigate(`/chat/${newChatUserId}`);
        }}
        title={<Text style={{ color: "#f1f5f9" }}>新建聊天</Text>}
        styles={{
          header: { background: "#0f172a", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
          body: { background: "#0f172a" },
          mask: { background: "rgba(0, 0, 0, 0.7)" },
        }}
      >
        <Select
          style={{ width: "100%" }}
          placeholder="选择用户"
          options={users.map((u) => {
            const role = roleConfig(u.role);
            return {
              label: (
                <Space>
                  {renderAvatar(u.avatar_path, u.username, 24)}
                  <Text style={{ color: "#e2e8f0" }}>{u.username}</Text>
                  <Tag
                    style={{
                      background: `${role.color}20`,
                      color: role.color,
                      border: `1px solid ${role.color}40`,
                      fontSize: 10,
                    }}
                  >
                    {role.text}
                  </Tag>
                </Space>
              ),
              value: u.id,
            };
          })}
          onChange={(v) => setNewChatUserId(Number(v))}
          dropdownStyle={{ background: "#0f172a" }}
        />
      </Modal>
    </div>
  );
}
