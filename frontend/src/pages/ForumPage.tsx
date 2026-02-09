import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  List,
  Avatar,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  message,
  Divider,
  Row,
  Col,
  Statistic,
} from "antd";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { ForumPost, ForumComment, UserProfile } from "../api/types";
import {
  MessageOutlined,
  UserOutlined,
  SendOutlined,
  CommentOutlined,
  TeamOutlined,
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

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [commentMap, setCommentMap] = useState<Record<number, ForumComment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get<ForumPost[]>("/forum/posts");
      setPosts(res.data || []);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取帖子失败"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const createPost = async () => {
    if (!content.trim()) {
      message.warning("请输入内容");
      return;
    }
    try {
      await api.post("/forum/posts", { content });
      setContent("");
      fetchPosts();
      message.success("发布成功");
    } catch (e: any) {
      message.error(getErrorMessage(e, "发帖失败"));
    }
  };

  const loadComments = async (postId: number) => {
    try {
      const res = await api.get<ForumComment[]>(`/forum/posts/${postId}/comments`);
      setCommentMap((prev) => ({ ...prev, [postId]: res.data || [] }));
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取评论失败"));
    }
  };

  const sendComment = async (postId: number) => {
    const value = commentInput[postId]?.trim();
    if (!value) {
      message.warning("请输入评论");
      return;
    }
    try {
      await api.post(`/forum/posts/${postId}/comments`, { content: value });
      setCommentInput((prev) => ({ ...prev, [postId]: "" }));
      loadComments(postId);
      message.success("评论成功");
    } catch (e: any) {
      message.error(getErrorMessage(e, "评论失败"));
    }
  };

  const openProfile = async (userId: number) => {
    try {
      const res = await api.get<UserProfile>(`/users/${userId}`);
      setProfile(res.data);
      setProfileOpen(true);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取用户信息失败"));
    }
  };

  const renderAvatar = (avatarPath?: string | null, username?: string) => {
    if (avatarPath) {
      return (
        <Avatar
          src={`${API_BASE_URL}/files/${avatarPath}`}
          size={40}
          style={{ border: "2px solid rgba(34, 211, 238, 0.3)" }}
        />
      );
    }
    const initial = (username || "?").slice(0, 1).toUpperCase();
    return (
      <Avatar
        size={40}
        style={{
          background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
          border: "2px solid rgba(34, 211, 238, 0.3)",
        }}
      >
        {initial}
      </Avatar>
    );
  };

  const activePosts = useMemo(() => posts || [], [posts]);

  // 统计
  const totalComments = Object.values(commentMap).reduce((sum, comments) => sum + comments.length, 0);

  return (
    <div style={{ padding: "24px" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <MessageOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          论坛社区
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          分享观点、发帖讨论、交流互动
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>帖子数</Text>}
              value={posts.length}
              prefix={<MessageOutlined style={{ color: "#22d3ee" }} />}
              valueStyle={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>评论数</Text>}
              value={totalComments}
              prefix={<CommentOutlined style={{ color: "#10b981" }} />}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>活跃用户</Text>}
              value={new Set(posts.map(p => p.user.id)).size}
              prefix={<TeamOutlined style={{ color: "#f59e0b" }} />}
              valueStyle={{ color: "#f59e0b", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>今日新帖</Text>}
              value={posts.filter(p => {
                const postDate = new Date(p.created_at);
                const today = new Date();
                return postDate.toDateString() === today.toDateString();
              }).length}
              prefix={<SendOutlined style={{ color: "#a78bfa" }} />}
              valueStyle={{ color: "#a78bfa", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 发帖区域 */}
      <Card style={{ ...cardStyle, marginBottom: 24 }}>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的想法..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            color: "#e2e8f0",
          }}
        />
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={createPost}
            style={gradientButtonStyle}
          >
            发布帖子
          </Button>
        </div>
      </Card>

      {/* 帖子列表 */}
      <List
        loading={loading}
        dataSource={activePosts}
        renderItem={(item) => {
          const role = roleConfig(item.user.role);
          return (
            <List.Item key={item.id} style={{ padding: 0, border: "none", marginBottom: 16 }}>
              <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <div onClick={() => openProfile(item.user.id)} style={{ cursor: "pointer" }}>
                    {renderAvatar(item.user.avatar_path, item.user.username)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Space align="center" wrap>
                      <Text strong style={{ color: "#f1f5f9", fontSize: 16 }}>
                        {item.user.username}
                      </Text>
                      <Tag
                        style={{
                          background: `${role.color}20`,
                          color: role.color,
                          border: `1px solid ${role.color}40`,
                        }}
                      >
                        {role.icon} {role.text}
                      </Tag>
                      <Text style={{ color: "#64748b", fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleString()}
                      </Text>
                    </Space>
                    <div style={{ marginTop: 12, whiteSpace: "pre-wrap", color: "#e2e8f0", lineHeight: 1.8 }}>
                      {item.content}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <Button
                        size="small"
                        icon={<CommentOutlined />}
                        onClick={() => loadComments(item.id)}
                        style={{
                          background: "rgba(34, 211, 238, 0.1)",
                          border: "1px solid rgba(34, 211, 238, 0.3)",
                          color: "#22d3ee",
                        }}
                      >
                        查看评论 ({commentMap[item.id]?.length || 0})
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 评论区 */}
                {(commentMap[item.id] || []).length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
                    {commentMap[item.id].map((c) => {
                      const commentRole = roleConfig(c.user.role);
                      return (
                        <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px dashed rgba(148,163,184,0.1)" }}>
                          <Space>
                            <div onClick={() => openProfile(c.user.id)} style={{ cursor: "pointer" }}>
                              {renderAvatar(c.user.avatar_path, c.user.username)}
                            </div>
                            <Text style={{ color: "#f1f5f9", fontWeight: 500 }}>{c.user.username}</Text>
                            <Tag
                              style={{
                                background: `${commentRole.color}20`,
                                color: commentRole.color,
                                border: `1px solid ${commentRole.color}40`,
                                fontSize: 12,
                              }}
                            >
                              {commentRole.text}
                            </Tag>
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              {new Date(c.created_at).toLocaleString()}
                            </Text>
                          </Space>
                          <div style={{ marginLeft: 56, marginTop: 8, whiteSpace: "pre-wrap", color: "#94a3b8" }}>
                            {c.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 评论输入 */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(148, 163, 184, 0.1)" }}>
                  <Input
                    value={commentInput[item.id] || ""}
                    onChange={(e) =>
                      setCommentInput((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="写下你的评论..."
                    style={{
                      background: "rgba(15, 23, 42, 0.4)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#e2e8f0",
                    }}
                    suffix={
                      <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                        onClick={() => sendComment(item.id)}
                        style={gradientButtonStyle}
                      >
                        发送
                      </Button>
                    }
                  />
                </div>
              </Card>
            </List.Item>
          );
        }}
      />

      {/* 用户资料弹窗 */}
      <Modal
        open={profileOpen}
        onCancel={() => setProfileOpen(false)}
        footer={null}
        title={<Text style={{ color: "#f1f5f9" }}>用户信息</Text>}
        styles={{
          header: { background: "#0f172a", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
          body: { background: "#0f172a" },
          mask: { background: "rgba(0, 0, 0, 0.7)" },
        }}
      >
        {profile && (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Space>
              {renderAvatar(profile.avatar_path, profile.username)}
              <div>
                <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 18 }}>{profile.username}</div>
                {(() => {
                  const role = roleConfig(profile.role);
                  return (
                    <Tag
                      style={{
                        background: `${role.color}20`,
                        color: role.color,
                        border: `1px solid ${role.color}40`,
                        marginTop: 4,
                      }}
                    >
                      {role.icon} {role.text}
                    </Tag>
                  );
                })()}
              </div>
            </Space>
            <Divider style={{ borderColor: "rgba(148, 163, 184, 0.1)", margin: "12px 0" }} />
            <div>
              <Text style={{ color: "#64748b", display: "block", marginBottom: 4 }}>邮箱</Text>
              <Text style={{ color: "#e2e8f0" }}>{profile.email}</Text>
            </div>
            <div>
              <Text style={{ color: "#64748b", display: "block", marginBottom: 4 }}>姓名</Text>
              <Text style={{ color: "#e2e8f0" }}>{profile.full_name || "-"}</Text>
            </div>
            <div>
              <Text style={{ color: "#64748b", display: "block", marginBottom: 4 }}>注册时间</Text>
              <Text style={{ color: "#e2e8f0" }}>
                {new Date(profile.created_at).toLocaleString()}
              </Text>
            </div>
            <Divider style={{ borderColor: "rgba(148, 163, 184, 0.1)", margin: "12px 0" }} />
            <Button
              type="primary"
              onClick={() => navigate(`/chat/${profile.id}`)}
              block
              icon={<MessageOutlined />}
              style={gradientButtonStyle}
            >
              开始聊天
            </Button>
          </Space>
        )}
      </Modal>
    </div>
  );
}
