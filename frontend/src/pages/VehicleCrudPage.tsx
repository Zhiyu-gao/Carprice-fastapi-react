// src/pages/VehicleCrudPage.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
  Space,
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getToken } from "../auth/token";

const { Title, Text } = Typography;

interface Vehicle {
  id: number;
  area_sqm: number;
  bedrooms: number;
  age_years: number;
  price: number;
}

interface VehicleFormValues {
  area_sqm: number;
  bedrooms: number;
  age_years: number;
  price: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const VehicleCrudPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<VehicleFormValues>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // 加载车辆列表
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/vehicles`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("获取车辆列表失败");

      const data = await res.json();
      setVehicles(data);
    } catch (err: any) {
      messageApi.error(err.message || "获取车辆列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchVehicles();
  }, []);

  // 打开新增/编辑弹窗
  const openModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      form.setFieldsValue(vehicle);
    } else {
      setEditingVehicle(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭弹窗
  const closeModal = () => {
    setModalVisible(false);
    setEditingVehicle(null);
    form.resetFields();
  };

  // 保存车辆信息（新增或编辑）
  const handleSave = async (values: VehicleFormValues) => {
    try {
      const token = getToken();
      const method = editingVehicle ? "PUT" : "POST";
      const url = editingVehicle
        ? `${API_BASE_URL}/vehicles/${editingVehicle.id}`
        : `${API_BASE_URL}/vehicles`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error(editingVehicle ? "更新车辆失败" : "添加车辆失败");

      messageApi.success(editingVehicle ? "更新车辆成功" : "添加车辆成功");
      closeModal();
      fetchVehicles(); // 重新加载列表
    } catch (err: any) {
      messageApi.error(err.message || "操作失败");
    }
  };

  // 删除车辆
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个车辆信息吗？",
      onOk: async () => {
        try {
          const token = getToken();
          const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
            method: "DELETE",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          if (!res.ok) throw new Error("删除车辆失败");

          messageApi.success("删除车辆成功");
          fetchVehicles(); // 重新加载列表
        } catch (err: any) {
          messageApi.error(err.message || "删除失败");
        }
      },
    });
  };

  // 表格列配置
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "内部空间面积（㎡）",
      dataIndex: "area_sqm",
      key: "area_sqm",
      render: (text: number) => <Text>{text} ㎡</Text>,
    },
    {
      title: "座位数",
      dataIndex: "bedrooms",
      key: "bedrooms",
    },
    {
      title: "使用年限（年）",
      dataIndex: "age_years",
      key: "age_years",
    },
    {
      title: "价格（元）",
      dataIndex: "price",
      key: "price",
      render: (text: number) => <Text strong>{Math.round(text).toLocaleString()} 元</Text>,
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Vehicle) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Title level={3} style={{ color: "#e5e7eb", marginBottom: 8 }}>
        车辆管理
      </Title>
      <Text type="secondary" style={{ fontSize: 13 }}>
        管理车辆信息，支持增删改查操作
      </Text>

      <div style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
          style={{ marginBottom: 16 }}
        >
          添加车辆
        </Button>

        <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
          <Table
            columns={columns}
            dataSource={vehicles}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 600 }}
            bordered={false}
            style={{ background: "transparent" }}
            rowClassName="vehicle-table-row"
          />
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingVehicle ? "编辑车辆" : "新增车辆"}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            area_sqm: 80,
            bedrooms: 3,
            age_years: 5,
            price: 100000,
          }}
        >
          <Form.Item
            label="内部空间面积（㎡）"
            name="area_sqm"
            rules={[{ required: true, message: "请输入内部空间面积" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="座位数"
            name="bedrooms"
            rules={[{ required: true, message: "请输入座位数" }]}
          >
            <InputNumber min={1} max={20} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="使用年限（年）"
            name="age_years"
            rules={[{ required: true, message: "请输入使用年限" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="价格（元）"
            name="price"
            rules={[{ required: true, message: "请输入价格" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={closeModal}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingVehicle ? "更新" : "保存"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default VehicleCrudPage;