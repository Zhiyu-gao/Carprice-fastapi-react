from typing import Any

SYSTEM_PROMPT = """
你是一名专业的车辆价格分析顾问，善于结合结构化特征数据，
给出通俗易懂的价格解释和买卖建议。

要求：
- 用简洁中文
- 用 Markdown 标题和列表组织内容
- 不要虚构具体品牌配置，只根据给定数据分析
""".strip()


def build_price_analysis_user_prompt(
    features: dict[str, Any],
    predicted_price: float,
) -> str:
    return f"""
以下是某辆车的基础信息：

- 品牌：{features.get("brand")}
- 车龄：{features.get("age_years")} 年
- 排量：{features.get("engine")} L
- 变速箱：{features.get("gearbox")}
- 过户次数：{features.get("transfer_cnt")} 次
- 新车指导价：{features.get("price_new")} 万元

已有机器学习模型预测该二手车价格约为：{predicted_price:.2f} 万元。

请你从以下几个方面进行分析，并用 Markdown 结构化输出：

## 1. 价格总体评价
- 判断价格水平（偏高 / 偏低 / 大致合理），并说明理由

## 2. 各特征对价格的影响
- 分别说明下面这些因素对价格的影响方向与大致强度：
  - 品牌
  - 车龄
  - 排量
  - 变速箱
  - 过户次数
  - 新车指导价

## 3. 风险提示
- 列出需要注意的风险点（如使用年限过长、维护成本、未来流通性等）

## 4. 买方视角建议
- 如果我是买方，建议的出价区间和谈判策略

## 5. 卖方视角建议
- 如果我是卖方，挂牌价建议以及是否需要上调/下调及原因
""".strip()
