import { useEffect, useMemo, useState } from "react";

const FPS = 24;
const DURATION_SECONDS = 30;
const TOTAL_FRAMES = FPS * DURATION_SECONDS;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

type Scene = "hero" | "capability" | "insight" | "cta";

export default function TestPromoVideoPage() {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setFrame((prev) => (prev + 1 >= TOTAL_FRAMES ? 0 : prev + 1));
    }, 1000 / FPS);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const scene = useMemo<Scene>(() => {
    const second = frame / FPS;
    if (second < 6) return "hero";
    if (second < 14) return "capability";
    if (second < 22) return "insight";
    return "cta";
  }, [frame]);

  const sceneProgress = (start: number, end: number) => {
    const t = (frame - start) / (end - start);
    return easeOut(clamp(t));
  };

  const heroIn = sceneProgress(0, FPS * 1.4);
  const capabilityIn = sceneProgress(FPS * 6, FPS * 7.6);
  const insightIn = sceneProgress(FPS * 14, FPS * 15.6);
  const ctaIn = sceneProgress(FPS * 22, FPS * 23.4);
  const overallProgress = (frame / (TOTAL_FRAMES - 1)) * 100;

  const throughput = 68 + Math.round(20 * Math.sin(frame / 34));
  const riskScore = 91 + Math.round(6 * Math.sin(frame / 27));
  const modelSpeed = 42 + Math.round(16 * Math.sin(frame / 19));

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        position: "relative",
        color: "#f8fbff",
        fontFamily: "'Segoe UI', 'PingFang SC', sans-serif",
        background:
          "radial-gradient(circle at 20% 10%, #1e4f8f 0%, #0e1c35 40%, #070b16 100%)",
      }}
    >
      <style>
        {`
          @keyframes floatY {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-14px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.55; }
            50% { transform: scale(1.08); opacity: 0.9; }
            100% { transform: scale(1); opacity: 0.55; }
          }
          @keyframes shine {
            0% { transform: translateX(-130%); }
            100% { transform: translateX(130%); }
          }
        `}
      </style>

      <div
        style={{
          position: "absolute",
          top: -120,
          left: -90,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, #4cc9f0, transparent 70%)",
          animation: "pulse 4s ease-in-out infinite",
          filter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -70,
          bottom: -110,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "radial-gradient(circle, #ff9e57, transparent 72%)",
          animation: "pulse 4.8s ease-in-out infinite",
          filter: "blur(6px)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1080,
          margin: "0 auto",
          padding: "52px 24px 84px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.84 }}>
            VEHICLE INTELLIGENCE PLATFORM
          </div>
          <div style={{ fontSize: 12, opacity: 0.74 }}>
            Frame {frame}/{TOTAL_FRAMES}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.14)",
            padding: "56px 48px",
            minHeight: 520,
            background: "rgba(6, 10, 24, 0.62)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: 1,
              background: "rgba(255,255,255,0.35)",
            }}
          />

          {scene === "hero" && (
            <section
              style={{
                opacity: heroIn,
                transform: `translateY(${(1 - heroIn) * 30}px)`,
              }}
            >
              <p style={{ color: "#7fd8ff", marginBottom: 18, letterSpacing: 1 }}>
                重新定义二手车数据决策
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(36px, 7vw, 68px)",
                  lineHeight: 1.05,
                  maxWidth: 760,
                }}
              >
                从采集到预测
                <br />
                一体化智能引擎
              </h1>
              <p
                style={{
                  maxWidth: 680,
                  opacity: 0.85,
                  marginTop: 20,
                  fontSize: 18,
                  lineHeight: 1.65,
                }}
              >
                实时抓取市场数据，融合 AI 价格推断与可视化分析，
                让业务团队在分钟级完成过去数小时的评估工作。
              </p>
            </section>
          )}

          {scene === "capability" && (
            <section
              style={{
                opacity: capabilityIn,
                transform: `translateY(${(1 - capabilityIn) * 28}px)`,
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: "clamp(30px, 5vw, 56px)" }}>
                三段式能力闭环
              </h2>
              <div
                style={{
                  marginTop: 32,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 18,
                }}
              >
                {[
                  ["01", "多源抓取", "站点任务调度 + 数据清洗标准化"],
                  ["02", "AI 估值", "模型训练、推理、可信区间输出"],
                  ["03", "业务联动", "看板、论坛、权限与流程闭环"],
                ].map((card, index) => (
                  <article
                    key={card[0]}
                    style={{
                      borderRadius: 18,
                      padding: "22px 20px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      animation: "floatY 5s ease-in-out infinite",
                      animationDelay: `${index * 0.35}s`,
                    }}
                  >
                    <div style={{ color: "#7fd8ff", fontSize: 12 }}>{card[0]}</div>
                    <h3 style={{ margin: "8px 0 10px", fontSize: 24 }}>{card[1]}</h3>
                    <p style={{ margin: 0, opacity: 0.82 }}>{card[2]}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {scene === "insight" && (
            <section
              style={{
                opacity: insightIn,
                transform: `translateY(${(1 - insightIn) * 26}px)`,
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: "clamp(30px, 5vw, 54px)" }}>
                动态业务看板
              </h2>
              <p style={{ marginTop: 10, opacity: 0.78 }}>
                实时观测模型吞吐、风险评分与预测响应速度。
              </p>
              <div
                style={{
                  marginTop: 26,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 16,
                }}
              >
                {[
                  ["模型吞吐", `${throughput} req/min`, "#4cc9f0"],
                  ["置信评分", `${riskScore}%`, "#ffd166"],
                  ["平均响应", `${modelSpeed} ms`, "#80ed99"],
                ].map((kpi) => (
                  <div
                    key={kpi[0]}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 16,
                      border: `1px solid ${kpi[2]}66`,
                      padding: "16px 18px",
                      background: "rgba(6,15,32,0.74)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: "40%",
                        background:
                          "linear-gradient(95deg, transparent, rgba(255,255,255,0.22), transparent)",
                        animation: "shine 2.6s linear infinite",
                      }}
                    />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ opacity: 0.74, fontSize: 13 }}>{kpi[0]}</div>
                      <div style={{ marginTop: 6, fontSize: 32, fontWeight: 700 }}>
                        {kpi[1]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {scene === "cta" && (
            <section
              style={{
                opacity: ctaIn,
                transform: `translateY(${(1 - ctaIn) * 20}px)`,
                textAlign: "center",
                paddingTop: 40,
              }}
            >
              <p style={{ letterSpacing: 1.2, color: "#8be9ff" }}>READY TO SCALE</p>
              <h2
                style={{
                  marginTop: 10,
                  marginBottom: 16,
                  fontSize: "clamp(32px, 6vw, 66px)",
                  lineHeight: 1.05,
                }}
              >
                让每一次报价
                <br />
                都有数据底气
              </h2>
              <p style={{ maxWidth: 620, margin: "0 auto", opacity: 0.82 }}>
                Vehicle Intelligence Platform
                已支持从线索录入、估值、审核到运营复盘的全链路协作。
              </p>
              <button
                style={{
                  marginTop: 28,
                  border: "none",
                  borderRadius: 999,
                  padding: "14px 28px",
                  background: "linear-gradient(120deg,#6be8ff,#2fb4ff,#57f6c7)",
                  color: "#0e1a2a",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                立即体验 Demo
              </button>
            </section>
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 220,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 999,
              height: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${overallProgress}%`,
                borderRadius: 999,
                background: "linear-gradient(90deg,#74e8ff,#48b8ff,#8dffc8)",
              }}
            />
          </div>
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.34)",
              background: "rgba(4,10,24,0.75)",
              color: "#f5fbff",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            {isPlaying ? "暂停" : "播放"}
          </button>
          <button
            onClick={() => setFrame(0)}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.34)",
              background: "rgba(4,10,24,0.75)",
              color: "#f5fbff",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            重播
          </button>
        </div>
      </div>
    </div>
  );
}
