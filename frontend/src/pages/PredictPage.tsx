import React, { useCallback, useEffect, useState } from "react";
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
  Table,
} from "antd";
import {
  CarOutlined,
  DollarOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
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

interface PredictionDetails {
  model?: string;
  weights?: Record<string, number>;
  model_predictions?: Record<string, number>;
}

interface TrainingMetrics {
  mse: number;
  rmse: number;
  mae: number;
}

interface TrainingRow {
  source_car_id: string;
  brand: string;
  model?: string;
  age_years: number;
  engine: number;
  gearbox: string;
  transfer_cnt: number;
  price_new: number;
  price_wan: number;
}

interface TrainingStatus {
  total_annotated: number;
  usable_count: number;
  skipped_count: number;
  new_count: number;
  skipped_examples?: Array<{
    source_car_id?: string;
    title?: string;
    reason?: string;
  }>;
  rows: TrainingRow[];
  model_metadata?: {
    trained_at?: string;
    sample_count?: number;
    metrics?: TrainingMetrics;
    model_metrics?: Record<string, TrainingMetrics>;
    train_count?: number;
    eval_count?: number;
    evaluation_mode?: string;
  };
}

const MODEL_LABELS: Record<string, string> = {
  lightgbm: "LightGBM",
  xgboost: "XGBoost",
  linear: "Linear baseline",
};

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
  const [predictionDetails, setPredictionDetails] = useState<PredictionDetails | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [trainingStatusLoading, setTrainingStatusLoading] = useState(false);
  const [trainingModel, setTrainingModel] = useState(false);
  const [lastTrainingDuration, setLastTrainingDuration] = useState<number | null>(null);

  // AI 分析
  const [aiProvider, setAiProvider] = useState<AiProvider>("qwen");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const fetchTrainingStatus = useCallback(async () => {
    try {
      setTrainingStatusLoading(true);
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/model-training/status?limit=50`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`获取训练状态失败：${res.status}`);
      const data = await res.json();
      setTrainingStatus(data);
    } catch (err: unknown) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "获取训练状态失败"));
    } finally {
      setTrainingStatusLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    void fetchTrainingStatus();
  }, [fetchTrainingStatus]);

  const handleTrainModel = async () => {
    try {
      setTrainingModel(true);
      setLastTrainingDuration(null);
      const startedAt = performance.now();
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/model-training/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || `训练失败：${res.status}`);
      }
      const durationSeconds = (performance.now() - startedAt) / 1000;
      setLastTrainingDuration(durationSeconds);
      messageApi.success(`模型训练完成，耗时 ${durationSeconds.toFixed(1)} 秒`);
      await fetchTrainingStatus();
    } catch (err: unknown) {
      console.error(err);
      messageApi.error(getErrorMessage(err, "模型训练失败"));
    } finally {
      setTrainingModel(false);
    }
  };

  // ===== 普通预测 =====
  const handlePredict = async (values: PredictFormValues) => {
    setPredictedPrice(null);
    setPredictionDetails(null);
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
      setPredictionDetails({
        model: data.model,
        weights: data.weights,
        model_predictions: data.model_predictions,
      });
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
        setPredictionDetails({
          model: data.model,
          weights: data.weights,
          model_predictions: data.model_predictions,
        });
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
      title: "三模型融合",
      desc: "LightGBM / XGBoost / Linear baseline",
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

  const latestMetrics = trainingStatus?.model_metadata?.metrics;
  const modelMetrics = trainingStatus?.model_metadata?.model_metrics || {};
  const evaluationMode = trainingStatus?.model_metadata?.evaluation_mode;
  const usableTrainingCount = trainingStatus?.usable_count || 0;
  const pendingNewCount = trainingStatus?.new_count || 0;
  const canTrainModel = usableTrainingCount >= 2;
  const trainButtonText = trainingModel
    ? "训练中..."
    : pendingNewCount > 0
      ? `训练新增数据（${pendingNewCount} 条）`
      : "强制重训当前模型";
  const trainingHint = !canTrainModel
    ? "至少需要 2 条字段完整的标注数据才能训练。"
    : pendingNewCount > 0
      ? `本次会把 ${pendingNewCount} 条新增数据纳入模型；训练完成后这里会变为 0。`
      : "暂无待训练新增数据；点击按钮会用全部可训练总数重新训练一次。";

  return (
    <div className="page-shell page-shell--lg">
      {contextHolder}

      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: "white", marginBottom: 8 }}>
          <CarOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          车辆价格预测
        </Title>
        <Paragraph style={{ color: "#94A3B8", fontSize: 16 }}>
          基于 LightGBM、XGBoost 与线性 baseline 加权融合，结合大模型 AI 分析，为您提供车辆估价服务
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
                {predictionDetails?.model_predictions && (
                  <div style={{ marginTop: 18 }}>
                    <Text style={{ color: "#94A3B8", fontSize: 13 }}>模型拆分结果</Text>
                    <Row gutter={[12, 12]} style={{ marginTop: 10 }}>
                      {Object.entries(predictionDetails.model_predictions).map(([name, value]) => (
                        <Col xs={24} sm={8} key={name}>
                          <div
                            style={{
                              padding: "12px 14px",
                              border: "1px solid rgba(148, 163, 184, 0.16)",
                              borderRadius: 8,
                              background: "rgba(15, 23, 42, 0.35)",
                            }}
                          >
                            <Text style={{ color: "#94A3B8", fontSize: 12, display: "block" }}>
                              {MODEL_LABELS[name] ?? name}
                            </Text>
                            <Text strong style={{ color: "#e2e8f0", fontSize: 18 }}>
                              {Number(value).toFixed(2)} 万
                            </Text>
                            {predictionDetails.weights?.[name] != null && (
                              <Tag
                                color="cyan"
                                style={{
                                  marginTop: 8,
                                  background: "rgba(34, 211, 238, 0.1)",
                                  border: "none",
                                }}
                              >
                                权重 {(predictionDetails.weights[name] * 100).toFixed(0)}%
                              </Tag>
                            )}
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
                <Text style={{ color: "#64748B", fontSize: 13, display: "block", marginTop: 8 }}>
                  最终价由各模型预测值加权得到，仅供参考
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
            <Card
              style={{
                background: "rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(34, 211, 238, 0.18)",
                borderRadius: 12,
              }}
              loading={trainingStatusLoading}
              bodyStyle={{ padding: 20 }}
            >
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Text strong style={{ color: "white", fontSize: 16 }}>
                    模型训练
                  </Text>
                  <Tag color="cyan">POST /model-training/train</Tag>
                </Space>

                <Row gutter={[10, 10]}>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: "#94A3B8" }}>已标注</Text>}
                      value={trainingStatus?.total_annotated || 0}
                      valueStyle={{ color: "#e2e8f0", fontSize: 22 }}
                      prefix={<DatabaseOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: "#94A3B8" }}>待训练新增</Text>}
                      value={pendingNewCount}
                      valueStyle={{ color: "#34d399", fontSize: 22 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: "#94A3B8" }}>可训练总数</Text>}
                      value={usableTrainingCount}
                      valueStyle={{ color: "#22d3ee", fontSize: 22 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<Text style={{ color: "#94A3B8" }}>字段不完整</Text>}
                      value={trainingStatus?.skipped_count || 0}
                      valueStyle={{ color: "#f59e0b", fontSize: 22 }}
                    />
                  </Col>
                </Row>

                <Button
                  block
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  loading={trainingModel}
                  onClick={handleTrainModel}
                  disabled={!canTrainModel}
                  style={gradientButtonStyle}
                >
                  {trainButtonText}
                </Button>
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px solid rgba(148, 163, 184, 0.14)",
                    borderRadius: 8,
                    background: "rgba(15, 23, 42, 0.28)",
                  }}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.7 }}>
                    {trainingHint}
                  </Text>
                  {lastTrainingDuration != null && (
                    <Text style={{ color: "#22d3ee", fontSize: 12, display: "block", marginTop: 4 }}>
                      本次训练耗时：{lastTrainingDuration.toFixed(1)} 秒
                    </Text>
                  )}
                </div>

                {latestMetrics && (
                  <div>
                    <Text style={{ color: "#94A3B8", fontSize: 13 }}>
                      最新评估
                      {evaluationMode === "holdout" ? "（留出集）" : "（样本少，训练集内评估）"}
                    </Text>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      <Col span={8}>
                        <Statistic
                          title={<Text style={{ color: "#64748B" }}>MSE</Text>}
                          value={latestMetrics.mse}
                          precision={4}
                          valueStyle={{ color: "#e2e8f0", fontSize: 16 }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title={<Text style={{ color: "#64748B" }}>RMSE</Text>}
                          value={latestMetrics.rmse}
                          precision={4}
                          valueStyle={{ color: "#e2e8f0", fontSize: 16 }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title={<Text style={{ color: "#64748B" }}>MAE</Text>}
                          value={latestMetrics.mae}
                          precision={4}
                          valueStyle={{ color: "#e2e8f0", fontSize: 16 }}
                        />
                      </Col>
                    </Row>
                    {trainingStatus?.model_metadata?.trained_at && (
                      <Space direction="vertical" size={2} style={{ width: "100%", marginTop: 6 }}>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          最新模型样本：{trainingStatus.model_metadata.sample_count ?? usableTrainingCount} 条
                          {trainingStatus.model_metadata.train_count != null &&
                            trainingStatus.model_metadata.eval_count != null &&
                            `，训练/评估：${trainingStatus.model_metadata.train_count}/${trainingStatus.model_metadata.eval_count}`}
                        </Text>
                        <Text style={{ color: "#64748B", fontSize: 12 }}>
                          训练时间：{trainingStatus.model_metadata.trained_at}
                        </Text>
                      </Space>
                    )}
                  </div>
                )}
              </Space>
            </Card>

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

      <Card
        style={{ ...cardStyle, marginTop: 24 }}
        title={<Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600 }}>训练数据与模型指标</Text>}
        extra={
          <Button size="small" onClick={fetchTrainingStatus} loading={trainingStatusLoading}>
            刷新
          </Button>
        }
      >
        {Object.keys(modelMetrics).length > 0 && (
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {Object.entries(modelMetrics).map(([name, metrics]) => (
              <Col xs={24} md={8} key={name}>
                <div
                  style={{
                    padding: 12,
                    border: "1px solid rgba(148, 163, 184, 0.16)",
                    borderRadius: 8,
                    background: "rgba(15, 23, 42, 0.35)",
                  }}
                >
                  <Text strong style={{ color: "#e2e8f0" }}>
                    {MODEL_LABELS[name] ?? name}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                      MSE {metrics.mse} · RMSE {metrics.rmse} · MAE {metrics.mae}
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        <Table<TrainingRow>
          size="small"
          rowKey="source_car_id"
          loading={trainingStatusLoading}
          dataSource={trainingStatus?.rows || []}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 980 }}
          columns={[
            {
              title: "车源ID",
              dataIndex: "source_car_id",
              width: 120,
              render: (value) => <Text style={{ color: "#94A3B8" }}>{value}</Text>,
            },
            {
              title: "品牌",
              dataIndex: "brand",
              width: 100,
              render: (value) => <Tag color="cyan">{value || "未知"}</Tag>,
            },
            {
              title: "车型",
              dataIndex: "model",
              width: 220,
              render: (value) => <Text style={{ color: "#e2e8f0" }}>{value || "-"}</Text>,
            },
            {
              title: "车龄",
              dataIndex: "age_years",
              width: 80,
              render: (value) => <Text style={{ color: "#94A3B8" }}>{value}</Text>,
            },
            {
              title: "排量",
              dataIndex: "engine",
              width: 80,
              render: (value) => <Text style={{ color: "#94A3B8" }}>{value}</Text>,
            },
            {
              title: "变速箱",
              dataIndex: "gearbox",
              width: 100,
              render: (value) => <Text style={{ color: "#94A3B8" }}>{value}</Text>,
            },
            {
              title: "过户",
              dataIndex: "transfer_cnt",
              width: 80,
              render: (value) => <Text style={{ color: "#94A3B8" }}>{value}</Text>,
            },
            {
              title: "新车指导价",
              dataIndex: "price_new",
              width: 110,
              render: (value) => <Text style={{ color: "#94A3B8" }}>{value} 万</Text>,
            },
            {
              title: "标注价格",
              dataIndex: "price_wan",
              width: 110,
              render: (value) => <Text style={{ color: "#34d399" }}>{value} 万</Text>,
            },
          ]}
        />
        {(trainingStatus?.skipped_examples || []).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: "#f59e0b", fontSize: 13 }}>跳过的数据</Text>
            <Space direction="vertical" size={6} style={{ width: "100%", marginTop: 8 }}>
              {(trainingStatus?.skipped_examples || []).map((item) => (
                <div
                  key={item.source_car_id}
                  style={{
                    padding: "8px 10px",
                    border: "1px solid rgba(245, 158, 11, 0.22)",
                    borderRadius: 8,
                    background: "rgba(245, 158, 11, 0.06)",
                  }}
                >
                  <Text style={{ color: "#e2e8f0" }}>
                    {item.source_car_id || "-"} · {item.title || "-"}
                  </Text>
                  <Text style={{ color: "#f59e0b", marginLeft: 8 }}>
                    {item.reason || "字段不完整"}
                  </Text>
                </div>
              ))}
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PredictPage;
