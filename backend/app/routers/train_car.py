from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.db_mongo import get_vehicle_params_collection, prepare_mongo_indexes
from app.services.train_car_service import list_train_cars as list_train_cars_svc

router = APIRouter(prefix="/train-cars", tags=["train"])

UNKNOWN_BRANDS = {"", "未知", "unknown", "none", "null", "其它", "其他"}
LOW_CONFIDENCE_THRESHOLD = 0.85

BRAND_ALIAS_RULES: list[tuple[str, list[str]]] = [
    ("大众", ["大众", "一汽-大众", "上汽大众", "上汽-大众", "volkswagen", "vw"]),
    ("特斯拉", ["特斯拉", "tesla", "model 3", "model y", "model s", "model x"]),
    ("比亚迪", ["比亚迪", "byd"]),
    ("宝马", ["宝马", "bmw"]),
    ("奔驰", ["奔驰", "梅赛德斯", "mercedes", "benz"]),
    ("奥迪", ["奥迪", "audi"]),
    ("丰田", ["丰田", "toyota", "一汽丰田", "广汽丰田"]),
    ("本田", ["本田", "honda", "广汽本田", "东风本田"]),
    ("日产", ["日产", "nissan", "东风日产"]),
    ("福特", ["福特", "ford", "长安福特"]),
    ("别克", ["别克", "buick"]),
    ("雪佛兰", ["雪佛兰", "chevrolet"]),
    ("吉利", ["吉利", "geely"]),
    ("长安", ["长安", "changan"]),
    ("长城", ["长城", "great wall"]),
    ("哈弗", ["哈弗", "haval"]),
    ("奇瑞", ["奇瑞", "chery"]),
    ("领克", ["领克", "lynk"]),
    ("蔚来", ["蔚来", "nio"]),
    ("小鹏", ["小鹏", "xpeng"]),
    ("理想", ["理想", "li auto"]),
    ("问界", ["问界", "aito"]),
    ("零跑", ["零跑", "leapmotor"]),
    ("极氪", ["极氪", "zeekr"]),
    ("五菱", ["五菱", "wuling"]),
    ("宝骏", ["宝骏"]),
    ("红旗", ["红旗"]),
    ("传祺", ["传祺", "广汽传祺"]),
    ("荣威", ["荣威", "roewe"]),
    ("名爵", ["名爵", "mg"]),
    ("马自达", ["马自达", "长安马自达", "一汽马自达", "mazda"]),
    ("沃尔沃", ["沃尔沃", "volvo"]),
    ("凯迪拉克", ["凯迪拉克", "cadillac"]),
    ("林肯", ["林肯", "lincoln"]),
    ("捷豹", ["捷豹", "jaguar"]),
    ("路虎", ["路虎", "land rover"]),
    ("保时捷", ["保时捷", "porsche"]),
    ("英菲尼迪", ["英菲尼迪", "infiniti"]),
    ("雷克萨斯", ["雷克萨斯", "lexus"]),
    ("玛莎拉蒂", ["玛莎拉蒂", "maserati"]),
    ("迈巴赫", ["迈巴赫", "maybach"]),
    ("高合", ["高合", "hiphi"]),
    ("斯巴鲁", ["斯巴鲁", "subaru"]),
    ("讴歌", ["讴歌", "acura"]),
    ("三菱", ["三菱", "mitsubishi"]),
    ("道奇", ["道奇", "dodge"]),
    ("法拉利", ["法拉利", "ferrari"]),
    ("阿尔法·罗密欧", ["阿尔法·罗密欧", "阿尔法罗密欧", "alfa romeo"]),
    ("东风风神", ["东风风神"]),
    ("北京", ["北京汽车", "北京越野"]),
    ("一汽", ["一汽"]),
    ("博速", ["博速", "brabus"]),
    ("MINI", ["mini"]),
    ("Jeep", ["jeep"]),
    ("现代", ["现代", "hyundai", "北京现代"]),
    ("起亚", ["起亚", "kia"]),
    ("标致", ["标致", "peugeot"]),
    ("雪铁龙", ["雪铁龙", "citroen"]),
    ("斯柯达", ["斯柯达", "skoda"]),
    ("捷达", ["捷达"]),
    ("smart", ["smart"]),
    ("阿维塔", ["阿维塔"]),
    ("深蓝", ["深蓝"]),
    ("哪吒", ["哪吒"]),
    ("腾势", ["腾势"]),
    ("方程豹", ["方程豹"]),
    ("仰望", ["仰望"]),
    ("岚图", ["岚图"]),
    ("智己", ["智己"]),
    ("极狐", ["极狐"]),
    ("欧拉", ["欧拉"]),
    ("坦克", ["坦克"]),
    ("魏牌", ["魏牌", "wey"]),
]

