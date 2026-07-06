import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
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
  Modal,
  Empty,
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
  LinkOutlined,
  LeftOutlined,
  RightOutlined,
  ClearOutlined,
  ExclamationCircleOutlined,
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

const LOW_BRAND_CONFIDENCE = 0.85;
const BRAND_CLEAN_RESULT_KEY = "metadata:lastBrandCleanResult";

interface AnnotationForm {
  vehicle_title?: string;
  tags_text?: string;
  source_url?: string;
  image_url?: string;
  image_path?: string;
  params_url?: string;
  param_car_id?: string;
  info_entries?: Array<{ key?: string; value?: string }>;
  param_groups?: Array<{
    title?: string;
    items?: Array<{ key?: string; value?: string }>;
  }>;
  price_wan: number;
  brand?: string;
  brand_confidence?: number | null;
  brand_source?: string | null;
  model?: string;
  year?: number;
  mileage_km?: number;
  displacement?: number;
  gearbox?: string;
  transfer_count?: number;
  city?: string;
}

interface BrandCleanResult {
  cleaned_at: string;
  crawl_total: number;
  crawl_updated: number;
  promoted: number;
  low_confidence: number;
  missing_price: number;
  unmatched: number;
  already_in_train: number;
  train_updated: number;
  pending_after?: number;
}

function isLowBrandConfidence(brand?: string | null, confidence?: number | null) {
  const normalized = (brand || "").trim();
  return !normalized || normalized === "未知" || confidence == null || confidence < LOW_BRAND_CONFIDENCE;
}

