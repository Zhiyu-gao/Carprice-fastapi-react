import React, { useState } from "react";
import {
  Card,
  Form,
  InputNumber,
  Input,
  Button,
  Tag,
  Typography,
  message,
  Row,
  Col,
  Space,
  Select,
  Divider,
  Statistic,
} from "antd";
import {
  CarOutlined,
  DollarOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getToken } from "../auth/token";
import { aiAPI } from "../api/ai";
import type { AiProvider } from "../api/ai";
import { getErrorMessage } from "../api/client";

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ========== 表单类型 ==========
interface PredictFormValues {
  brand: string;
  age_years: number;
  engine: number;
  gearbox: string;
  transfer_cnt: number;
  price_new: number;
}

// ========== 样式常量 ==========
const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 8,
};

const gradientButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
  border: "none",
  borderRadius: 8,
  height: 44,
  fontWeight: 600,
};

const PredictPage: React.FC = () => {
  const [form] = Form.useForm<PredictFormValues>();
  const [predicting, setPredicting] = useState(false);
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // AI 分析
  const [aiProvider, setAiProvider] = useState<AiProvider>("qwen");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // ===== 普通预测 =====
  const handlePredict = async (values: PredictFormValues) => {
    setPredictedPrice(null);
    setAiAnalysis(null);

    try {
      setPredicting(true);
      const token = getToken();

      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error(`预测失败：${res.status}`);
      }

      const data = await res.json();
      setPredictedPrice(data.predicted_price);
      messageApi.success("车辆价格预测成功");
    } catch (err: unknown) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "预测失败"));
    } finally {
      setPredicting(false);
    }
  };

  // ===== AI 分析 =====
  const handleAiAnalyze = async () => {
    try {
      const values = await form.validateFields();

      let finalPrice = predictedPrice;
      if (finalPrice == null) {
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(values),
        });

        if (!res.ok) throw new Error("预测接口调用失败");
        const data = await res.json();
        finalPrice = data.predicted_price;
        setPredictedPrice(finalPrice);
      }

      setAiLoading(true);
      setAiAnalysis(null);

      const resp = await aiAPI.priceAnalysis({
        provider: aiProvider,
        features: values,
        predicted_price: finalPrice!,
      });

      setAiAnalysis(resp.data.analysis_markdown);
      messageApi.success("AI 分析完成");
    } catch (err: unknown) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "AI 分析失败"));
    } finally {
      setAiLoading(false);
    }
  };

  const features = [
    {
      icon: <ThunderboltOutlined style={{ color: "#22d3ee", fontSize: 20 }} />,
      title: "LightGBM + XGBoost",
      desc: "双模型融合预测",
    },
    {
      icon: <RobotOutlined style={{ color: "#a78bfa", fontSize: 20 }} />,
      title: "AI 智能分析",
      desc: "大模型专业解读",
    },
    {
      icon: <CheckCircleOutlined style={{ color: "#34d399", fontSize: 20 }} />,
      title: "实时数据",
      desc: "基于最新市场行情",
    },
  ];

  return (
    <div style={{ padding: "24px 48px", maxWidth: 1200, margin: "0 auto" }}>
      {contextHolder}

      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: "white", marginBottom: 8 }}>
          <CarOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          车辆价格预测
        </Title>
        <Paragraph style={{ color: "#94A3B8", fontSize: 16 }}>
          基于 LightGBM 和 XGBoost 双模型融合，结合大模型 AI 分析，为您提供精准的车辆估价服务
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧表单区 */}
        <Col xs={24} lg={16}>
          <Card style={cardStyle} bodyStyle={{ padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: "white", fontSize: 18 }}>
                车辆信息录入
              </Text>
              <Tag
                color="cyan"
                style={{ marginLeft: 12, background: "rgba(34, 211, 238, 0.1)", border: "none" }}
              >
                POST /predict
              </Tag>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handlePredict}
              initialValues={{
                brand: "传祺",
                gearbox: "自动",
                transfer_cnt: 1,
                age_years: 2,
                engine: 2.0,
                price_new: 25,
              }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<Text style={{ color: "#94A3B8" }}>品牌</Text>}
                    name="brand"
                    rules={[{ required: true, message: "请输入车辆品牌" }]}
                  >
                    <Input
                      placeholder="如：传祺 / 宝马 / 丰田"
                      style={{
                        ...inputStyle,
                        color: "white",
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<Text style={{ color: "#94A3B8" }}>新车指导价（万）</Text>}
                    name="price_new"
                    rules={[{ required: true, message: "请输入新车指导价" }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: "100%", ...inputStyle }}
                      placeholder="请输入价格"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    label={<Text style={{ color: "#94A3B8" }}>车龄（年）</Text>}
                    name="age_years"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%", ...inputStyle }}
                      placeholder="年"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label={<Text style={{ color: "#94A3B8" }}>排量（L）</Text>}
                    name="engine"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0.5}
                      step={0.1}
                      style={{ width: "100%", ...inputStyle }}
                      placeholder="L"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    label={<Text style={{ color: "#94A3B8" }}>过户次数</Text>}
                    name="transfer_cnt"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%", ...inputStyle }}
                      placeholder="次"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<Text style={{ color: "#94A3B8" }}>变速箱</Text>}
                    name="gearbox"
                    rules={[{ required: true }]}
                  >
                    <Select
                      style={{ ...inputStyle }}
                      dropdownStyle={{ background: "#1e293b" }}
                    >
                      <Option value="自动">自动</Option>
                      <Option value="手动">手动</Option>
                      <Option value="无级变速">无级变速</Option>
                      <Option value="其他">其他</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "24px 0" }} />

              <Form.Item>
                <Space wrap size={16}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={predicting}
                    icon={<DollarOutlined />}
                    style={gradientButtonStyle}
                    size="large"
                  >
                    {predicting ? "预测中..." : "预测车辆价格"}
                  </Button>

                  <Select
                    value={aiProvider}
                    onChange={setAiProvider}
                    style={{ width: 140, ...inputStyle }}
                    dropdownStyle={{ background: "#1e293b" }}
                  >
                    <Option value="kimi">Kimi</Option>
                    <Option value="qwen">Qwen</Option>
                    <Option value="deepseek">DeepSeek</Option>
                  </Select>

                  <Button
                    onClick={handleAiAnalyze}
                    loading={aiLoading}
                    icon={<RobotOutlined />}
                    style={{
                      borderColor: "rgba(167, 139, 250, 0.5)",
                      color: "#a78bfa",
                      borderRadius: 8,
                      height: 44,
                    }}
                    size="large"
                  >
                    {aiLoading ? "AI 分析中..." : "AI 深度分析"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            {/* 预测结果 */}
            {predictedPrice !== null && (
              <Card
                style={{
                  marginTop: 24,
                  background: "linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(14, 165, 233, 0.1))",
                  border: "1px solid rgba(34, 211, 238, 0.3)",
                  borderRadius: 12,
                }}
              >
                <Statistic
                  title={<Text style={{ color: "#94A3B8" }}>预测价格</Text>}
                  value={predictedPrice}
                  precision={2}
                  suffix="万"
                  valueStyle={{ color: "#22d3ee", fontSize: 36, fontWeight: 700 }}
                  prefix={<DollarOutlined />}
                />
                <Text style={{ color: "#64748B", fontSize: 13, display: "block", marginTop: 8 }}>
                  基于历史数据训练模型计算得出，仅供参考
                </Text>
              </Card>
            )}

            {/* AI 分析结果 */}
            {aiAnalysis && (
              <Card
                style={{
                  marginTop: 16,
                  background: "rgba(167, 139, 250, 0.05)",
                  border: "1px solid rgba(167, 139, 250, 0.2)",
                  borderRadius: 12,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <Tag
                    color="purple"
                    style={{
                      background: "rgba(167, 139, 250, 0.2)",
                      border: "none",
                      color: "#a78bfa",
                      padding: "4px 12px",
                    }}
                  >
                    <RobotOutlined style={{ marginRight: 6 }} />
                    AI 分析 · {aiProvider.toUpperCase()}
                  </Tag>
                </div>
                <div
                  style={{
                    maxHeight: 300,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    color: "#e2e8f0",
                    fontSize: 14,
                    lineHeight: 1.8,
                  }}
                >
                  {aiAnalysis}
                </div>
              </Card>
            )}
          </Card>
        </Col>

        {/* 右侧信息区 */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {features.map((feature, idx) => (
              <Card
                key={idx}
                style={{
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: 12,
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <Text strong style={{ color: "white", display: "block", fontSize: 16 }}>
                      {feature.title}
                    </Text>
                    <Text style={{ color: "#64748B", fontSize: 13 }}>{feature.desc}</Text>
                  </div>
                </div>
              </Card>
            ))}

            <Card
              style={{
                background: "rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <InfoCircleOutlined style={{ color: "#fbbf24", fontSize: 18, marginTop: 2 }} />
                <div>
                  <Text strong style={{ color: "white", display: "block", marginBottom: 8 }}>
                    使用说明
                  </Text>
                  <Text style={{ color: "#64748B", fontSize: 13, lineHeight: 1.8 }}>
                    1. 填写车辆基本信息
                    <br />
                    2. 点击"预测车辆价格"获取估价
                    <br />
                    3. 可选择 AI 模型进行深度分析
                    <br />
                    4. 分析结果包含车况评估和建议
                  </Text>
                </div>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default PredictPage;
