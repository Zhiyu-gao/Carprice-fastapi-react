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
import { api, getErrorMessage } from "../api/client";
import type { CrawlCar, PageResp } from "../api/types";

const { Title, Text } = Typography;
/* =====================
   类型定义
===================== */

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 100;

  const [selected, setSelected] = useState<CrawlCar | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [form] = Form.useForm<AnnotationForm>();
  const [messageApi, contextHolder] = message.useMessage();

  /* =====================
     数据加载
  ===================== */

  const fetchCars = async (pageNo: number) => {
    try {
      setLoading(true);
      const res = await api.get<PageResp<CrawlCar>>("/crawl-cars", {
        params: { page: pageNo, page_size: pageSize },
      });
      const data = res.data;
      const items = Array.isArray(data?.items) ? data.items : [];
      const normalized = items.map((item: any) => ({
        ...item,
        car_id: item.car_id || item.source_car_id,
      }));
      setCars(normalized);
      setTotal(Number(data?.total || 0));
      setPage(Number(data?.page || pageNo));
    } catch (e: any) {
      messageApi.error(getErrorMessage(e, "获取爬虫车辆失败"));
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (e: any) {
      console.warn(getErrorMessage(e, "获取已标注车辆失败"));
    }
  };

  useEffect(() => {
    fetchCars(1);
  }, []);
  useEffect(() => {
    fetchAnnotatedIds(cars);
  }, [cars]);

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

      await api.post("/annotations", payload);

      messageApi.success("标注成功");

      setDrawerOpen(false);
      setSelected(null);
      form.resetFields();
      fetchAnnotatedIds(cars);
    } catch (e: any) {
      messageApi.error(getErrorMessage(e, "标注失败"));
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
        rowKey={(item) => item.car_id ?? item.source_car_id ?? item.title ?? ""}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p) => fetchCars(p),
          showSizeChanger: false,
        }}
        renderItem={(item) => {
          const carId = item.car_id ?? item.source_car_id ?? "";
          const annotated = carId ? annotatedIds.has(carId) : false;

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
                    src={`${import.meta.env.VITE_API_BASE_URL}/files/${selected.image_path}`}
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
