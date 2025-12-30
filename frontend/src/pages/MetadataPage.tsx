import React, { useEffect, useState } from "react";
import {
  Card,
  List,
  Button,
  Drawer,
  Form,
  InputNumber,
  Typography,
  Tag,
  message,
  Divider,
  Space,
} from "antd";

const { Title, Text } = Typography;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* =====================
   类型定义
===================== */

interface CrawlVehicle {
  vehicle_id: string;
  title: string;
  area_sqm: number;
  layout: string;
  build_year: number;
  total_price_wan: number;
  unit_price: number;
  district: string;
  cover_image: string;
  crawl_time: string;
}

interface AnnotationForm {
  area_sqm: number;
  bedrooms: number;
  age_years: number;
  price: number;
}

/* =====================
   工具函数
===================== */

function parseBedrooms(layout: string): number {
  const match = layout.match(/(\d+)室/);
  return match ? Number(match[1]) : 0;
}

function calcAge(buildYear: number): number {
  return new Date().getFullYear() - buildYear;
}

/* =====================
   主组件
===================== */

const MetadataPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<CrawlVehicle[]>([]);
  const [annotatedIds, setAnnotatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<CrawlVehicle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [form] = Form.useForm<AnnotationForm>();
  const [messageApi, contextHolder] = message.useMessage();

  /* =====================
     数据加载
  ===================== */

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/crawl-vehicles`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      messageApi.error("获取爬虫车辆失败");
      setVehicles([]);
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
      console.warn("获取标注状态失败");
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchAnnotatedIds();
  }, []);

  /* =====================
     标注流程
  ===================== */

  const openAnnotate = (vehicle: CrawlVehicle) => {
    setSelected(vehicle);
    setDrawerOpen(true);

    form.setFieldsValue({
      area_sqm: vehicle.area_sqm,
      bedrooms: parseBedrooms(vehicle.layout),
      age_years: calcAge(vehicle.build_year),
      price: vehicle.total_price_wan * 10000,
    });
  };

  const submitAnnotation = async (values: AnnotationForm) => {
    if (!selected) return;

    try {
      const payload = {
        source_vehicle_id: selected.vehicle_id,
        features: {
          area_sqm: values.area_sqm,
          bedrooms: values.bedrooms,
          age_years: values.age_years,
        },
        label: {
          price: values.price,
        },
      };

      const res = await fetch(`${API_BASE_URL}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      messageApi.success("已标注并加入训练集");

      setDrawerOpen(false);
      setSelected(null);
      form.resetFields();

      // 🔥 关键：刷新标注状态
      fetchAnnotatedIds();
    } catch {
      messageApi.error("标注失败");
    }
  };

  /* =====================
     渲染
  ===================== */

  return (
    <>
      {contextHolder}

      <Title level={3}>爬虫车辆 · 数据标注</Title>
      <Text type="secondary">
        将真实爬虫车辆转化为模型可训练的数据样本（只读原始数据）
      </Text>

      <List
        loading={loading}
        style={{ marginTop: 16 }}
        dataSource={vehicles}
        renderItem={(item) => {
          const annotated = annotatedIds.has(item.vehicle_id);

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
                  <>
                    <Text>
                      {item.area_sqm}㎡ · {item.layout}
                    </Text>
                    <br />
                    <Tag>{item.district}</Tag>
                    <Text type="secondary">
                      总价 {item.total_price_wan} 万
                    </Text>
                  </>
                }
              />
            </List.Item>
          );
        }}
      />

      <Drawer
        title="车辆标注（生成训练样本）"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size="large"
      >
        {selected && (
          <>
            <Card size="small" bordered={false}>
              <Text strong>{selected.title}</Text>
              <Divider />
              <Text>面积：{selected.area_sqm}㎡</Text>
              <br />
              <Text>户型：{selected.layout}</Text>
              <br />
              <Text>建成年份：{selected.build_year}</Text>
              <br />
              <Text>挂牌价：{selected.total_price_wan} 万</Text>
            </Card>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={submitAnnotation}
            >
              <Form.Item name="area_sqm" label="面积（㎡）" required>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item name="bedrooms" label="卧室数" required>
                <InputNumber min={0} />
              </Form.Item>

              <Form.Item name="age_years" label="房龄（年）" required>
                <InputNumber min={0} />
              </Form.Item>

              <Form.Item name="price" label="真实成交价格（元）" required>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>

              <Button type="primary" htmlType="submit" block>
                确认标注并加入训练集
              </Button>
            </Form>
          </>
        )}
      </Drawer>
    </>
  );
};

export default MetadataPage;
