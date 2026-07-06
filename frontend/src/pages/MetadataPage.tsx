import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  List,
  Button,
  Drawer,
  Form,
  InputNumber,
  Input,
  Typography,
  Tag,
  message,
  Space,
  Card,
  Divider,
  Descriptions,
  Row,
  Col,
  Statistic,
  Badge,
} from "antd";
import { api, getErrorMessage } from "../api/client";
import type { CrawlCar, PageResp } from "../api/types";
import { resolveFileUrl } from "../utils/fileUrl";
import {
  EditOutlined,
  CheckCircleOutlined,
  CarOutlined,
  TagsOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

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

interface AnnotationForm {
  price_wan: number;
}

function getSuggestedPrice(
  info?: Record<string, string | number | null>
): number | undefined {
  if (!info) return undefined;

  if (typeof info["当前售价"] === "number") {
    return info["当前售价"];
  }

  if (
    typeof info["新车指导价"] === "number" &&
    typeof info["比新车省"] === "number"
  ) {
    return Number(
      (info["新车指导价"] - info["比新车省"]).toFixed(2)
    );
  }

  return undefined;
}

const CarAnnotationPage: React.FC = () => {
  const [cars, setCars] = useState<CrawlCar[]>([]);
  const [annotatedIds, setAnnotatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 100;
  const [keyword, setKeyword] = useState("");

  const [selected, setSelected] = useState<CrawlCar | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const [form] = Form.useForm<AnnotationForm>();
  const [messageApi, contextHolder] = message.useMessage();
  const keywordRef = useRef(keyword);

  useEffect(() => {
    keywordRef.current = keyword;
  }, [keyword]);

  const fetchCars = useCallback(async (pageNo: number, kw?: string) => {
    try {
      setLoading(true);
      const keywordValue = (kw ?? keywordRef.current).trim();
      const res = await api.get<PageResp<CrawlCar>>("/crawl-cars", {
        params: { page: pageNo, page_size: pageSize, keyword: keywordValue || undefined },
      });
      const data = res.data;
      const items = Array.isArray(data?.items) ? data.items : [];
      const normalized = items.map((item) => ({
        ...item,
        car_id: item.car_id || item.source_car_id,
      }));
      setCars(normalized);
      setTotal(Number(data?.total || 0));
      setPage(Number(data?.page || pageNo));
    } catch (e: unknown) {
      messageApi.error(getErrorMessage(e, "获取爬虫车辆失败"));
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [messageApi, pageSize]);

  const fetchAnnotatedIds = async (items: CrawlCar[]) => {
    if (!items.length) {
      setAnnotatedIds(new Set());
      return;
    }
    try {
      const idsParam = items
        .map((c) => c.car_id ?? c.source_car_id ?? "")
        .filter((v): v is string => v.length > 0)
        .join(",");
      if (!idsParam) {
        setAnnotatedIds(new Set());
        return;
      }
      const res = await api.get<string[]>("/annotations/ids", {
        params: { source_ids: idsParam },
      });
      const ids = res.data;
      setAnnotatedIds(new Set(ids));
    } catch (e: unknown) {
      console.warn(getErrorMessage(e, "获取已标注车辆失败"));
    }
  };

  useEffect(() => {
    void fetchCars(1);
  }, [fetchCars]);
  useEffect(() => {
    fetchAnnotatedIds(cars);
  }, [cars]);

  const openAnnotate = (car: CrawlCar) => {
    setSelected(car);
    setImageFailed(false);
    setDrawerOpen(true);

    const suggested = getSuggestedPrice(car.info);

    form.setFieldsValue({
      price_wan: suggested,
    });
  };

  const submitAnnotation = async (values: AnnotationForm) => {
    if (!selected) return;

    try {
      const payload = {
        source_car_id: selected.car_id,
        price_wan: values.price_wan,
      };

      await api.post("/annotations", payload);

      messageApi.success("标注成功");

      setDrawerOpen(false);
      setSelected(null);
      form.resetFields();
      fetchAnnotatedIds(cars);
    } catch (e: unknown) {
      messageApi.error(getErrorMessage(e, "标注失败"));
    }
  };

  const deleteCar = async (car: CrawlCar) => {
    const id = car.car_id ?? car.source_car_id ?? "";
    if (!id) return;
    try {
      await api.delete(`/crawl-cars/${id}`);
      messageApi.success("数据已删除");
      await fetchCars(page);
    } catch (e: unknown) {
      messageApi.error(getErrorMessage(e, "删除失败"));
    }
  };

  // 统计数据
  const annotatedCount = cars.filter(car => {
    const carId = car.car_id ?? car.source_car_id ?? "";
    return carId ? annotatedIds.has(carId) : false;
  }).length;
  const selectedLocalImageSrc = resolveFileUrl(selected?.image_path);
  const selectedRemoteImageSrc = resolveFileUrl(selected?.image_url);
  const selectedImageSrc = imageFailed && selectedRemoteImageSrc
    ? selectedRemoteImageSrc
    : selectedLocalImageSrc || selectedRemoteImageSrc;

  return (
    <div className="page-shell">
      {contextHolder}

      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <DatabaseOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          车辆价格标注
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          爬虫已给出网页参考价，人工仅需确认或微调
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>总车辆</Text>}
              value={total}
              prefix={<CarOutlined style={{ color: "#22d3ee" }} />}
              valueStyle={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>已标注</Text>}
              value={annotatedCount}
              prefix={<CheckCircleOutlined style={{ color: "#10b981" }} />}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>待标注</Text>}
              value={total - annotatedCount}
              prefix={<EditOutlined style={{ color: "#f59e0b" }} />}
              valueStyle={{ color: "#f59e0b", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 车辆列表 */}
      <Card style={cardStyle}>
        <Space style={{ width: "100%", marginBottom: 12 }} direction="vertical">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchCars(1)}
            placeholder="输入车源ID或标题搜索"
            prefix={<SearchOutlined />}
            allowClear
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              borderColor: "rgba(148, 163, 184, 0.2)",
              color: "#e2e8f0",
            }}
          />
          <Space>
            <Button type="primary" onClick={() => fetchCars(1)} style={gradientButtonStyle}>
              搜索
            </Button>
            <Button
              onClick={() => {
                setKeyword("");
                fetchCars(1, "");
              }}
            >
              重置
            </Button>
          </Space>
        </Space>
        <List
          loading={loading}
          dataSource={cars}
          rowKey={(item) => item.car_id ?? item.source_car_id ?? item.title ?? ""}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => fetchCars(p),
            showSizeChanger: false,
            style: { marginTop: 16 },
          }}
          renderItem={(item) => {
            const carId = item.car_id ?? item.source_car_id ?? "";
            const annotated = carId ? annotatedIds.has(carId) : false;

            return (
              <List.Item
                style={{
                  borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                  padding: "16px 0",
                }}
                actions={[
                  <Button
                    type="primary"
                    disabled={annotated}
                    onClick={() => openAnnotate(item)}
                    icon={annotated ? <CheckCircleOutlined /> : <EditOutlined />}
                    style={annotated ? {} : gradientButtonStyle}
                  >
                    {annotated ? "已标注" : "标注"}
                  </Button>,
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteCar(item)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 500 }}>
                        {item.title}
                      </Text>
                      {annotated && (
                        <Badge
                          status="success"
                          text={<Text style={{ color: "#10b981" }}>已标注</Text>}
                        />
                      )}
                    </Space>
                  }
                  description={
                    item.tags && (
                      <Space wrap style={{ marginTop: 8 }}>
                        <TagsOutlined style={{ color: "#64748b" }} />
                        {item.tags.map((t) => (
                          <Tag
                            key={t}
                            style={{
                              background: "rgba(34, 211, 238, 0.1)",
                              color: "#22d3ee",
                              border: "1px solid rgba(34, 211, 238, 0.3)",
                            }}
                          >
                            {t}
                          </Tag>
                        ))}
                      </Space>
                    )
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      <Drawer
        title={<Text style={{ color: "#f1f5f9" }}>车辆价格标注（确认 / 微调）</Text>}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size="large"
        styles={{
          header: { background: "#0f172a", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
          body: { background: "#0f172a" },
          mask: { background: "rgba(0, 0, 0, 0.7)" },
        }}
      >
        {selected && (
          <>
            <Card style={{ ...cardStyle, marginBottom: 16 }}>
              <Title level={5} style={{ color: "#f1f5f9" }}>{selected.title}</Title>

              {selectedImageSrc && (
                <>
                  <Divider style={{ borderColor: "rgba(148, 163, 184, 0.1)" }} />
                  <img
                    src={selectedImageSrc}
                    alt="car"
                    onError={() => {
                      if (
                        !imageFailed &&
                        selectedRemoteImageSrc &&
                        selectedRemoteImageSrc !== selectedImageSrc
                      ) {
                        setImageFailed(true);
                      }
                    }}
                    style={{
                      width: "100%",
                      maxHeight: 320,
                      objectFit: "contain",
                      borderRadius: 8,
                    }}
                  />
                </>
              )}

              {selected.info && (
                <>
                  <Divider style={{ borderColor: "rgba(148, 163, 184, 0.1)" }} />
                  <Descriptions
                    size="small"
                    column={2}
                    bordered
                    styles={{
                      label: { background: "rgba(15, 23, 42, 0.8)", color: "#94a3b8" },
                      content: { background: "rgba(15, 23, 42, 0.6)", color: "#e2e8f0" },
                    }}
                  >
                    {Object.entries(selected.info).map(([k, v]) => (
                      <Descriptions.Item key={k} label={k}>
                        {v ?? "-"}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </>
              )}
            </Card>

            <Divider style={{ borderColor: "rgba(148, 163, 184, 0.1)" }} />

            <Form
              form={form}
              layout="vertical"
              onFinish={submitAnnotation}
            >
              <Form.Item
                name="price_wan"
                label={<Text style={{ color: "#94a3b8" }}>成交价（万元，已填网页参考价）</Text>}
                rules={[{ required: true, message: "请输入成交价（万元）" }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{
                    width: "100%",
                    background: "rgba(15, 23, 42, 0.6)",
                    borderColor: "rgba(148, 163, 184, 0.2)",
                    color: "#e2e8f0",
                  }}
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" block style={gradientButtonStyle}>
                确认标注
              </Button>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default CarAnnotationPage;