MODEL_BRAND_RULES: list[tuple[str, list[str]]] = [
    ("大众", ["速腾", "迈腾", "帕萨特", "朗逸", "宝来", "高尔夫", "途观", "途岳", "途昂", "探岳", "探歌", "凌渡", "cc"]),
    ("特斯拉", ["model3", "modely", "models", "modelx", "model 3", "model y", "model s", "model x"]),
    ("比亚迪", ["秦", "汉", "唐", "宋", "元", "海豚", "海豹", "驱逐舰", "护卫舰"]),
    ("本田", ["雅阁", "思域", "飞度", "皓影", "缤智", "奥德赛", "艾力绅", "cr-v", "crv"]),
    ("丰田", ["凯美瑞", "卡罗拉", "雷凌", "汉兰达", "荣放", "rav4", "亚洲龙", "威兰达", "赛那"]),
    ("日产", ["轩逸", "天籁", "逍客", "奇骏", "骐达", "楼兰"]),
    ("别克", ["英朗", "君威", "君越", "昂科威", "昂科旗", "gl8"]),
    ("福特", ["福克斯", "蒙迪欧", "锐界", "探险者", "翼虎"]),
    ("宝马", ["宝马1系", "宝马2系", "宝马3系", "宝马4系", "宝马5系", "宝马7系", "x1", "x3", "x5"]),
    ("奔驰", ["奔驰a级", "奔驰c级", "奔驰e级", "奔驰s级", "glc", "gle", "glb"]),
    ("奥迪", ["奥迪a3", "奥迪a4", "奥迪a4l", "奥迪a6", "奥迪a6l", "q3", "q5", "q5l", "q7"]),
    ("传祺", ["传祺m8", "传祺m6", "影豹", "影酷", "gs4", "gs8"]),
    ("捷豹", ["捷豹xfl", "捷豹xel", "捷豹fpace", "捷豹f-pace", "捷豹epace", "捷豹e-pace", "捷豹xf", "捷豹xj", "捷豹xe", "捷豹ftype", "捷豹f-type"]),
    ("路虎", ["发现运动", "揽胜运动", "揽胜极光", "发现神行", "神行者", "揽胜"]),
    ("英菲尼迪", ["英菲尼迪g系", "英菲尼迪m系", "英菲尼迪qx", "英菲尼迪q"]),
    ("雷克萨斯", ["雷克萨斯rx", "雷克萨斯es", "雷克萨斯nx", "雷克萨斯ls"]),
    ("吉利", ["远景", "经典帝豪", "帝豪", "星越", "星瑞", "豪越", "银河"]),
    ("玛莎拉蒂", ["ghibli", "levante", "总裁"]),
    ("保时捷", ["cayenne", "panamera", "macan"]),
    ("迈巴赫", ["迈巴赫s级"]),
    ("林肯", ["领航员", "冒险家"]),
    ("高合", ["高合hiphi"]),
    ("一汽", ["森雅"]),
    ("雪佛兰", ["科鲁兹", "迈锐宝", "创酷", "探界者"]),
    ("大众", ["途安", "途锐", "辉腾", "甲壳虫"]),
    ("丰田", ["皇冠陆放", "皇冠", "红杉", "埃尔法", "威驰"]),
    ("雪铁龙", ["世嘉", "天逸"]),
    ("别克", ["威朗"]),
    ("Jeep", ["大指挥官", "指南者", "大切诺基", "自由光"]),
    ("东风风神", ["奕炫"]),
    ("本田", ["型格"]),
    ("北京", ["北京bj", "北京越野", "北京x7"]),
    ("三菱", ["欧蓝德"]),
    ("道奇", ["酷威"]),
    ("奔驰", ["唯雅诺"]),
    ("福特", ["撼路者"]),
    ("现代", ["途胜", "胜达"]),
    ("起亚", ["狮跑"]),
    ("讴歌", ["讴歌ilx"]),
    ("斯巴鲁", ["outback", "傲虎", "斯巴鲁xv"]),
    ("法拉利", ["california"]),
    ("斯柯达", ["速派", "明锐", "柯迪亚克"]),
    ("阿尔法·罗密欧", ["stelvio", "斯坦维"]),
    ("长安", ["逸动"]),
    ("博速", ["博速"]),
]


