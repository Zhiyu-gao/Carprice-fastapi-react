import { useEffect, useState } from "react";
import { Card, Table, Typography, message } from "antd";
import { api, getErrorMessage } from "../api/client";
import type { TrainCar } from "../api/types";

const { Title, Text } = Typography;

export default function BuyerPage() {
  const [items, setItems] = useState<TrainCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取训练集失败"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 4 }}>
        我要买房 · 训练集
      </Title>
      <Text type="secondary">展示已标注的干净数据（训练集）</Text>

      <Table
        style={{ marginTop: 16 }}
        rowKey="id"
        loading={loading}
        dataSource={items}
        pagination={{
          current: page,
          pageSize: 50,
          total,
          showSizeChanger: false,
          onChange: (p) => fetchData(p),
        }}
        columns={[
          { title: "ID", dataIndex: "id", width: 80 },
          { title: "来源ID", dataIndex: "source_car_id", width: 120 },
          { title: "品牌", dataIndex: "brand", width: 120 },
          { title: "车型", dataIndex: "model", width: 160 },
          { title: "年份", dataIndex: "year", width: 80 },
          { title: "城市", dataIndex: "city", width: 120 },
          { title: "变速箱", dataIndex: "gearbox", width: 120 },
          { title: "排量", dataIndex: "displacement", width: 100 },
          { title: "过户次数", dataIndex: "transfer_count", width: 100 },
          { title: "价格(万)", dataIndex: "price_wan", width: 120 },
        ]}
      />
    </Card>
  );
}
