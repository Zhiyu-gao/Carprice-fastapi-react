import React, { useEffect, useState } from "react";
import {
  List,
  Button,
  Drawer,
  Form,
  InputNumber,
  Typography,
  Tag,
  message,
  Space,
  Card,
  Divider,
  Descriptions,
} from "antd";

const { Title, Text } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* =====================
   类型定义
===================== */

interface CrawlCar {
  car_id: string;
  title: string;
  tags?: string[];
  info?: Record<string, string | number | null>;
  image_path?: string;
  crawl_time?: string;
}

interface AnnotationForm {
  price_wan: number;
}

/* =====================
   工具函数
===================== */

/** 从 info 中提取“建议标注价” */
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

/* =====================
   主组件
===================== */

const CarAnnotationPage: React.FC = () => {
  const [cars, setCars] = useState<CrawlCar[]>([]);
  const [annotatedIds, setAnnotatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<CrawlCar | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [form] = Form.useForm<AnnotationForm>();
  const [messageApi, contextHolder] = message.useMessage();

  /* =====================
     数据加载
  ===================== */

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/crawl-cars`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCars(Array.isArray(data) ? data : []);
    } catch {
      messageApi.error("获取爬虫车辆失败");
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnotatedIds = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/annotations/ids`);
      if (!res.ok) throw new Error();
      const ids: string[] = await res.json();
      setAnnotatedIds(new Set(ids));
    } catch {
      console.warn("获取已标注车辆失败");
    }
  };

  useEffect(() => {
    fetchCars();
    fetchAnnotatedIds();
  }, []);

  /* =====================
     标注流程
  ===================== */

  const openAnnotate = (car: CrawlCar) => {
    setSelected(car);
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

      const res = await fetch(`${API_BASE_URL}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "标注失败");
      }

      messageApi.success("标注成功");

      setDrawerOpen(false);
      setSelected(null);
      form.resetFields();
      fetchAnnotatedIds();
    } catch (e: any) {
      messageApi.error(e.message || "标注失败");
    }
  };

  /* =====================
     渲染
  ===================== */

  return (
    <>
      {contextHolder}

      <Title level={3}>车辆价格标注</Title>
      <Text type="secondary">
        爬虫已给出网页参考价，人工仅需确认或微调
      </Text>

      <List
        loading={loading}
        style={{ marginTop: 16 }}
        dataSource={cars}
        rowKey="car_id"
        renderItem={(item) => {
          const annotated = annotatedIds.has(item.car_id);

          return (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  disabled={annotated}
                  onClick={() => openAnnotate(item)}
                >
                  {annotated ? "已标注" : "标注"}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{item.title}</span>
                    {annotated && <Tag color="green">已标注</Tag>}
                  </Space>
                }
                description={
                  item.tags && (
                    <Space wrap>
                      {item.tags.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </Space>
                  )
                }
              />
            </List.Item>
          );
        }}
      />

      <Drawer
        title="车辆价格标注（确认 / 微调）"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size="large"
      >
        {selected && (
          <>
            <Card bordered={false}>
              <Title level={5}>{selected.title}</Title>

              {selected.image_path && (
                <>
                  <Divider />
                  <img
                    src={`${API_BASE_URL}/files/${selected.image_path}`}
                    alt="car"
                    style={{
                      width: "100%",
                      maxHeight: 320,
                      objectFit: "contain",
                    }}
                  />
                </>
              )}

              {selected.info && (
                <>
                  <Divider />
                  <Descriptions
                    size="small"
                    column={2}
                    bordered
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

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={submitAnnotation}
            >
              <Form.Item
                name="price_wan"
                label="成交价（万元，已填网页参考价）"
                rules={[{ required: true, message: "请输入成交价（万元）" }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" block>
                确认标注
              </Button>
            </Form>
          </>
        )}
      </Drawer>
    </>
  );
};

export default CarAnnotationPage;