def _is_unknown_brand(value: str | None) -> bool:
    return (value or "").strip().lower() in UNKNOWN_BRANDS


def _normalize_text(value: str | None) -> str:
    return (value or "").lower().replace(" ", "").replace("-", "")


def _brand_from_text(
    text: str,
    *,
    source: str,
    alias_confidence: float = 0.92,
    model_confidence: float = 0.80,
) -> tuple[str, float, str] | None:
    text_norm = _normalize_text(text)
    best_alias_match: tuple[str, float, str, int] | None = None
    for brand, aliases in BRAND_ALIAS_RULES:
        for alias in aliases:
            alias_norm = _normalize_text(alias)
            if alias_norm and alias_norm in text_norm:
                score = len(alias_norm)
                if best_alias_match is None or score > best_alias_match[3]:
                    best_alias_match = (brand, alias_confidence, f"{source}:alias", score)
    if best_alias_match:
        return best_alias_match[0], best_alias_match[1], best_alias_match[2]

    best_model_match: tuple[str, float, str, int] | None = None
    for brand, model_names in MODEL_BRAND_RULES:
        for model in model_names:
            model_norm = _normalize_text(model)
            if model_norm and model_norm in text_norm:
                score = len(model_norm)
                if best_model_match is None or score > best_model_match[3]:
                    best_model_match = (brand, model_confidence, f"{source}:model", score)
    if best_model_match:
        return best_model_match[0], best_model_match[1], best_model_match[2]
    return None


def _brand_from_vehicle_params(source_car_id: str | None) -> tuple[str, float, str] | None:
    if not source_car_id:
        return None
    try:
        prepare_mongo_indexes()
        doc = get_vehicle_params_collection().find_one({"car_id": source_car_id})
    except Exception:
        return None
    if not doc:
        return None
    raw_lines = doc.get("raw_lines") if isinstance(doc.get("raw_lines"), list) else []
    sections = doc.get("sections") if isinstance(doc.get("sections"), list) else []
    chunks = []
    chunks.extend(str(line) for line in raw_lines[:200])
    for section in sections:
        if not isinstance(section, dict):
            continue
        chunks.append(str(section.get("title") or ""))
        for item in section.get("items") or []:
            if isinstance(item, dict):
                name = str(item.get("name") or "")
                value = str(item.get("value") or "")
                if any(key in name for key in ["品牌", "厂商", "生产商"]):
                    match = _brand_from_text(
                        value,
                        source=f"params:{name}",
                        alias_confidence=0.97,
                        model_confidence=0.88,
                    )
                    if match:
                        return match
                chunks.append(name)
                chunks.append(value)
    return _brand_from_text(
        " ".join(chunks),
        source="params:raw",
        alias_confidence=0.88,
        model_confidence=0.74,
    )


