import { useEffect, useState } from "react";
import { Button, Card, Table, Typography, message, Row, Col, Statistic, Tag, Space, Modal, Descriptions, Divider, Spin } from "antd";
import { api, getErrorMessage } from "../api/client";
import type { CrawlCar, TrainCar } from "../api/types";
import { resolveFileUrl } from "../utils/fileUrl";
import {
  ShoppingOutlined,
  DatabaseOutlined,
  CarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LinkOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.1)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

const LOW_BRAND_CONFIDENCE = 0.85;

function isLowBrandConfidence(record: TrainCar) {
  const brand = (record.brand || "").trim();
  return !brand || brand === "未知" || record.brand_confidence == null || record.brand_confidence < LOW_BRAND_CONFIDENCE;
}

export default function BuyerPage() {
  const [items, setItems] = useState<TrainCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [purchasingIds, setPurchasingIds] = useState<Set<number>>(new Set());
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTrainCar, setSelectedTrainCar] = useState<TrainCar | null>(null);
  const [detailCar, setDetailCar] = useState<CrawlCar | null>(null);

  const fetchData = async (pageNo: number) => {
    try {
      setLoading(true);
      const res = await api.get("/train-cars", {
        params: { page: pageNo, page_size: 50 },
      });
      const data = res.data || {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(data.page || pageNo);
      setTotal(data.total || 0);
    } catch (e: unknown) {
      message.error(getErrorMessage(e, "获取训练集失败"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const handlePurchase = async (car: TrainCar) => {
    setPurchasingIds((prev) => new Set(prev).add(car.id));
    try {
      await api.post("/buyer/purchase-intents", {
        train_car_id: car.id,
      });
      message.success("购买意向已提交，销售人员会尽快联系你");
    } catch (e: unknown) {
      message.error(getErrorMessage(e, "提交购买意向失败"));
    } finally {
      setPurchasingIds((prev) => {
        const next = new Set(prev);
        next.delete(car.id);
        return next;
      });
    }
  };

  const openDetails = async (car: TrainCar) => {
    setSelectedTrainCar(car);
    setDetailCar(null);
    setDetailOpen(true);
    if (!car.source_car_id) return;

    try {
      setDetailLoading(true);
      const res = await api.get<CrawlCar>(`/crawl-cars/${car.source_car_id}`);
      setDetailCar(res.data);
    } catch (e: unknown) {
      message.error(getErrorMessage(e, "获取车辆详细数据失败"));
    } finally {
      setDetailLoading(false);
    }
  };

  // 统计数据
  const uniqueBrands = new Set(items.map(item => item.brand)).size;
  const uniqueCities = new Set(items.map(item => item.city)).size;
  const lowConfidenceCount = items.filter(isLowBrandConfidence).length;

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (text: string) => <Text style={{ color: "#64748b" }}>{text}</Text>,
    },
    {
      title: "品牌",
      dataIndex: "brand",
      width: 120,
      render: (text: string, record: TrainCar) => (
        <Tag
          color={isLowBrandConfidence(record) ? "warning" : undefined}
          style={isLowBrandConfidence(record)
            ? {}
            : { background: "rgba(34, 211, 238, 0.1)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.3)" }}
        >
          {text || "未知"}
          {isLowBrandConfidence(record) ? " · 待复核" : ""}
        </Tag>
      ),
    },
    {
      title: "品牌置信度",
      dataIndex: "brand_confidence",
      width: 130,
      render: (value: number | null | undefined, record: TrainCar) => {
        const low = isLowBrandConfidence(record);
        return (
          <Space direction="vertical" size={2}>
            <Tag color={low ? "error" : "success"}>
              {value == null ? "未评估" : `${Math.round(value * 100)}%`}
            </Tag>
            {record.brand_source && (
              <Text style={{ color: low ? "#f59e0b" : "#94a3b8", fontSize: 12 }}>
                {record.brand_source}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "车型",
      dataIndex: "model",
      width: 180,
      render: (text: string) => <Text style={{ color: "#e2e8f0" }}>{text}</Text>,
    },
    {
      title: "年份",
      dataIndex: "year",
      width: 80,
      render: (text: number) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "城市",
      dataIndex: "city",
      width: 100,
      render: (text: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <EnvironmentOutlined style={{ color: "#64748b", fontSize: 12 }} />
          <Text style={{ color: "#94a3b8" }}>{text}</Text>
        </div>
      ),
    },
    {
      title: "变速箱",
      dataIndex: "gearbox",
      width: 100,
      render: (text: string) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "排量",
      dataIndex: "displacement",
      width: 100,
      render: (text: string) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "过户次数",
      dataIndex: "transfer_count",
      width: 100,
      render: (text: number) => <Text style={{ color: "#94a3b8" }}>{text}</Text>,
    },
    {
      title: "价格(万)",
      dataIndex: "price_wan",
      width: 120,
      render: (text: number) => (
        <Text style={{ color: "#10b981", fontWeight: 600 }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {text}
        </Text>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 230,
      fixed: "right" as const,
      render: (_: unknown, record: TrainCar) => (
        <Space>
          <Button icon={<InfoCircleOutlined />} onClick={() => openDetails(record)}>
            详细数据
          </Button>
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            loading={purchasingIds.has(record.id)}
            onClick={() => handlePurchase(record)}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
            }}
          >
            购买意向
          </Button>
        </Space>
      ),
    },
  ];

  const detailImage = resolveFileUrl(detailCar?.image_path) || resolveFileUrl(detailCar?.image_url);
  const paramSections = detailCar?.vehicle_params?.sections || [];

  return (
    <div className="page-shell">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <ShoppingOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          车辆数据集
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          展示已标注的干净数据（训练集）
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>总车辆</Text>}
              value={total}
              prefix={<DatabaseOutlined style={{ color: "#22d3ee" }} />}
              valueStyle={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>品牌数</Text>}
              value={uniqueBrands}
              prefix={<CarOutlined style={{ color: "#f59e0b" }} />}
              valueStyle={{ color: "#f59e0b", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>覆盖城市</Text>}
              value={uniqueCities}
              prefix={<EnvironmentOutlined style={{ color: "#10b981" }} />}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>低置信品牌</Text>}
              value={lowConfidenceCount}
              prefix={<ExclamationCircleOutlined style={{ color: "#a78bfa" }} />}
              valueStyle={{ color: "#a78bfa", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card
        style={cardStyle}
        title={<Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600 }}>车辆列表</Text>}
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{
            current: page,
            pageSize: 50,
            total,
            showSizeChanger: false,
            onChange: (p) => fetchData(p),
            style: { marginTop: 16 },
          }}
          columns={columns}
          scroll={{ x: 1320 }}
        />
      </Card>

      <Modal
        open={detailOpen}
        title={<Text style={{ color: "#f1f5f9" }}>车辆详细数据</Text>}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={980}
        styles={{
          header: { background: "#0f172a" },
          body: { background: "#0f172a", maxHeight: "72vh", overflow: "auto" },
        }}
      >
        <Spin spinning={detailLoading}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions
              size="small"
              column={2}
              bordered
              styles={{
                label: { background: "rgba(15, 23, 42, 0.85)", color: "#94a3b8" },
                content: { background: "rgba(15, 23, 42, 0.5)", color: "#e2e8f0" },
              }}
            >
              <Descriptions.Item label="品牌">{selectedTrainCar?.brand || "-"}</Descriptions.Item>
              <Descriptions.Item label="车型">{selectedTrainCar?.model || "-"}</Descriptions.Item>
              <Descriptions.Item label="价格">{selectedTrainCar?.price_wan ?? "-"} 万</Descriptions.Item>
              <Descriptions.Item label="车源ID">{selectedTrainCar?.source_car_id || "-"}</Descriptions.Item>
              <Descriptions.Item label="品牌置信度">
                {selectedTrainCar?.brand_confidence == null
                  ? "未评估"
                  : `${Math.round(selectedTrainCar.brand_confidence * 100)}%`}
                {selectedTrainCar?.brand_source ? ` · ${selectedTrainCar.brand_source}` : ""}
              </Descriptions.Item>
              <Descriptions.Item label="源头网址">
                {detailCar?.source_url ? (
                  <a href={detailCar.source_url} target="_blank" rel="noreferrer">
                    <LinkOutlined /> 打开
                  </a>
                ) : "-"}
              </Descriptions.Item>
            </Descriptions>

            {detailImage && (
              <img
                src={detailImage}
                alt="car"
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "contain",
                  borderRadius: 8,
                  background: "rgba(2, 6, 23, 0.55)",
                }}
              />
            )}

            <div>
              <Text strong style={{ color: "#e2e8f0" }}>爬虫基础字段</Text>
              <Descriptions
                size="small"
                column={1}
                bordered
                style={{ marginTop: 8 }}
                styles={{
                  label: { background: "rgba(15, 23, 42, 0.85)", color: "#94a3b8", width: 160 },
                  content: { background: "rgba(15, 23, 42, 0.5)", color: "#e2e8f0" },
                }}
              >
                {Object.entries(detailCar?.info || {}).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {value == null ? "-" : String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </div>

            {paramSections.length > 0 && (
              <div>
                <Divider style={{ borderColor: "rgba(148, 163, 184, 0.12)" }} />
                <Text strong style={{ color: "#e2e8f0" }}>MongoDB 详细参数</Text>
                <Space direction="vertical" size={12} style={{ width: "100%", marginTop: 8 }}>
                  {paramSections.map((section, index) => (
                    <div key={`${section.title || "section"}-${index}`}>
                      <Text style={{ color: "#7dd3fc", fontWeight: 600 }}>
                        {section.title || "未分组"}
                      </Text>
                      <Descriptions
                        size="small"
                        column={1}
                        bordered
                        style={{ marginTop: 6 }}
                        styles={{
                          label: { background: "rgba(15, 23, 42, 0.85)", color: "#94a3b8", width: 180 },
                          content: { background: "rgba(15, 23, 42, 0.5)", color: "#e2e8f0" },
                        }}
                      >
                        {(section.items || []).map((item, itemIndex) => (
                          <Descriptions.Item key={`${item.name || "item"}-${itemIndex}`} label={item.name || "-"}>
                            {item.value == null ? "-" : String(item.value)}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    </div>
                  ))}
                </Space>
              </div>
            )}
          </Space>
        </Spin>
      </Modal>
    </div>
  );
}
