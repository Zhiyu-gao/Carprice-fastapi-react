import { Card, Table, Tag, Button, Space, message, Modal, Form, Input, Typography, Row, Col, Statistic, Switch, Checkbox } from "antd";
import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  BugOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface CrawlerTask {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "failed" | "canceled";
  created_at: string;
  updated_at: string;
  city_name: string;
  city_code: string;
  log_url?: string;
  write_local_db?: boolean;
  write_cloud_db?: boolean;
  use_cookie_json?: boolean;
  cookie_json_path?: string;
}

type CityOption = { label: string; value: string };
type CityGroup = { key: string; title: string; cities: string[] };
type RawCityItem = { raw: string; norm: string; adcode: string };

const CITY_GROUPS: CityGroup[] = [
  { key: "HOT", title: "热门", cities: ["北京", "上海", "广州", "深圳", "重庆", "天津", "成都", "杭州", "武汉", "苏州", "西安", "南京"] },
  { key: "A", title: "A", cities: ["阿拉善", "鞍山", "安庆", "安阳", "阿坝", "安顺", "阿里", "安康", "阿克苏", "阿勒泰", "阿拉尔", "澳门"] },
  { key: "B", title: "B", cities: ["北京", "保定", "包头", "巴彦淖尔", "本溪", "白山", "白城", "蚌埠", "亳州", "滨州", "北海", "百色", "白沙", "保亭", "巴中", "毕节", "保山", "宝鸡", "白银", "博尔塔拉", "巴音郭楞", "北屯"] },
  { key: "C", title: "C", cities: ["承德", "沧州", "长治", "赤峰", "朝阳", "长春", "常州", "滁州", "池州", "长沙", "常德", "郴州", "潮州", "崇左", "澄迈", "昌江", "重庆", "成都", "楚雄", "昌都", "昌吉"] },
  { key: "D", title: "D", cities: ["定安", "大同", "大连", "丹东", "大庆", "大兴安岭", "东营", "德州", "东莞", "儋州", "东方", "德阳", "达州", "大理", "德宏", "迪庆", "定西"] },
  { key: "E", title: "E", cities: ["鄂尔多斯", "鄂州", "恩施"] },
  { key: "F", title: "F", cities: ["抚顺", "阜新", "阜阳", "福州", "抚州", "佛山", "防城港"] },
  { key: "G", title: "G", cities: ["赣州", "广州", "桂林", "贵港", "广元", "广安", "甘孜", "贵阳", "甘南", "果洛", "固原", "高雄"] },
  { key: "H", title: "H", cities: ["邯郸", "衡水", "呼和浩特", "呼伦贝尔", "葫芦岛", "哈尔滨", "鹤岗", "黑河", "淮安", "杭州", "湖州", "合肥", "淮南", "淮北", "黄山", "菏泽", "鹤壁", "黄石", "黄冈", "衡阳", "怀化", "惠州", "河源", "贺州", "河池", "海口", "红河", "汉中", "海东", "海北", "黄南", "海南州", "海西", "哈密", "和田", "胡杨河"] },
  { key: "J", title: "J", cities: ["晋城", "晋中", "锦州", "吉林", "鸡西", "佳木斯", "嘉兴", "金华", "景德镇", "九江", "吉安", "济南", "济宁", "焦作", "济源", "荆门", "荆州", "江门", "揭阳", "嘉峪关", "金昌", "酒泉"] },
  { key: "K", title: "K", cities: ["开封", "昆明", "克拉玛依", "克孜勒苏", "喀什", "可克达拉", "昆玉"] },
  { key: "L", title: "L", cities: ["廊坊", "临汾", "吕梁", "辽阳", "辽源", "连云港", "丽水", "六安", "龙岩", "临沂", "聊城", "洛阳", "漯河", "娄底", "柳州", "来宾", "临高", "乐东", "陵水", "泸州", "乐山", "凉山", "六盘水", "丽江", "临沧", "拉萨", "林芝", "兰州", "陇南", "临夏"] },
  { key: "M", title: "M", cities: ["牡丹江", "马鞍山", "茂名", "梅州", "绵阳", "眉山"] },
  { key: "N", title: "N", cities: ["南京", "南通", "宁波", "南平", "宁德", "南昌", "南阳", "南宁", "内江", "南充", "怒江", "那曲"] },
  { key: "P", title: "P", cities: ["盘锦", "莆田", "萍乡", "平顶山", "濮阳", "攀枝花", "普洱", "平凉"] },
  { key: "Q", title: "Q", cities: ["秦皇岛", "齐齐哈尔", "七台河", "衢州", "泉州", "青岛", "潜江", "清远", "钦州", "琼中", "琼海", "黔西南", "黔东南", "黔南", "曲靖", "庆阳"] },
  { key: "R", title: "R", cities: ["日照", "日喀则"] },
  { key: "S", title: "S", cities: ["神农架", "石家庄", "朔州", "沈阳", "四平", "松原", "双鸭山", "绥化", "上海", "苏州", "宿迁", "绍兴", "宿州", "三明", "上饶", "三门峡", "商丘", "十堰", "随州", "邵阳", "韶关", "深圳", "汕头", "汕尾", "三亚", "三沙", "遂宁", "山南", "商洛", "石嘴山", "双河", "石河子"] },
  { key: "T", title: "T", cities: ["天津", "唐山", "太原", "通辽", "铁岭", "通化", "泰州", "台州", "铜陵", "泰安", "天门", "屯昌", "铜仁", "铜川", "天水", "吐鲁番", "塔城", "铁门关", "图木舒克", "台北"] },
  { key: "W", title: "W", cities: ["乌海", "乌兰察布", "无锡", "温州", "芜湖", "潍坊", "威海", "武汉", "梧州", "五指山", "文昌", "万宁", "文山", "渭南", "武威", "吴忠", "乌鲁木齐", "五家渠"] },
  { key: "X", title: "X", cities: ["邢台", "忻州", "兴安", "锡林郭勒", "徐州", "宣城", "厦门", "新余", "新乡", "许昌", "信阳", "襄阳", "孝感", "咸宁", "仙桃", "湘潭", "湘西", "西双版纳", "西安", "咸阳", "西宁", "香港"] },
  { key: "Y", title: "Y", cities: ["阳泉", "运城", "营口", "延边", "伊春", "盐城", "扬州", "鹰潭", "宜春", "烟台", "宜昌", "岳阳", "益阳", "永州", "阳江", "云浮", "玉林", "宜宾", "雅安", "玉溪", "延安", "榆林", "玉树", "银川", "伊犁"] },
  { key: "Z", title: "Z", cities: ["张家口", "镇江", "舟山", "漳州", "淄博", "枣庄", "郑州", "周口", "驻马店", "株洲", "张家界", "珠海", "湛江", "肇庆", "中山", "自贡", "资阳", "遵义", "昭通", "张掖", "中卫"] },
];

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

