// src/pages/PredictPage.tsx
import React, { useState } from "react";
import {
  Card,
  Form,
  InputNumber,
  Button,
  Tag,
  Typography,
  message,
  Row,
  Col,
  Space,
} from "antd";
import { Select } from "antd";
import { getToken } from "../auth/token";
import { aiAPI } from "../api/ai";
import type { AiProvider } from "../api/ai";

const { Option } = Select;
const { Text, Title } = Typography;

// 小工具组件：左右对齐
const SpaceBetween: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    {children}
  </div>
);

interface PredictFormValues {
  area_sqm: number;
  bedrooms: number;
  age_years: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PredictPage: React.FC = () => {
  const [predictForm] = Form.useForm<PredictFormValues>();
  const [predicting, setPredicting] = useState(false);
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // AI 相关状态
  const [aiProvider, setAiProvider] = useState<AiProvider>("qwen");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // ======== 普通预测 ========
  const handlePredictFinish = async (values: PredictFormValues) => {
    setPredictedPrice(null);
    setAiAnalysis(null); // 每次重新预测把旧的 AI 分析清掉

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

      if (!res.ok) throw new Error(`预测接口请求失败：${res.status}`);

      const data = await res.json();
      setPredictedPrice(data.predicted_price);
      messageApi.success("预测成功");
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "预测失败，请检查后端是否已启动");
    } finally {
      setPredicting(false);
    }
  };

  // ======== AI 分析 ========
  const handleAiAnalyze = async () => {
    try {
      // 1. 验证并获取表单里的特征
      const values = await predictForm.validateFields();

      // 2. 如果还没预测过，就先调一次 /predict
      let finalPredictedPrice = predictedPrice;
      if (finalPredictedPrice == null) {
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(values),
        });

        if (!res.ok) throw new Error(`预测接口失败：${res.status}`);

        const data = await res.json();
        finalPredictedPrice = data.predicted_price;
        setPredictedPrice(finalPredictedPrice);
      }

      setAiLoading(true);
      setAiAnalysis(null);

      // 3. 调用 ai_service（通过 aiAPI，指向 8090 端口）
      const resp = await aiAPI.priceAnalysis({
        provider: aiProvider,
        features: values,
        predicted_price: finalPredictedPrice!,
      });

      setAiAnalysis(resp.data.analysis_markdown);
      messageApi.success("AI 分析完成");
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "AI 分析失败");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Title level={3} style={{ color: "#e5e7eb", marginBottom: 8 }}>
        车辆价格预测
      </Title>
      <Text type="secondary" style={{ fontSize: 13 }}>
        输入基本信息，调用后端模型快速给出一个参考价格，再用大模型做专业分析。
      </Text>

      <Card
        style={{ marginTop: 16 }}
        bordered={false}
        bodyStyle={{ paddingBottom: 16 }}
        title={
          <SpaceBetween>
            <span>基础特征输入</span>
            <Tag color="blue">POST /predict</Tag>
          </SpaceBetween>
        }
      >
        <Form
          form={predictForm}
          layout="vertical"
          onFinish={handlePredictFinish}
          initialValues={{
            area_sqm: 80,
            bedrooms: 3,
            age_years: 5,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="内部空间面积（㎡）"
                name="area_sqm"
                rules={[{ required: true, message: "请输入内部空间面积" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="座位数"
                name="bedrooms"
                rules={[{ required: true, message: "请输入座位数" }]}
              >
                <InputNumber min={0} max={20} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="使用年限（年）"
                name="age_years"
                rules={[{ required: true, message: "请输入使用年限" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space wrap>
              {/* 普通预测按钮 */}
              <Button type="primary" htmlType="submit" loading={predicting}>
                {predicting ? "预测中..." : "预测车辆价格"}
              </Button>

              {/* 选择 AI 提供方 */}
              <Select
                value={aiProvider}
                onChange={(v) => setAiProvider(v)}
                style={{ width: 160 }}
                size="middle"
              >
                <Option value="kimi">Kimi</Option>
                <Option value="qwen">Qwen</Option>
                <Option value="deepseek">DeepSeek</Option>
              </Select>

              {/* AI 分析按钮 */}
              <Button onClick={handleAiAnalyze} loading={aiLoading}>
                {aiLoading ? "AI 分析中..." : "AI 分析"}
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 数值预测结果 */}
        {predictedPrice !== null && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: "#020617",
              borderRadius: 8,
              border: "1px solid #1f2937",
            }}
          >
            <Text type="secondary">模型预测价格约为：</Text>
            <Text strong style={{ fontSize: 18, marginLeft: 6 }}>
              {Math.round(predictedPrice).toLocaleString()} 元
            </Text>
          </div>
        )}

        {/* AI 分析结果 */}
        {aiAnalysis && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "#020617",
              borderRadius: 8,
              border: "1px solid #1f2937",
              maxHeight: 260,
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <Tag color="purple">AI 分析 · {aiProvider}</Tag>
            </div>
            <Text style={{ fontSize: 13, color: "#e5e7eb" }}>{aiAnalysis}</Text>
          </div>
        )}
      </Card>
    </>
  );
};

export default PredictPage;
