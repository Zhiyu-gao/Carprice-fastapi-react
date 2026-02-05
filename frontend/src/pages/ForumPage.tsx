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
} from "antd";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { ForumPost, ForumComment, UserProfile } from "../api/types";

const { Title, Text } = Typography;
const { TextArea } = Input;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const roleColor = (role?: string) => {
  if (role === "admin") return "gold";
  if (role === "buyer") return "green";
  if (role === "seller") return "blue";
  return "default";
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
      return <Avatar src={`${API_BASE_URL}/files/${avatarPath}`} />;
    }
    const initial = (username || "?").slice(0, 1).toUpperCase();
    return <Avatar>{initial}</Avatar>;
  };

  const activePosts = useMemo(() => posts || [], [posts]);

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 4 }}>
        论坛
      </Title>
      <Text type="secondary">分享观点、发帖讨论、查看身份</Text>

      <Divider />

      <Card style={{ marginBottom: 16 }}>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么..."
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" onClick={createPost}>
            发布
          </Button>
        </div>
      </Card>

      <List
        loading={loading}
        dataSource={activePosts}
        renderItem={(item) => (
          <List.Item key={item.id} style={{ padding: 0, border: "none" }}>
            <Card style={{ width: "100%", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div onClick={() => openProfile(item.user.id)} style={{ cursor: "pointer" }}>
                  {renderAvatar(item.user.avatar_path, item.user.username)}
                </div>
                <div style={{ flex: 1 }}>
                  <Space align="center" wrap>
                    <Text strong>{item.user.username}</Text>
                    <Tag color={roleColor(item.user.role)}>{item.user.role}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </Space>
                  <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{item.content}</div>
                  <div style={{ marginTop: 12 }}>
                    <Button size="small" onClick={() => loadComments(item.id)}>
                      查看评论
                    </Button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                {(commentMap[item.id] || []).map((c) => (
                  <div key={c.id} style={{ padding: "8px 0", borderTop: "1px dashed rgba(148,163,184,0.2)" }}>
                    <Space>
                      <div onClick={() => openProfile(c.user.id)} style={{ cursor: "pointer" }}>
                        {renderAvatar(c.user.avatar_path, c.user.username)}
                      </div>
                      <Text>{c.user.username}</Text>
                      <Tag color={roleColor(c.user.role)}>{c.user.role}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(c.created_at).toLocaleString()}
                      </Text>
                    </Space>
                    <div style={{ marginLeft: 36, whiteSpace: "pre-wrap" }}>{c.content}</div>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <Input
                    value={commentInput[item.id] || ""}
                    onChange={(e) =>
                      setCommentInput((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="写评论..."
                  />
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <Button size="small" onClick={() => sendComment(item.id)}>
                      发送评论
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        open={profileOpen}
        onCancel={() => setProfileOpen(false)}
        footer={null}
        title="用户信息"
      >
        {profile && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              {renderAvatar(profile.avatar_path, profile.username)}
              <div>
                <div style={{ fontWeight: 600 }}>{profile.username}</div>
                <Tag color={roleColor(profile.role)}>{profile.role}</Tag>
              </div>
            </Space>
            <Text type="secondary">邮箱：{profile.email}</Text>
            <Text type="secondary">姓名：{profile.full_name || "-"}</Text>
            <Text type="secondary">
              注册时间：{new Date(profile.created_at).toLocaleString()}
            </Text>
            <Divider />
            <Button type="primary" onClick={() => navigate(`/chat/${profile.id}`)} block>
              开始聊天
            </Button>
          </Space>
        )}
      </Modal>
    </Card>
  );
}