export default function CrawlerTaskPage() {
  const [tasks, setTasks] = useState<CrawlerTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logText, setLogText] = useState("");
  const [logTitle, setLogTitle] = useState("");

  const [startModalOpen, setStartModalOpen] = useState(false);
  const [form] = Form.useForm();
  const selectedCityNames: string[] = Form.useWatch("city_names", form) || [];
  const [cityKeyword, setCityKeyword] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const selectedSet = new Set(selectedCityNames);
  const allSelected =
    cityOptions.length > 0 && cityOptions.every((opt) => selectedSet.has(opt.label));
  const hasAnySelected = cityOptions.some((opt) => selectedSet.has(opt.label));

  const statusConfig = {
    pending: { color: "#64748B", icon: <ClockCircleOutlined />, text: "待处理" },
    running: { color: "#22d3ee", icon: <PlayCircleOutlined />, text: "运行中" },
    success: { color: "#10b981", icon: <CheckCircleOutlined />, text: "成功" },
    failed: { color: "#ef4444", icon: <CloseCircleOutlined />, text: "失败" },
    canceled: { color: "#f59e0b", icon: <PauseCircleOutlined />, text: "已取消" },
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitTaskFinished = async (taskId: string, timeoutMs = 1000 * 60 * 30) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await api.get(`/crawl-tasks/${taskId}`);
      const status = res.data?.status as string | undefined;
      if (status && status !== "running" && status !== "pending") {
        return status;
      }
      await sleep(2000);
    }
    return "timeout";
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/crawl-tasks");
      setTasks(res.data || []);
    } catch (e: any) {
      message.error(getErrorMessage(e, "获取任务失败"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const normalizeName = (name: string) =>
      name
        .replace(/特别行政区/g, "")
        .replace(/自治区/g, "")
        .replace(/自治州/g, "")
        .replace(/地区/g, "")
        .replace(/盟/g, "")
        .replace(/市/g, "")
        .trim();

    const aliasToOfficial: Record<string, string[]> = {
      黔西南: ["黔西南布依族苗族"],
      黔东南: ["黔东南苗族侗族"],
      黔南: ["黔南布依族苗族"],
      克孜勒苏: ["克孜勒苏柯尔克孜"],
      海南州: ["海南藏族"],
      甘孜: ["甘孜藏族"],
      阿坝: ["阿坝藏族羌族"],
      凉山: ["凉山彝族"],
      湘西: ["湘西土家族苗族"],
      伊犁: ["伊犁哈萨克"],
      巴音郭楞: ["巴音郭楞蒙古"],
      博尔塔拉: ["博尔塔拉蒙古"],
      海西: ["海西蒙古族藏族"],
      海北: ["海北藏族"],
      黄南: ["黄南藏族"],
      临夏: ["临夏回族"],
      昌吉: ["昌吉回族"],
      恩施: ["恩施土家族苗族"],
      延边: ["延边朝鲜族"],
      德宏: ["德宏傣族景颇族"],
      怒江: ["怒江傈僳族"],
      红河: ["红河哈尼族彝族"],
      西双版纳: ["西双版纳傣族"],
      文山: ["文山壮族苗族"],
      楚雄: ["楚雄彝族"],
      大理: ["大理白族"],
    };

    const fetchCityOptions = async () => {
      try {
        const res = await fetch("https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json");
        const geoJson = await res.json();
        const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
        const rawItems: RawCityItem[] = features.map((feature: any) => {
          const props = feature?.properties || {};
          const name = String(props?.name || "");
          const adcode = String(props?.adcode || "");
          return {
            raw: name,
            norm: normalizeName(name),
            adcode,
          };
        });

        const orderedCityNames = Array.from(
          new Set(CITY_GROUPS.flatMap((group) => group.cities))
        );

        const options: CityOption[] = orderedCityNames.map((cityName) => {
          let matched =
            rawItems.find((item) => item.norm === cityName) ||
            rawItems.find((item) => item.raw.includes(cityName)) ||
            rawItems.find((item) => cityName.includes(item.norm));

          if (!matched && aliasToOfficial[cityName]) {
            matched = rawItems.find((item) =>
              aliasToOfficial[cityName].some((alias) => item.raw.includes(alias))
            );
          }

          if (!matched || !matched.adcode) {
            return { label: cityName, value: `MISSING:${cityName}` };
          }

          return { label: cityName, value: matched.adcode };
        });

        setCityOptions(options);
      } catch {
        const orderedCityNames = Array.from(
          new Set(CITY_GROUPS.flatMap((group) => group.cities))
        );
        setCityOptions(
          orderedCityNames.map((cityName) => ({
            label: cityName,
            value: `MISSING:${cityName}`,
          }))
        );
      }
    };

    fetchCityOptions();
  }, []);

  const viewLogs = async (task: CrawlerTask) => {
    try {
      const res = await api.get(`/crawl-tasks/${task.id}/log`);
      setLogTitle(`${task.name} — 日志`);
      setLogText(res.data?.log || "");
      setLogModalOpen(true);
    } catch (e: any) {
      message.error(getErrorMessage(e, "读取日志失败"));
    }
  };

  const cancelTask = async (task: CrawlerTask) => {
    try {
      await api.post(`/crawl-tasks/${task.id}/cancel`);
      message.success("任务已取消");
      fetchTasks();
    } catch (e: any) {
      message.error(getErrorMessage(e, "取消失败"));
    }
  };

  const deleteTask = async (task: CrawlerTask) => {
    try {
      await api.delete(`/crawl-tasks/${task.id}`);
      message.success("任务已删除");
      fetchTasks();
    } catch (e: any) {
      message.error(getErrorMessage(e, "删除失败"));
    }
  };

  // 统计数据
  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === "running").length,
    success: tasks.filter(t => t.status === "success").length,
    failed: tasks.filter(t => t.status === "failed").length,
  };

  const columns = [
    {
      title: "任务名称",
      dataIndex: "name",
      width: 200,
      render: (text: string) => (
        <Text style={{ color: "#e2e8f0", fontWeight: 500 }}>{text}</Text>
      ),
    },
    {
      title: "城市",
      dataIndex: "city_name",
      width: 100,
      render: (text: string) => (
        <Tag style={{ background: "rgba(34, 211, 238, 0.1)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 120,
      render: (s: CrawlerTask["status"]) => {
        const config = statusConfig[s];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: config.color }}>{config.icon}</span>
            <Text style={{ color: config.color }}>{config.text}</Text>
          </div>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 180,
      render: (text: string) => (
        <Text style={{ color: "#94a3b8" }}>{text}</Text>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      width: 180,
      render: (text: string) => (
        <Text style={{ color: "#94a3b8" }}>{text}</Text>
      ),
    },
    {
      title: "操作",
      width: 200,
      render: (_: any, task: CrawlerTask) => (
        <Space>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => viewLogs(task)}
            style={{
              background: "rgba(34, 211, 238, 0.1)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              color: "#22d3ee",
            }}
          >
            日志
          </Button>
          <Button
            size="small"
            danger
            disabled={task.status !== "running"}
            onClick={() => cancelTask(task)}
            icon={<CloseCircleOutlined />}
          >
            取消
          </Button>
          <Button
            size="small"
            danger
            onClick={() => deleteTask(task)}
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const onStartTask = async (values: any) => {
    if (!values.write_local_db && !values.write_cloud_db) {
      message.warning("至少开启一个数据库写入开关");
      return;
    }
    const selectedNames: string[] = Array.isArray(values.city_names) ? values.city_names : [];
    if (!selectedNames.length) {
      message.warning("请至少选择一个城市");
      return;
    }
    const orderedCities = cityOptions.filter((c) => selectedNames.includes(c.label));

    let successCount = 0;
    const failedCities: string[] = [];
    try {
      for (const city of orderedCities) {
        if (city.value.startsWith("MISSING:")) {
          failedCities.push(`${city.label}(缺少编码)`);
          continue;
        }
        try {
          const startRes = await api.post("/crawl-tasks/start", {
            city_code: city.value,
            city_name: city.label,
            start_page: Number(values.start_page || 1),
            end_page: Number(values.end_page || 1),
            write_local_db: Boolean(values.write_local_db),
            write_cloud_db: Boolean(values.write_cloud_db),
            use_cookie_json: Boolean(values.use_cookie_json),
            cookie_json_path: values.cookie_json_path?.trim() || null,
          });
          const taskId = startRes.data?.id as string | undefined;
          if (!taskId) {
            failedCities.push(`${city.label}(任务ID缺失)`);
            continue;
          }

          const finalStatus = await waitTaskFinished(taskId);
          if (finalStatus === "success") {
            successCount += 1;
          } else {
            failedCities.push(`${city.label}(${finalStatus || "unknown"})`);
          }

          fetchTasks();
        } catch {
          failedCities.push(city.label);
        }
      }

      if (successCount > 0 && failedCities.length === 0) {
        message.success(`已按顺序启动 ${successCount} 个城市任务`);
      } else if (successCount > 0) {
        message.warning(`成功 ${successCount} 个，失败 ${failedCities.length} 个：${failedCities.join("、")}`);
      } else {
        message.error("任务启动失败");
      }

      setStartModalOpen(false);
      form.resetFields();
      fetchTasks();
    } catch (e: any) {
      message.error(getErrorMessage(e, "启动失败"));
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <BugOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          爬虫任务管理
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          管理和监控车辆数据采集任务
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>总任务</Text>}
              value={stats.total}
              valueStyle={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>运行中</Text>}
              value={stats.running}
              valueStyle={{ color: "#22d3ee", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>成功</Text>}
              value={stats.success}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>失败</Text>}
              value={stats.failed}
              valueStyle={{ color: "#ef4444", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 任务列表 */}
      <Card
        style={cardStyle}
        title={<Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600 }}>任务列表</Text>}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTasks}
              style={{
                background: "rgba(148, 163, 184, 0.1)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                color: "#94a3b8",
              }}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => setStartModalOpen(true)}
              style={gradientButtonStyle}
            >
              启动爬虫
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={{ pageSize: 10 }}
          style={{
            background: "transparent",
          }}
        />
      </Card>

      {/* 启动爬虫弹窗 */}
      <Modal
        title={<Text style={{ color: "#f1f5f9" }}>启动爬虫</Text>}
        open={startModalOpen}
        onCancel={() => setStartModalOpen(false)}
        footer={null}
        styles={{
          header: { background: "#0f172a", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
          body: { background: "#0f172a" },
          mask: { background: "rgba(0, 0, 0, 0.7)" },
        }}
      >
        <Form
          form={form}
          onFinish={onStartTask}
          layout="vertical"
          initialValues={{
            start_page: 1,
            end_page: 1,
            write_local_db: true,
            write_cloud_db: false,
            use_cookie_json: false,
            cookie_json_path: "",
            city_names: [],
          }}
        >
          <Form.Item
            label={<Text style={{ color: "#94a3b8" }}>城市（支持多选）</Text>}
            required
          >
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              <Input
                value={cityKeyword}
                onChange={(e) => setCityKeyword(e.target.value)}
                placeholder="搜索城市（例如：北京 / 阿拉善 / 黔南）"
                allowClear
                style={{ background: "rgba(15, 23, 42, 0.6)" }}
              />
              <Checkbox
                indeterminate={hasAnySelected && !allSelected}
                checked={allSelected}
                onChange={(e) => {
                  form.setFieldValue(
                    "city_names",
                    e.target.checked ? cityOptions.map((item) => item.label) : []
                  );
                }}
                style={{ color: "#dbeafe" }}
              >
                全选
              </Checkbox>
              <Form.Item
                noStyle
                name="city_names"
                rules={[{ required: true, type: "array", min: 1, message: "请选择至少一个城市" }]}
              >
                <Checkbox.Group
                  style={{ width: "100%" }}
                  onChange={(vals) => {
                    form.setFieldValue("city_names", Array.from(new Set(vals as string[])));
                  }}
                >
                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: "auto",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: 8,
                      padding: 10,
                      background: "rgba(15, 23, 42, 0.45)",
                    }}
                  >
                    {CITY_GROUPS.map((group) => {
                      const optionsInGroup = group.cities
                        .map((name) =>
                          cityOptions.find((opt) => opt.label === name)
                        )
                        .filter((opt): opt is CityOption => Boolean(opt))
                        .filter((opt) =>
                          cityKeyword.trim()
                            ? opt.label.includes(cityKeyword.trim())
                            : true
                        );

                      if (!optionsInGroup.length) return null;
                      return (
                        <div key={group.key} style={{ marginBottom: 10 }}>
                          <Text style={{ color: "#7dd3fc", fontWeight: 600 }}>{group.title}</Text>
                          <Row gutter={[8, 8]} style={{ marginTop: 6 }}>
                            {optionsInGroup.map((city) => (
                              <Col xs={12} sm={8} md={6} key={`${group.key}-${city.label}`}>
                                <Checkbox value={city.label} style={{ color: "#cbd5e1" }}>
                                  {city.label}
                                </Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      );
                    })}
                  </div>
                </Checkbox.Group>
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item name="start_page" label={<Text style={{ color: "#94a3b8" }}>开始页</Text>}>
            <Input placeholder="1" style={{ background: "rgba(15, 23, 42, 0.6)" }} />
          </Form.Item>

          <Form.Item name="end_page" label={<Text style={{ color: "#94a3b8" }}>结束页</Text>}>
            <Input placeholder="1" style={{ background: "rgba(15, 23, 42, 0.6)" }} />
          </Form.Item>

          <Form.Item
            name="write_local_db"
            label={<Text style={{ color: "#94a3b8" }}>写入本地数据库</Text>}
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <Form.Item
            name="write_cloud_db"
            label={<Text style={{ color: "#94a3b8" }}>写入云端数据库</Text>}
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <Form.Item
            name="use_cookie_json"
            label={<Text style={{ color: "#94a3b8" }}>启用 JSON Cookie 文件</Text>}
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.use_cookie_json !== cur.use_cookie_json}>
            {({ getFieldValue }) =>
              getFieldValue("use_cookie_json") ? (
                <Form.Item
                  name="cookie_json_path"
                  label={<Text style={{ color: "#94a3b8" }}>Cookie JSON 路径（可选）</Text>}
                  tooltip="留空则使用后端默认路径 data/crawl/cookies/dongchedi_storage_state.json"
                >
                  <Input
                    placeholder="例如: data/crawl/cookies/dongchedi_storage_state.json"
                    style={{ background: "rgba(15, 23, 42, 0.6)" }}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block style={gradientButtonStyle}>
              开始爬虫
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Text style={{ color: "#f1f5f9" }}>{logTitle}</Text>}
        open={logModalOpen}
        onCancel={() => setLogModalOpen(false)}
        footer={null}
        width={700}
        styles={{
          header: { background: "#0f172a", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
          body: { background: "#0f172a" },
          mask: { background: "rgba(0, 0, 0, 0.7)" },
        }}
      >
        <pre
          style={{
            whiteSpace: "pre-wrap",
            maxHeight: 500,
            overflow: "auto",
            background: "rgba(15, 23, 42, 0.8)",
            padding: 16,
            borderRadius: 8,
            color: "#e2e8f0",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
        >
          {logText || "暂无日志"}
        </pre>
      </Modal>
    </div>
  );
}
