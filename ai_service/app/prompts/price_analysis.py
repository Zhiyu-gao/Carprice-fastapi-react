# ai_service/app/prompts/price_analysis.py
from typing import Any, Dict


SYSTEM_PROMPT = """
你是一名专业的车辆价格分析顾问，善于结合结构化特征数据，
给出通俗易懂的价格解释和买卖建议。

要求：
- 用简洁的中文
- 用 Markdown 标题和列表组织内容
- 不要虚构具体小区或城市，只根据给定数据分析
"""


def build_price_analysis_user_prompt(
    features: Dict[str, Any],
    predicted_price: float,
) -> str:
    return f"""
以下是某辆车的基础信息：

- 面积：{features.get("area_sqm")} ㎡
- 卧室数：{features.get("bedrooms")} 个
- 房龄：{features.get("age_years")} 年
- 距离地铁：{features.get("distance_to_metro_km")} 公里

已有机器学习模型预测该车辆总价约为：{round(predicted_price):,} 元。

请你从以下几个方面进行分析，并用 Markdown 结构化输出：

## 1. 价格总体评价
- 判断价格水平（偏高 / 偏低 / 大致合理），并说明理由

## 2. 各特征对价格的影响
- 分别说明下面这些因素对价格的影响方向与大致强度：
  - 面积
  - 卧室数
  - 房龄
  - 距离地铁

## 3. 风险提示
- 列出需要注意的风险点（如房龄过大、通勤成本、未来流通性等）

## 4. 买方视角建议
- 如果我是买方，建议的出价区间和谈判策略

## 5. 卖方视角建议
- 如果我是卖方，挂牌价建议以及是否需要上调/下调及原因
"""