def _infer_brand(
    train_car: models.TrainCar,
    crawl_car: models.CrawlCar | None,
    *,
    trust_existing_info_brand: bool = True,
) -> tuple[str, float, str] | None:
    info = crawl_car.info if crawl_car and isinstance(crawl_car.info, dict) else {}

    ordered_text = [
        ("title", crawl_car.title if crawl_car else None, 0.90, 0.82),
        ("model", train_car.model, 0.88, 0.80),
    ]
    for source, text, alias_confidence, model_confidence in ordered_text:
        match = _brand_from_text(
            text or "",
            source=source,
            alias_confidence=alias_confidence,
            model_confidence=model_confidence,
        )
        if match:
            return match

    if trust_existing_info_brand:
        for key, value in info.items():
            if any(token in str(key) for token in ["品牌", "厂商", "生产商"]):
                match = _brand_from_text(
                    str(value),
                    source=f"info:{key}",
                    alias_confidence=0.97,
                    model_confidence=0.88,
                )
                if match:
                    return match

    match = _brand_from_text(
        " ".join(str(value) for key, value in info.items() if key not in {"品牌", "品牌来源"}),
        source="info:raw",
        alias_confidence=0.84,
        model_confidence=0.74,
    )
    if match:
        return match

    params_match = _brand_from_vehicle_params(train_car.source_car_id)
    if params_match:
        return params_match

    return None


@router.get("")
def list_train_cars(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    items, total = list_train_cars_svc(db, page=page, page_size=page_size)
    items_out = [
        {
            "id": c.id,
            "source_car_id": c.source_car_id,
            "brand": c.brand,
            "brand_confidence": c.brand_confidence,
            "brand_source": c.brand_source,
            "model": c.model,
            "year": c.year,
            "displacement": c.displacement,
            "gearbox": c.gearbox,
            "transfer_count": c.transfer_count,
            "city": c.city,
            "price_wan": c.price_wan,
        }
        for c in items
    ]
    return {"items": items_out, "page": page, "page_size": page_size, "total": total}


@router.post("/clean-brands")
def clean_train_car_brands(
    force: bool = Query(False, description="是否覆盖已有非未知品牌"),
    db: Session = Depends(get_db),
):
    rows = db.query(models.TrainCar).all()
    total = len(rows)
    updated = 0
    skipped = 0
    unmatched = 0
    low_confidence = 0
    examples: list[dict[str, str | int | float | None]] = []

    for car in rows:
        if not force and not _is_unknown_brand(car.brand):
            if car.brand_confidence is None:
                car.brand_confidence = 1.0
                car.brand_source = car.brand_source or "existing"
            skipped += 1
            continue

        crawl = None
        if car.source_car_id:
            crawl = (
                db.query(models.CrawlCar)
                .filter(models.CrawlCar.source_car_id == car.source_car_id)
                .first()
            )
        match = _infer_brand(car, crawl, trust_existing_info_brand=not force)
        if not match:
            car.brand_confidence = 0.0
            car.brand_source = "unmatched"
            unmatched += 1
            continue

        brand, confidence, source = match
        old_brand = car.brand
        car.brand = brand
        car.brand_confidence = round(confidence, 2)
        car.brand_source = source
        if confidence < LOW_CONFIDENCE_THRESHOLD:
            low_confidence += 1
        updated += 1
        if len(examples) < 10:
            examples.append(
                {
                    "id": car.id,
                    "source_car_id": car.source_car_id,
                    "old_brand": old_brand,
                    "new_brand": brand,
                    "confidence": round(confidence, 2),
                    "source": source,
                    "model": car.model,
                }
            )

    db.commit()
    return {
        "ok": True,
        "total": total,
        "updated": updated,
        "skipped": skipped,
        "unmatched": unmatched,
        "low_confidence": low_confidence,
        "low_confidence_threshold": LOW_CONFIDENCE_THRESHOLD,
        "examples": examples,
    }
