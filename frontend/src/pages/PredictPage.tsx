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
} from "antd";
import { getToken } from "../auth/token";
import { aiAPI } from "../api/ai";
import type { AiProvider } from "../api/ai";

const { Text, Title } = Typography;
const { Option } = Select;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ========== 表单类型 ==========
interface PredictFormValues {
  brand: string;          // 品牌
  age_years: number;      // 车龄（年）
  engine: number;         // 排量（2.0）
  gearbox: string;        // 变速箱
  transfer_cnt: number;   // 过户次数
  price_new: number;      // 新车指导价（万）
}

// ========== 布局小组件 ==========
const SpaceBetween: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    {children}
  </div>
);

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
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "预测失败");
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
        基于历史二手车数据训练的模型，给出一个参考价格，并由大模型进行专业解读。
      </Text>

      <Card
        style={{ marginTop: 16 }}
        bordered={false}
        bodyStyle={{ paddingBottom: 16 }}
        title={
          <SpaceBetween>
            <span>车辆基础信息</span>
            <Tag color="blue">POST /predict</Tag>
          </SpaceBetween>
        }
      >
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
            <Col span={12}>
              <Form.Item
                label="品牌"
                name="brand"
                rules={[{ required: true, message: "请输入车辆品牌" }]}
              >
                <Input placeholder="如：传祺 / 宝马 / 丰田" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="新车指导价（万）"
                name="price_new"
                rules={[{ required: true, message: "请输入新车指导价" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="车龄（年）"
                name="age_years"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="排量（L）"
                name="engine"
                rules={[{ required: true }]}
              >
                <InputNumber min={0.5} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="过户次数"
                name="transfer_cnt"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="变速箱"
                name="gearbox"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="自动">自动</Option>
                  <Option value="手动">手动</Option>
                  <Option value="无级变速">无级变速</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space wrap>
              <Button type="primary" htmlType="submit" loading={predicting}>
                {predicting ? "预测中..." : "预测车辆价格"}
              </Button>

              <Select
                value={aiProvider}
                onChange={setAiProvider}
                style={{ width: 160 }}
              >
                <Option value="kimi">Kimi</Option>
                <Option value="qwen">Qwen</Option>
                <Option value="deepseek">DeepSeek</Option>
              </Select>

              <Button onClick={handleAiAnalyze} loading={aiLoading}>
                {aiLoading ? "AI 分析中..." : "AI 分析"}
              </Button>
            </Space>
          </Form.Item>
        </Form>

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
            <Text type="secondary">模型预测二手车价格约为：</Text>
            <Text strong style={{ fontSize: 18, marginLeft: 6 }}>
              {predictedPrice.toFixed(2)} 万
            </Text>
          </div>
        )}

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
            <Text style={{ fontSize: 13, color: "#e5e7eb" }}>
              {aiAnalysis}
            </Text>
          </div>
        )}
      </Card>
    </>
  );
};

export default PredictPage;