function loadBrandCleanResult(): BrandCleanResult | null {
  try {
    const raw = window.localStorage.getItem(BRAND_CLEAN_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveBrandCleanResult(result: BrandCleanResult) {
  window.localStorage.setItem(BRAND_CLEAN_RESULT_KEY, JSON.stringify(result));
}

type InfoValue = string | number | null | undefined;

function pickInfoValue(
  info: Record<string, string | number | null> | undefined,
  keys: string[]
): string | undefined {
  if (!info) return undefined;
  for (const key of keys) {
    const value = info[key];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }
  const entry = Object.entries(info).find(([key, value]) =>
    keys.some((needle) => key.includes(needle)) &&
    value !== null &&
    value !== undefined &&
    String(value).trim()
  );
  return entry ? String(entry[1]).trim() : undefined;
}

function parseNumberValue(value: InfoValue): number | undefined {
  if (value === null || value === undefined) return undefined;
  const match = String(value).match(/[\d.]+/);
  return match ? Number(match[0]) : undefined;
}

function parseYearValue(value: InfoValue): number | undefined {
  if (value === null || value === undefined) return undefined;
  const match = String(value).match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : undefined;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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

function getSuggestedAnnotation(car: CrawlCar): Partial<AnnotationForm> {
  const info = car.info;
  return {
    price_wan: getSuggestedPrice(info),
    brand: pickInfoValue(info, ["品牌"]),
    brand_confidence: parseNumberValue(pickInfoValue(info, ["品牌置信度"])),
    brand_source: pickInfoValue(info, ["品牌来源"]),
    model: pickInfoValue(info, ["车型", "车系", "型号"]) || car.title,
    year: parseYearValue(pickInfoValue(info, ["上牌时间", "上牌", "年份", "年款"]) || car.title),
    mileage_km: parseNumberValue(pickInfoValue(info, ["表显里程", "里程"])),
    displacement: parseNumberValue(pickInfoValue(info, ["排量"])),
    gearbox: pickInfoValue(info, ["变速箱", "挡位"]),
    transfer_count: parseNumberValue(pickInfoValue(info, ["过户次数", "过户"])),
    city: pickInfoValue(info, ["车源地", "所在地", "城市"]),
  };
}

function infoToEntries(info?: Record<string, string | number | null>) {
  return Object.entries(info || {}).map(([key, value]) => ({
    key,
    value: value === null || value === undefined ? "" : String(value),
  }));
}

function normalizeInfoValue(value?: string): string | number | null {
  const text = (value || "").trim();
  if (!text) return null;
  if (/^-?\d+(?:\.\d+)?$/.test(text)) {
    return Number(text);
  }
  return text;
}

function entriesToInfo(entries?: Array<{ key?: string; value?: string }>) {
  return (entries || []).reduce<Record<string, string | number | null>>((acc, item) => {
    const key = (item.key || "").trim();
    if (!key) return acc;
    acc[key] = normalizeInfoValue(item.value);
    return acc;
  }, {});
}

function paramsToGroups(vehicleParams?: CrawlCar["vehicle_params"]) {
  return (vehicleParams?.sections || []).map((section) => ({
    title: section.title || "",
    items: (section.items || []).map((item) => ({
      key: item.name || "",
      value: item.value === null || item.value === undefined ? "" : String(item.value),
    })),
  }));
}

function groupsToVehicleParams(
  groups: AnnotationForm["param_groups"],
  currentVehicleParams?: CrawlCar["vehicle_params"]
) {
  return {
    ...(currentVehicleParams || {}),
    sections: (groups || []).map((group) => ({
      title: (group.title || "未分组").trim() || "未分组",
      items: (group.items || [])
        .map((item) => ({
          name: (item.key || "").trim(),
          value: normalizeInfoValue(item.value),
        }))
        .filter((item) => item.name),
    })).filter((group) => group.items.length > 0),
  };
}

function normalizeUrl(value?: string | null): string | undefined {
  const text = (value || "").trim();
  if (!text) return undefined;
  if (/^https?:\/\//i.test(text)) return text;
  return undefined;
}

function openLinkAddon(url?: string | null) {
  const normalized = normalizeUrl(url);
  return normalized ? (
    <a href={normalized} target="_blank" rel="noreferrer">
      打开
    </a>
  ) : null;
}

function tagsToText(tags?: string[]) {
  return (tags || []).join("\n");
}

function textToTags(text?: string) {
  return (text || "")
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const CarAnnotationPage: React.FC = () => {
  const [cars, setCars] = useState<CrawlCar[]>([]);
  const [annotatedIds, setAnnotatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 100;
  const [keyword, setKeyword] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [cleaningBrands, setCleaningBrands] = useState(false);
  const [brandCleanResult, setBrandCleanResult] = useState<BrandCleanResult | null>(() =>
    loadBrandCleanResult()
  );

  const [form] = Form.useForm<AnnotationForm>();
  const [messageApi, contextHolder] = message.useMessage();
  const keywordRef = useRef(keyword);
  const watchedSourceUrl = Form.useWatch("source_url", form);
  const watchedParamsUrl = Form.useWatch("params_url", form);
  const watchedImageUrl = Form.useWatch("image_url", form);
  const watchedImagePath = Form.useWatch("image_path", form);
  const watchedBrand = Form.useWatch("brand", form);
  const watchedBrandConfidence = Form.useWatch("brand_confidence", form);
  const watchedBrandSource = Form.useWatch("brand_source", form);

  const currentCar = cars[currentIndex] ?? null;
  const currentCarId = currentCar?.car_id ?? currentCar?.source_car_id ?? "";
  const currentAnnotated = currentCarId ? annotatedIds.has(currentCarId) : false;
  const globalIndex = total === 0 ? 0 : (page - 1) * pageSize + currentIndex + 1;
  const hasPrev = currentIndex > 0 || page > 1;
  const hasNext = currentIndex < cars.length - 1 || page * pageSize < total;
  const currentBrandLowConfidence = isLowBrandConfidence(watchedBrand, watchedBrandConfidence);

  const localImageSrc = resolveFileUrl(currentCar?.image_path);
  const remoteImageSrc = resolveFileUrl(currentCar?.image_url);
  const watchedImagePathUrl = resolveFileUrl(watchedImagePath);
  const imageSrc = imageFailed && remoteImageSrc
    ? remoteImageSrc
    : localImageSrc || remoteImageSrc;

  useEffect(() => {
    keywordRef.current = keyword;
  }, [keyword]);

  const fetchCars = useCallback(async (pageNo: number, kw?: string, targetIndex = 0) => {
    try {
      setLoading(true);
      const keywordValue = (kw ?? keywordRef.current).trim();
      const res = await api.get<PageResp<CrawlCar>>("/crawl-cars", {
        params: {
          page: pageNo,
          page_size: pageSize,
          keyword: keywordValue || undefined,
          needs_annotation: true,
        },
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
      setCurrentIndex(Math.min(Math.max(targetIndex, 0), Math.max(normalized.length - 1, 0)));
    } catch (e: unknown) {
      messageApi.error(getErrorMessage(e, "获取爬虫车辆失败"));
      setCars([]);
      setCurrentIndex(0);
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
      setAnnotatedIds(new Set(res.data));
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

  useEffect(() => {
    let canceled = false;
    const loadAnnotation = async () => {
      setImageFailed(false);
      form.resetFields();
      if (!currentCar) return;

      form.setFieldsValue({
        vehicle_title: currentCar.title,
        tags_text: tagsToText(currentCar.tags),
        source_url: currentCar.source_url,
        image_url: currentCar.image_url,
        image_path: currentCar.image_path,
        params_url: currentCar.params_url || undefined,
        param_car_id: currentCar.param_car_id || undefined,
        info_entries: infoToEntries(currentCar.info),
        param_groups: paramsToGroups(currentCar.vehicle_params),
        ...getSuggestedAnnotation(currentCar),
      });
      if (!currentCarId) return;

      try {
        const res = await api.get<AnnotationForm>(`/annotations/${currentCarId}`);
        if (!canceled) {
          form.setFieldsValue(res.data);
        }
      } catch {
        // 未标注过时保持爬虫建议值
      }
    };

    void loadAnnotation();
    return () => {
      canceled = true;
    };
  }, [currentCar, currentCarId, form]);

  const goPrev = async () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      return;
    }
    if (page > 1) {
      await fetchCars(page - 1, undefined, pageSize - 1);
    }
  };

  const goNext = async () => {
    if (currentIndex < cars.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      return;
    }
    if (page * pageSize < total) {
      await fetchCars(page + 1, undefined, 0);
    }
  };

  const submitAnnotation = async (values: AnnotationForm, moveNext = false) => {
    if (!currentCar || !currentCarId) {
      messageApi.error("缺少车源 ID，无法保存标注");
      return;
    }

    try {
      const vehicleUpdate = {
        title: values.vehicle_title || null,
        tags: textToTags(values.tags_text),
        source_url: values.source_url || null,
        image_url: values.image_url || null,
        image_path: values.image_path || null,
        params_url: values.params_url || null,
        param_car_id: values.param_car_id || null,
        info: entriesToInfo(values.info_entries),
        vehicle_params: groupsToVehicleParams(values.param_groups, currentCar.vehicle_params),
      };
      const vehicleRes = await api.put<CrawlCar>(`/crawl-cars/${currentCarId}`, vehicleUpdate);
      const updatedVehicle = {
        ...vehicleRes.data,
        car_id: vehicleRes.data.car_id || vehicleRes.data.source_car_id,
      };
      setCars((prev) =>
        prev.map((car) => {
          const carId = car.car_id ?? car.source_car_id;
          return carId === currentCarId ? updatedVehicle : car;
        })
      );

      await api.post("/annotations", {
        source_car_id: currentCarId,
        price_wan: values.price_wan,
        brand: values.brand || null,
        brand_confidence: values.brand_confidence ?? null,
        brand_source: values.brand_source || null,
        model: values.model || null,
        year: values.year ?? null,
        mileage_km: values.mileage_km ?? null,
        displacement: values.displacement ?? null,
        gearbox: values.gearbox || null,
        transfer_count: values.transfer_count ?? null,
        city: values.city || null,
      });

      setAnnotatedIds((prev) => new Set(prev).add(currentCarId));
      messageApi.success("标注已保存");
      if (moveNext && hasNext) {
        await goNext();
      }
    } catch (e: unknown) {
      messageApi.error(getErrorMessage(e, "标注失败"));
    }
  };

  const deleteAllCars = () => {
    Modal.confirm({
      title: "清空数据标注车辆",
      content: "会删除标注页全部爬虫车辆、已标注训练数据，并同步清空 MongoDB 中的爬虫原始数据和参数页数据。这个操作不可恢复。",
      okText: "确认清空",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await api.delete("/crawl-cars", { params: { include_mongo: true } });
          messageApi.success("标注数据已清空");
          setCars([]);
          setAnnotatedIds(new Set());
          setTotal(0);
          setPage(1);
          setCurrentIndex(0);
          form.resetFields();
        } catch (e: unknown) {
          messageApi.error(getErrorMessage(e, "清空失败"));
        }
      },
    });
  };

  const deleteCurrentCar = async () => {
    if (!currentCarId) return;
    try {
      await api.delete(`/crawl-cars/${currentCarId}`);
      messageApi.success("数据已删除");
      await fetchCars(page, undefined, Math.min(currentIndex, Math.max(cars.length - 2, 0)));
    } catch (e: unknown) {
      messageApi.error(getErrorMessage(e, "删除失败"));
    }
  };

  const refreshCurrentAnnotation = async () => {
    if (!currentCarId) return;
    try {
      const res = await api.get<AnnotationForm>(`/annotations/${currentCarId}`);
      form.setFieldsValue(res.data);
    } catch {
      // 当前车还没保存进训练集时无需刷新。
    }
  };

  const cleanBrands = async () => {
    try {
      setCleaningBrands(true);
      const crawlRes = await api.post("/crawl-cars/clean-brands", null, {
        params: { force: true },
      });
      const trainRes = await api.post("/train-cars/clean-brands", null, {
        params: { force: true },
      });
      const crawlData = crawlRes.data || {};
      const trainData = trainRes.data || {};
      const pendingRes = await api.get<PageResp<CrawlCar>>("/crawl-cars", {
        params: { page: 1, page_size: 1, needs_annotation: true },
      });
      const cleanResult: BrandCleanResult = {
        cleaned_at: new Date().toISOString(),
        crawl_total: Number(crawlData.total || 0),
        crawl_updated: Number(crawlData.updated || 0),
        promoted: Number(crawlData.promoted || 0),
        low_confidence: Number(crawlData.low_confidence || 0),
        missing_price: Number(crawlData.promote_reasons?.missing_price || 0),
        unmatched: Number(crawlData.unmatched || 0),
        already_in_train: Number(crawlData.promote_reasons?.already_in_train || 0),
        train_updated: Number(trainData.updated || 0),
        pending_after: Number(pendingRes.data?.total || 0),
      };
      setBrandCleanResult(cleanResult);
      saveBrandCleanResult(cleanResult);
      messageApi.success(
        `品牌清洗完成：自动入训练集 ${cleanResult.promoted} 条，当前待人工处理 ${cleanResult.pending_after || 0} 条`
      );
      await fetchCars(1, undefined, 0);
      await fetchAnnotatedIds(cars);
      await refreshCurrentAnnotation();
    } catch (e: unknown) {
      messageApi.error(getErrorMessage(e, "品牌清洗失败"));
    } finally {
      setCleaningBrands(false);
    }
  };

  const annotatedCount = cars.filter((car) => {
    const carId = car.car_id ?? car.source_car_id ?? "";
    return carId ? annotatedIds.has(carId) : false;
  }).length;

  return (
    <div className="page-shell">
      {contextHolder}

      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: "#f1f5f9", marginBottom: 8 }}>
          <DatabaseOutlined style={{ marginRight: 12, color: "#22d3ee" }} />
          车辆价格标注
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          单车工作台模式，确认特征后可直接切到下一辆
          ，高置信清洗结果会自动进入训练集
        </Text>
      </div>

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
              title={<Text style={{ color: "#94a3b8" }}>本页已标注</Text>}
              value={annotatedCount}
              prefix={<CheckCircleOutlined style={{ color: "#10b981" }} />}
              valueStyle={{ color: "#10b981", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text style={{ color: "#94a3b8" }}>当前进度</Text>}
              value={globalIndex}
              suffix={`/ ${total}`}
              prefix={<EditOutlined style={{ color: "#f59e0b" }} />}
              valueStyle={{ color: "#f59e0b", fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <Space style={{ width: "100%" }} direction="vertical">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchCars(1, undefined, 0)}
            placeholder="输入车源ID或标题搜索"
            prefix={<SearchOutlined />}
            allowClear
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              borderColor: "rgba(148, 163, 184, 0.2)",
              color: "#e2e8f0",
            }}
          />
          <Space wrap>
            <Button
              type="primary"
              onClick={() => fetchCars(1, undefined, 0)}
              style={gradientButtonStyle}
            >
              搜索
            </Button>
            <Button
              onClick={() => {
                setKeyword("");
                void fetchCars(1, "", 0);
              }}
            >
              重置
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={deleteAllCars}
              disabled={total === 0}
            >
              一键删除
            </Button>
            <Button
              icon={<ClearOutlined />}
              loading={cleaningBrands}
              onClick={cleanBrands}
              disabled={total === 0}
              style={{
                background: "rgba(34, 211, 238, 0.1)",
                border: "1px solid rgba(34, 211, 238, 0.3)",
                color: "#22d3ee",
              }}
            >
              一键清洗品牌
            </Button>
          </Space>
        </Space>
      </Card>

      {brandCleanResult && (
        <Card
          style={{
            ...cardStyle,
            marginBottom: 16,
            border: "1px solid rgba(34, 211, 238, 0.24)",
          }}
          title={
            <Space wrap>
              <ClearOutlined style={{ color: "#22d3ee" }} />
              <Text style={{ color: "#f1f5f9", fontWeight: 600 }}>上次品牌清洗结果</Text>
              <Tag color="cyan">{formatDate(brandCleanResult.cleaned_at)}</Tag>
            </Space>
          }
        >
          <Row gutter={[12, 12]}>
            <Col xs={12} md={6}>
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>清洗总数</Text>}
                value={brandCleanResult.crawl_total}
                valueStyle={{ color: "#e2e8f0", fontSize: 22 }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>自动入训练集</Text>}
                value={brandCleanResult.promoted}
                valueStyle={{ color: "#10b981", fontSize: 22 }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>当前待人工处理</Text>}
                value={brandCleanResult.pending_after ?? 0}
                valueStyle={{ color: "#f59e0b", fontSize: 22 }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>低置信复核</Text>}
                value={brandCleanResult.low_confidence}
                valueStyle={{ color: "#a78bfa", fontSize: 22 }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>字段不足</Text>}
                value={brandCleanResult.missing_price}
                valueStyle={{ color: "#f97316", fontSize: 22 }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>未匹配</Text>}
                value={brandCleanResult.unmatched}
                valueStyle={{ color: "#ef4444", fontSize: 22 }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>已有训练集</Text>}
                value={brandCleanResult.already_in_train}
                valueStyle={{ color: "#64748b", fontSize: 22 }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={<Text style={{ color: "#94a3b8" }}>训练集更新</Text>}
                value={brandCleanResult.train_updated}
                valueStyle={{ color: "#22d3ee", fontSize: 22 }}
              />
            </Col>
          </Row>
          <Text style={{ color: "#64748b", display: "block", marginTop: 10 }}>
            高置信且字段完整的数据会自动进入训练集；低置信或缺价格字段的数据继续保留在本页人工标注。
          </Text>
        </Card>
      )}

      {!currentCar ? (
        <Card style={cardStyle} loading={loading}>
          <Empty description={<Text style={{ color: "#94a3b8" }}>暂无待标注车辆</Text>} />
        </Card>
      ) : (
        <Card
          style={cardStyle}
          loading={loading}
          title={
            <Space wrap>
              <Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600 }}>
                {currentCar.title}
              </Text>
              {currentAnnotated ? (
                <Tag color="success">已标注</Tag>
              ) : (
                <Tag color="processing">待标注</Tag>
              )}
            </Space>
          }
          extra={
            <Space wrap>
              <Button icon={<LeftOutlined />} disabled={!hasPrev} onClick={goPrev}>
                上一辆
              </Button>
              <Text style={{ color: "#94a3b8" }}>
                {globalIndex} / {total}
              </Text>
              <Button icon={<RightOutlined />} disabled={!hasNext} onClick={goNext}>
                下一辆
              </Button>
            </Space>
          }
        >
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={11}>
              <Title level={5} style={{ color: "#e2e8f0", fontSize: 15 }}>车辆信息</Title>
              <Space wrap style={{ marginBottom: 12 }}>
                <Text style={{ color: "#94a3b8" }}>
                  爬取时间：{formatDate(currentCar.crawl_time)}
                </Text>
                {currentCar.source_url && (
                  <a href={currentCar.source_url} target="_blank" rel="noreferrer">
                    <LinkOutlined /> 源头网址
                  </a>
                )}
                {currentCar.params_url && (
                  <a href={currentCar.params_url} target="_blank" rel="noreferrer">
                    <LinkOutlined /> 参数页
                  </a>
                )}
              </Space>

              {imageSrc && (
                <img
                  src={imageSrc}
                  alt="car"
                  onError={() => {
                    if (
                      !imageFailed &&
                      remoteImageSrc &&
                      remoteImageSrc !== imageSrc
                    ) {
                      setImageFailed(true);
                    }
                  }}
                  style={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "contain",
                    borderRadius: 8,
                    background: "rgba(2, 6, 23, 0.55)",
                  }}
                />
              )}

              {currentCar.tags?.length ? (
                <Space wrap style={{ marginTop: 12 }}>
                  <TagsOutlined style={{ color: "#64748b" }} />
                  {currentCar.tags.map((tag) => (
                    <Tag
                      key={tag}
                      style={{
                        background: "rgba(34, 211, 238, 0.1)",
                        color: "#22d3ee",
                        border: "1px solid rgba(34, 211, 238, 0.3)",
                      }}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
              ) : null}

              {currentCar.info && (
                <>
                  <Divider style={{ borderColor: "rgba(148, 163, 184, 0.1)" }} />
                  <details
                    style={{
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      borderRadius: 8,
                      padding: 12,
                      background: "rgba(15, 23, 42, 0.28)",
                    }}
                  >
                    <summary style={{ cursor: "pointer", color: "#e2e8f0", fontWeight: 600 }}>
                      查看爬虫基础信息
                    </summary>
                    <Descriptions
                      size="small"
                      column={1}
                      bordered
                      style={{ marginTop: 12 }}
                      styles={{
                        label: { background: "rgba(15, 23, 42, 0.8)", color: "#94a3b8" },
                        content: { background: "rgba(15, 23, 42, 0.6)", color: "#e2e8f0" },
                      }}
                    >
                      {Object.entries(currentCar.info).map(([key, value]) => (
                        <Descriptions.Item key={key} label={key}>
                          {value ?? "-"}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  </details>
                </>
              )}
            </Col>

            <Col xs={24} lg={13}>
              <Form
                form={form}
                layout="vertical"
                onFinish={(values) => submitAnnotation(values, false)}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div style={{ order: 2 }}>
                <details
                  style={{
                    border: "1px solid rgba(148, 163, 184, 0.14)",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    background: "rgba(15, 23, 42, 0.28)",
                  }}
                >
                  <summary style={{ cursor: "pointer", color: "#e2e8f0", fontWeight: 600 }}>
                    车辆资料和来源链接
                  </summary>
                <Row gutter={12}>
                  <Col xs={24}>
                    <Form.Item name="vehicle_title" label={<Text style={{ color: "#94a3b8" }}>车辆标题</Text>}>
                      <Input style={{ background: "rgba(15, 23, 42, 0.6)" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="tags_text" label={<Text style={{ color: "#94a3b8" }}>标签（一行一个，也支持逗号分隔）</Text>}>
                      <Input.TextArea
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ background: "rgba(15, 23, 42, 0.6)" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="source_url" label={<Text style={{ color: "#94a3b8" }}>源头网址</Text>}>
                      <Input
                        addonAfter={openLinkAddon(watchedSourceUrl)}
                        style={{ background: "rgba(15, 23, 42, 0.6)" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="params_url" label={<Text style={{ color: "#94a3b8" }}>参数页网址</Text>}>
                      <Input
                        addonAfter={openLinkAddon(watchedParamsUrl)}
                        style={{ background: "rgba(15, 23, 42, 0.6)" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="image_url" label={<Text style={{ color: "#94a3b8" }}>原始图片 URL</Text>}>
                      <Input
                        addonAfter={openLinkAddon(watchedImageUrl)}
                        style={{ background: "rgba(15, 23, 42, 0.6)" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="image_path" label={<Text style={{ color: "#94a3b8" }}>本地图片路径</Text>}>
                      <Input
                        addonAfter={
                          watchedImagePathUrl ? (
                            <a href={watchedImagePathUrl} target="_blank" rel="noreferrer">
                              打开
                            </a>
                          ) : null
                        }
                        style={{ background: "rgba(15, 23, 42, 0.6)" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="param_car_id" label={<Text style={{ color: "#94a3b8" }}>参数 carId</Text>}>
                      <Input style={{ background: "rgba(15, 23, 42, 0.6)" }} />
                    </Form.Item>
                  </Col>
                </Row>
                </details>

                <Form.List name="info_entries">
                  {(fields, { add, remove }) => (
                    <details
                      style={{
                        border: "1px solid rgba(148, 163, 184, 0.14)",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        background: "rgba(15, 23, 42, 0.28)",
                      }}
                    >
                      <summary style={{ cursor: "pointer", color: "#e2e8f0", fontWeight: 600 }}>
                        基础字段（可增删改）
                      </summary>
                    <div style={{ marginTop: 12 }}>
                      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text style={{ color: "#94a3b8" }}>字段列表</Text>
                        <Button size="small" onClick={() => add({ key: "", value: "" })}>
                          新增字段
                        </Button>
                      </Space>
                      <Space direction="vertical" style={{ width: "100%" }} size={8}>
                        {fields.map((field) => (
                          <Row gutter={8} key={field.key} align="middle">
                            <Col xs={24} md={9}>
                              <Form.Item
                                {...field}
                                name={[field.name, "key"]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input
                                  placeholder="字段名"
                                  style={{ background: "rgba(15, 23, 42, 0.6)" }}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={20} md={13}>
                              <Form.Item
                                {...field}
                                name={[field.name, "value"]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input
                                  placeholder="字段值"
                                  style={{ background: "rgba(15, 23, 42, 0.6)" }}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={4} md={2}>
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => remove(field.name)}
                              />
                            </Col>
                          </Row>
                        ))}
                      </Space>
                    </div>
                    </details>
                  )}
                </Form.List>

                <Form.List name="param_groups">
                  {(groups, { add: addGroup, remove: removeGroup }) => (
                    <details
                      style={{
                        border: "1px solid rgba(148, 163, 184, 0.14)",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        background: "rgba(15, 23, 42, 0.28)",
                      }}
                    >
                      <summary style={{ cursor: "pointer", color: "#e2e8f0", fontWeight: 600 }}>
                        MongoDB 详细参数（可增删改）
                      </summary>
                    <div style={{ marginTop: 12 }}>
                      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text style={{ color: "#94a3b8" }}>参数分组</Text>
                        <Button size="small" onClick={() => addGroup({ title: "", items: [] })}>
                          新增分组
                        </Button>
                      </Space>
                      <Space direction="vertical" style={{ width: "100%" }} size={12}>
                        {groups.map((group) => (
                          <div
                            key={group.key}
                            style={{
                              border: "1px solid rgba(148, 163, 184, 0.16)",
                              borderRadius: 8,
                              padding: 12,
                              background: "rgba(15, 23, 42, 0.32)",
                            }}
                          >
                            <Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
                              <Col xs={20} md={21}>
                                <Form.Item
                                  {...group}
                                  name={[group.name, "title"]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Input
                                    placeholder="分组标题，例如：变速箱"
                                    style={{
                                      background: "rgba(2, 6, 23, 0.35)",
                                      color: "#7dd3fc",
                                      fontWeight: 600,
                                    }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={4} md={3}>
                                <Button
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => removeGroup(group.name)}
                                />
                              </Col>
                            </Row>

                            <Form.List name={[group.name, "items"]}>
                              {(items, { add: addItem, remove: removeItem }) => (
                                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                                  {items.map((item) => (
                                    <Row gutter={8} key={item.key} align="middle">
                                      <Col xs={24} md={10}>
                                        <Form.Item
                                          {...item}
                                          name={[item.name, "key"]}
                                          style={{ marginBottom: 0 }}
                                        >
                                          <Input
                                            placeholder="字段名"
                                            style={{ background: "rgba(15, 23, 42, 0.6)" }}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={20} md={12}>
                                        <Form.Item
                                          {...item}
                                          name={[item.name, "value"]}
                                          style={{ marginBottom: 0 }}
                                        >
                                          <Input
                                            placeholder="字段值"
                                            style={{ background: "rgba(15, 23, 42, 0.6)" }}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={4} md={2}>
                                        <Button
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={() => removeItem(item.name)}
                                        />
                                      </Col>
                                    </Row>
                                  ))}
                                  <Button size="small" onClick={() => addItem({ key: "", value: "" })}>
                                    新增参数
                                  </Button>
                                </Space>
                              )}
                            </Form.List>
                          </div>
                        ))}
                      </Space>
                    </div>
                    </details>
                  )}
                </Form.List>
                </div>

                <div style={{ order: 1 }}>
                <Divider style={{ borderColor: "rgba(148, 163, 184, 0.1)" }} />
                <Title level={5} style={{ color: "#e2e8f0", fontSize: 15 }}>训练特征</Title>
                <Form.Item name="brand_confidence" hidden>
                  <InputNumber />
                </Form.Item>
                <Form.Item name="brand_source" hidden>
                  <Input />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="brand"
                      label={
                        <Space size={8}>
                          <Text style={{ color: "#94a3b8" }}>品牌</Text>
                          <Tag color={currentBrandLowConfidence ? "warning" : "success"}>
                            {watchedBrandConfidence == null
                              ? "未评估"
                              : `置信度 ${Math.round(watchedBrandConfidence * 100)}%`}
                          </Tag>
                          {currentBrandLowConfidence && (
                            <Tag color="error" icon={<ExclamationCircleOutlined />}>
                              待复核
                            </Tag>
                          )}
                          {watchedBrandSource && (
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              {watchedBrandSource}
                            </Text>
                          )}
                        </Space>
                      }
                    >
                      <Input style={{ background: "rgba(15, 23, 42, 0.6)" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="model" label={<Text style={{ color: "#94a3b8" }}>车型 / 车系</Text>}>
                      <Input style={{ background: "rgba(15, 23, 42, 0.6)" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="year" label={<Text style={{ color: "#94a3b8" }}>年份</Text>}>
                      <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="mileage_km" label={<Text style={{ color: "#94a3b8" }}>里程（公里）</Text>}>
                      <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="displacement" label={<Text style={{ color: "#94a3b8" }}>排量</Text>}>
                      <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="gearbox" label={<Text style={{ color: "#94a3b8" }}>变速箱</Text>}>
                      <Input style={{ background: "rgba(15, 23, 42, 0.6)" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="transfer_count" label={<Text style={{ color: "#94a3b8" }}>过户次数</Text>}>
                      <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="city" label={<Text style={{ color: "#94a3b8" }}>城市 / 车源地</Text>}>
                      <Input style={{ background: "rgba(15, 23, 42, 0.6)" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="price_wan"
                      label={<Text style={{ color: "#94a3b8" }}>成交价（万元）</Text>}
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
                  </Col>
                </Row>
                </div>

                <Space wrap style={{ width: "100%", justifyContent: "space-between", order: 3 }}>
                  <Button danger icon={<DeleteOutlined />} onClick={deleteCurrentCar}>
                    删除当前车
                  </Button>
                  <Space wrap>
                    <Button htmlType="submit">保存</Button>
                    <Button
                      type="primary"
                      style={gradientButtonStyle}
                      onClick={() => {
                        form
                          .validateFields()
                          .then((values) => submitAnnotation(values, true))
                          .catch(() => undefined);
                      }}
                    >
                      保存并下一辆
                    </Button>
                  </Space>
                </Space>
              </Form>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default CarAnnotationPage;
