// src/pages/HouseCrudPage.tsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  InputNumber,
  Button,
  Table,
  Space,
  Popconfirm,
  Typography,
  Tag,
  message,
  Row,
  Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { getToken } from "../auth/token";

const { Text, Title } = Typography;

interface HouseFormValues {
  area_sqm: number;
  bedrooms: number;
  age_years: number;
  distance_to_metro_km: number;
  price: number;
}

interface House extends HouseFormValues {
  id: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const HouseCrudPage: React.FC = () => {
  const [houseForm] = Form.useForm<HouseFormValues>();
  const [houses, setHouses] = useState<House[]>([]);
  const [housesLoading, setHousesLoading] = useState(false);
  const [savingHouse, setSavingHouse] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const buildAuthHeaders = () => {
    const token = getToken();
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchHouses = async () => {
    try {
      setHousesLoading(true);
      const res = await fetch(`${API_BASE_URL}/houses`, {
        headers: buildAuthHeaders(),
      });
      if (!res.ok) throw new Error(`获取房源列表失败：${res.status}`);
      const data: House[] = await res.json();
      setHouses(data);
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "获取房源列表失败");
    } finally {
      setHousesLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  const handleHouseFinish = async (values: HouseFormValues) => {
    try {
      setSavingHouse(true);

      const isEditing = !!editingHouse;
      const url = isEditing
        ? `${API_BASE_URL}/houses/${editingHouse!.id}`
        : `${API_BASE_URL}/houses`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(),
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${isEditing ? "更新" : "创建"}失败：${res.status} ${text}`);
      }

      await res.json();
      await fetchHouses();
      houseForm.resetFields();
      setEditingHouse(null);
      messageApi.success(isEditing ? "房源更新成功" : "房源创建成功");
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "保存房源失败");
    } finally {
      setSavingHouse(false);
    }
  };

  const handleDeleteHouse = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/houses/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });
      if (!res.ok) throw new Error(`删除失败：${res.status}`);
      messageApi.success(`房源 #${id} 已删除`);
      fetchHouses();
    } catch (err: any) {
      console.error(err);
      messageApi.error(err.message || "删除房源失败");
    }
  };

  const handleEditClick = (record: House) => {
    setEditingHouse(record);
    houseForm.setFieldsValue({
      area_sqm: record.area_sqm,
      bedrooms: record.bedrooms,
      age_years: record.age_years,
      distance_to_metro_km: record.distance_to_metro_km,
      price: record.price,
    });
  };

  const handleCancelEdit = () => {
    setEditingHouse(null);
    houseForm.resetFields();
  };

  const columns: ColumnsType<House> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
    },
    {
      title: "面积(㎡)",
      dataIndex: "area_sqm",
    },
    {
      title: "卧室数",
      dataIndex: "bedrooms",
    },
    {
      title: "房龄(年)",
      dataIndex: "age_years",
    },
    {
      title: "距地铁(km)",
      dataIndex: "distance_to_metro_km",
    },
    {
      title: "价格",
      dataIndex: "price",
      render: (value: number) => (
        <Text>
          {Math.round(value).toLocaleString()}{" "}
          <Text type="secondary">元</Text>
        </Text>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => handleEditClick(record)}>
            编辑
          </Button>
          <Popconfirm
            title={`确认删除房源 #${record.id}？`}
            onConfirm={() => handleDeleteHouse(record.id)}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Title level={3} style={{ color: "#e5e7eb", marginBottom: 8 }}>
        房源增删改查
      </Title>
      <Text type="secondary" style={{ fontSize: 13 }}>
        在这里维护训练数据 / 模拟数据，为预测模型提供样本。
      </Text>

      <Card
        style={{ marginTop: 16, marginBottom: 16 }}
        bordered={false}
        title={
          <SpaceBetween>
            <span>{editingHouse ? `编辑房源 #${editingHouse.id}` : "新增房源"}</span>
            <Tag color="green">/houses</Tag>
          </SpaceBetween>
        }
      >
        <Form form={houseForm} layout="vertical" onFinish={handleHouseFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="面积（㎡）"
                name="area_sqm"
                rules={[{ required: true, message: "请输入面积" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="卧室数"
                name="bedrooms"
                rules={[{ required: true, message: "请输入卧室数" }]}
              >
                <InputNumber min={0} max={20} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="房龄（年）"
                name="age_years"
                rules={[{ required: true, message: "请输入房龄" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="距离地铁（公里）"
                name="distance_to_metro_km"
                rules={[{ required: true, message: "请输入距离地铁" }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="价格（元）"
                name="price"
                rules={[{ required: true, message: "请输入价格" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div style={{ height: "100%", display: "flex", alignItems: "flex-end" }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={savingHouse}>
                    {editingHouse ? "保存修改" : "新增房源"}
                  </Button>
                  {editingHouse && (
                    <Button onClick={handleCancelEdit}>取消编辑</Button>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        bordered={false}
        title={
          <SpaceBetween>
            <span>当前房源列表</span>
            <Button size="small" onClick={fetchHouses} loading={housesLoading}>
              刷新
            </Button>
          </SpaceBetween>
        }
      >
        <Table
          rowKey="id"
          dataSource={houses}
          columns={columns}
          loading={housesLoading}
          pagination={{ pageSize: 8 }}
          size="small"
        />
        {houses.length === 0 && !housesLoading && (
          <Text type="secondary">
            暂无房源，可以先通过上面的表单新增一条。
          </Text>
        )}
      </Card>
    </>
  );
};

const SpaceBetween: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    {children}
  </div>
);

export default HouseCrudPage;
