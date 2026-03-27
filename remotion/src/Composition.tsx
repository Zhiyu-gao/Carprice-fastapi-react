import {
  AbsoluteFill,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  Audio,
} from "remotion";

const TOTAL_FRAMES = 4200;
const FPS = 30;

const palette = {
  bg0: "#020617",
  bg1: "#040d1f",
  bg2: "#0a1628",
  neonBlue: "#38bdf8",
  neonCyan: "#22d3ee",
  neonMint: "#34d399",
  neonGold: "#fbbf24",
  neonAmber: "#f59e0b",
  neonPurple: "#a78bfa",
  neonPink: "#f472b6",
  neonRose: "#fb7185",
  textMain: "#f0f9ff",
  textSub: "#94a3b8",
  textMuted: "#475569",
  glass: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.08)",
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const sectionOpacity = (frame: number, start: number, end: number): number =>
  interpolate(frame, [start, start + 25, end - 25, end], [0, 1, 1, 0], clamp);

// ─── Ambient Background Effects ───────────────────────────────────────────────

const NoiseTexture: React.FC = () => (
  <svg
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03, mixBlendMode: "overlay" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

const GlowOrb: React.FC<{
  frame: number; x: number; y: number; size: number;
  color: string; speed?: number; opacity?: number;
}> = ({ frame, x, y, size, color, speed = 1, opacity = 0.35 }) => {
  const offsetY = Math.sin((frame / 35) * speed) * 40;
  const offsetX = Math.cos((frame / 45) * speed) * 25;
  const scale = 1 + Math.sin((frame / 55) * speed) * 0.12;

  return (
    <div style={{
      position: "absolute", left: x + offsetX, top: y + offsetY,
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 40% 35%, ${color}cc 0%, ${color}44 30%, transparent 70%)`,
      filter: "blur(60px)", opacity, transform: `scale(${scale})`,
    }} />
  );
};

const Particle: React.FC<{ frame: number; index: number; color: string }> = ({ frame, index, color }) => {
  const seed = index * 137.508;
  const baseX = (seed * 9.1) % 1920;
  const baseY = (seed * 17.3) % 1080;
  const speed = 0.3 + (seed % 100) / 150;
  const size = 1.5 + (seed % 3);
  const drift = Math.sin(frame / 60 + seed) * 8;

  const y = (baseY - frame * speed) % 1080;
  const opacity = interpolate(y < 0 ? y + 1080 : y, [0, 150, 930, 1080], [0, 0.9, 0.9, 0], clamp);

  return (
    <div style={{
      position: "absolute", left: baseX + drift,
      top: y < 0 ? y + 1080 : y,
      width: size, height: size, borderRadius: "50%",
      background: color, opacity,
      boxShadow: `0 0 ${size * 3}px ${color}`,
    }} />
  );
};

const ParticleField: React.FC<{ frame: number; count?: number }> = ({ frame, count = 70 }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    {Array.from({ length: count }).map((_, i) => (
      <Particle key={i} frame={frame} index={i}
        color={i % 4 === 0 ? palette.neonBlue : i % 4 === 1 ? palette.neonMint : i % 4 === 2 ? palette.neonGold : palette.neonPurple}
      />
    ))}
  </div>
);

const GridLines: React.FC<{ frame: number; opacity?: number }> = ({ frame, opacity = 0.04 }) => {
  const shift = (frame * 0.3) % 80;
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `
        linear-gradient(rgba(56,189,248,${opacity}) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56,189,248,${opacity}) 1px, transparent 1px)
      `,
      backgroundSize: "80px 80px",
      backgroundPosition: `${shift}px ${shift}px`,
    }} />
  );
};

const ScanLine: React.FC<{ frame: number }> = ({ frame }) => {
  const y = ((frame * 3) % 1200) - 100;
  return (
    <div style={{
      position: "absolute", left: 0, top: y, width: "100%", height: 2,
      background: `linear-gradient(90deg, transparent, ${palette.neonCyan}30, ${palette.neonBlue}50, ${palette.neonCyan}30, transparent)`,
      filter: "blur(1px)",
      pointerEvents: "none",
    }} />
  );
};

// ─── Text Components ───────────────────────────────────────────────────────────

const TypewriterText: React.FC<{
  text: string; frame: number; startFrame: number;
  charFrames?: number; style?: React.CSSProperties;
}> = ({ text, frame, startFrame, charFrames = 2, style }) => {
  const localFrame = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(localFrame / charFrames));
  const showCursor = chars < text.length;
  const cursorOpacity = interpolate(frame % 24, [0, 12, 24], [1, 0, 1], clamp);

  return (
    <span style={style}>
      {text.slice(0, chars)}
      {showCursor && <span style={{ opacity: cursorOpacity, color: palette.neonCyan }}>▋</span>}
    </span>
  );
};

const AnimatedNumber: React.FC<{
  value: number; frame: number; startFrame: number;
  suffix?: string; prefix?: string;
}> = ({ value, frame, startFrame, suffix = "", prefix = "" }) => {
  const localFrame = Math.max(0, frame - startFrame);
  const progress = spring({ fps: FPS, frame: localFrame, config: { damping: 80, stiffness: 180 } });
  return <span>{prefix}{Math.round(value * progress).toLocaleString()}{suffix}</span>;
};

// ─── Card Components ───────────────────────────────────────────────────────────

const GlassCard: React.FC<{
  title: string; desc: string; icon: string;
  index: number; frame: number; color: string;
}> = ({ title, desc, icon, index, frame, color }) => {
  const s = spring({ fps: FPS, frame: frame - index * 8, config: { damping: 140, stiffness: 110 } });
  const glowAmt = interpolate(Math.sin((frame + index * 20) / 20), [-1, 1], [0.12, 0.32]);
  const glowHex = Math.round(glowAmt * 255).toString(16).padStart(2, "0");

  return (
    <div style={{
      flex: 1, minHeight: 220, borderRadius: 24,
      border: `1px solid ${color}35`,
      background: `linear-gradient(145deg, ${color}12, ${color}04, transparent)`,
      padding: "32px 28px",
      boxShadow: `0 0 60px ${color}${glowHex}, inset 0 1px 0 ${color}20`,
      opacity: s,
      transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px) rotateX(${interpolate(s, [0, 1], [8, 0])}deg)`,
      backdropFilter: "blur(20px)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -40, right: -40, width: 120, height: 120,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}20, transparent 70%)`,
        filter: "blur(20px)",
      }} />
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 12, color, letterSpacing: -0.5 }}>{title}</div>
      <div style={{ fontSize: 18, color: palette.textSub, lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string; value: number; suffix: string;
  color: string; index: number; frame: number;
}> = ({ label, value, suffix, color, index, frame }) => {
  const s = spring({ fps: FPS, frame: frame - index * 10, config: { damping: 130, stiffness: 100 } });
  const pulse = interpolate(Math.sin((frame + index * 40) / 22), [-1, 1], [0.25, 0.55]);
  const pulseHex = Math.round(pulse * 255).toString(16).padStart(2, "0");

  return (
    <div style={{
      flex: 1, borderRadius: 28,
      border: `1px solid ${color}45`,
      background: `linear-gradient(180deg, ${color}12, ${color}04, transparent)`,
      padding: "44px 36px", textAlign: "center",
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px)`,
      boxShadow: `0 0 80px ${color}${pulseHex}, inset 0 1px 0 ${color}25`,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)",
        width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}15, transparent 70%)`,
        filter: "blur(30px)",
      }} />
      <div style={{
        fontSize: 13, letterSpacing: 3, textTransform: "uppercase",
        color: palette.textMuted, marginBottom: 20, fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontSize: 80, fontWeight: 900, color, lineHeight: 1,
        textShadow: `0 0 40px ${color}80`,
        letterSpacing: -3,
      }}>
        <AnimatedNumber value={value} frame={frame} startFrame={index * 10} suffix={suffix} />
      </div>
    </div>
  );
};

// ─── Architecture ──────────────────────────────────────────────────────────────

const ArchitectureNode: React.FC<{
  label: string; sub: string; x: number; y: number;
  frame: number; startFrame: number; color: string; icon?: string; width?: number;
}> = ({ label, sub, x, y, frame, startFrame, color, icon, width = 280 }) => {
  const localFrame = Math.max(0, frame - startFrame);
  const s = spring({ fps: FPS, frame: localFrame, config: { damping: 110, stiffness: 90 } });
  const breathe = 1 + Math.sin(frame / 20 + startFrame) * 0.015;

  return (
    <div style={{
      position: "absolute", left: x, top: y, width, minHeight: 140,
      borderRadius: 20, padding: "24px",
      background: `linear-gradient(145deg, ${color}18, ${color}06)`,
      border: `1px solid ${color}55`,
      boxShadow: `0 0 40px ${color}28, inset 0 1px 0 ${color}30`,
      opacity: s, transform: `scale(${s * breathe})`,
    }}>
      {icon && <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>}
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color, letterSpacing: -0.3 }}>{label}</div>
      <div style={{ fontSize: 13, color: palette.textSub, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
};

const FlowLine: React.FC<{
  frame: number; x1: number; y1: number; x2: number; y2: number;
  color: string; delay?: number;
}> = ({ frame, x1, y1, x2, y2, color, delay = 0 }) => {
  const progress = spring({ fps: FPS, frame: Math.max(0, frame - delay), config: { damping: 90, stiffness: 70 } });
  const cx = x1 + (x2 - x1) * progress;
  const cy = y1 + (y2 - y1) * progress;

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs>
        <linearGradient id={`g${color.replace("#", "")}${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="50%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <line x1={x1} y1={y1} x2={cx} y2={cy}
        stroke={color} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round"
        strokeDasharray="4 4"
      />
      {progress > 0.05 && (
        <circle cx={cx} cy={cy} r="5" fill={color} opacity="0.9">
          <animate attributeName="r" values="3;7;3" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
};

// ─── Feature Grid ──────────────────────────────────────────────────────────────

const FeatureGrid: React.FC<{ frame: number }> = ({ frame }) => {
  const features = [
    { title: "用户认证", desc: "JWT + 角色权限", icon: "🔐", color: palette.neonBlue },
    { title: "爬虫采集", desc: "Playwright 懂车帝", icon: "🕷️", color: palette.neonPink },
    { title: "数据标注", desc: "训练集管理", icon: "🏷️", color: palette.neonMint },
    { title: "价格预测", desc: "ML 模型推理", icon: "📊", color: palette.neonGold },
    { title: "AI 聊天", desc: "多模型切换", icon: "🤖", color: palette.neonPurple },
    { title: "RAG 检索", desc: "文档向量搜索", icon: "📚", color: palette.neonCyan },
    { title: "管理后台", desc: "用户/系统监控", icon: "⚙️", color: palette.neonAmber },
    { title: "论坛私信", desc: "社区协作", icon: "💬", color: palette.neonRose },
    { title: "移动端", desc: "React Native", icon: "📱", color: palette.neonBlue },
  ];

  const cardWidth = 280;
  const gap = 24;
  const totalWidth = 3 * cardWidth + 2 * gap;

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      width: "100%",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: gap,
        width: totalWidth,
      }}>
        {features.map((f, i) => {
          const s = spring({ fps: FPS, frame: frame - i * 5, config: { damping: 150, stiffness: 120 } });
          const floatY = Math.sin((frame + i * 18) / 28) * 5;
          const glowAmt = interpolate(Math.sin((frame + i * 25) / 22), [-1, 1], [0.08, 0.25]);
          const glowHex = Math.round(glowAmt * 255).toString(16).padStart(2, "0");

          return (
            <div key={f.title} style={{
              borderRadius: 20,
              border: `1px solid ${f.color}30`,
              background: `linear-gradient(145deg, ${f.color}10, ${f.color}03)`,
              padding: "24px 22px",
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [35, 0]) + floatY}px)`,
              boxShadow: `0 0 40px ${f.color}${glowHex}`,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -20, right: -20, width: 80, height: 80,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${f.color}20, transparent 70%)`,
                filter: "blur(15px)",
              }} />
              <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: f.color }}>{f.title}</div>
              <div style={{ fontSize: 14, color: palette.textSub }}>{f.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Page Preview (Dramatically Enhanced) ────────────────────────────────────

const PagePreviewCard: React.FC<{
  page: { title: string; desc: string; screenshot: string; tag: string; color: string; device?: "browser" | "mobile" };
  frame: number;
  pageStartFrame: number;
  framesPerPage: number;
  totalPages: number;
  pageIndex: number;
}> = ({ page, frame, pageStartFrame, framesPerPage, totalPages, pageIndex }) => {
  const localFrame = frame - pageStartFrame;
  const isVisible = localFrame >= 0 && localFrame < framesPerPage;
  if (!isVisible) return null;

  const mobileView = page.device === "mobile";
  const enterProgress = spring({ fps: FPS, frame: localFrame, config: { damping: 120, stiffness: 100 } });
  const exitProgress = localFrame > framesPerPage - 20
    ? spring({ fps: FPS, frame: localFrame - (framesPerPage - 20), config: { damping: 120, stiffness: 150 } })
    : 0;

  const opacity = interpolate(localFrame, [0, 15], [0, 1], clamp) * (1 - exitProgress * 0.8);
  const translateY = interpolate(enterProgress, [0, 1], [30, 0]) + exitProgress * -20;
  const scale = interpolate(enterProgress, [0, 1], [0.97, 1]) - exitProgress * 0.02;

  return (
    <div style={{
      position: "absolute", inset: 0,
      opacity, transform: `translateY(${translateY}px) scale(${scale})`,
      display: "flex", flexDirection: "row", gap: 40,
      alignItems: "center", justifyContent: "flex-start",
      padding: "0 50px",
    }}>
      <div style={{
        width: 300, flexShrink: 0,
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 100,
          background: `${page.color}18`,
          border: `1px solid ${page.color}45`,
          width: "fit-content",
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: page.color, boxShadow: `0 0 6px ${page.color}`,
          }} />
          <span style={{ fontSize: 11, color: page.color, letterSpacing: 2, fontWeight: 700 }}>
            {page.tag}
          </span>
        </div>

        <div style={{
          fontSize: 42, fontWeight: 900, letterSpacing: -1, lineHeight: 1.15,
          background: `linear-gradient(135deg, ${palette.textMain}, ${page.color})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {page.title}
        </div>

        <div style={{ fontSize: 16, color: palette.textSub, lineHeight: 1.65 }}>
          {page.desc}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: palette.textMuted, marginBottom: 8, letterSpacing: 1,
          }}>
            <span>PAGE PREVIEW</span>
            <span style={{ color: page.color }}>{pageIndex + 1} / {totalPages}</span>
          </div>
          <div style={{
            height: 2, borderRadius: 2,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${((pageIndex + 1) / totalPages) * 100}%`,
              background: `linear-gradient(90deg, ${page.color}, ${palette.neonCyan})`,
              boxShadow: `0 0 8px ${page.color}`,
            }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", display: "flex", justifyContent: "center" }}>
        <div style={{
          position: "absolute", inset: -40,
          background: `radial-gradient(ellipse at 50% 50%, ${page.color}12, transparent 70%)`,
          filter: "blur(40px)",
        }} />

        <div style={{
          position: "relative",
          width: mobileView ? 450 : 1400,
          height: mobileView ? 900 : 780,
          borderRadius: mobileView ? 44 : 16,
          overflow: "hidden",
          border: `1px solid ${page.color}25`,
          background: mobileView ? "#030712" : undefined,
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.05),
            0 50px 100px rgba(0,0,0,0.5),
            0 0 80px ${page.color}15
          `,
        }}>
          {mobileView ? (
            <>
              <div style={{
                position: "absolute",
                top: 14,
                left: "50%",
                width: 150,
                height: 28,
                transform: "translateX(-50%)",
                borderRadius: 999,
                background: "#020617",
                zIndex: 2,
                border: "1px solid rgba(255,255,255,0.06)",
              }} />
              <div style={{
                position: "absolute",
                top: 18,
                left: 32,
                right: 32,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 2,
                color: palette.textMain,
                fontSize: 12,
                fontWeight: 700,
              }}>
                <span>12:44</span>
                <span style={{ color: page.color }}>{page.tag}</span>
              </div>
            </>
          ) : (
            <div style={{
              height: 38,
              background: "linear-gradient(180deg, #1e2d40, #141f2e)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 10,
              borderBottom: `1px solid ${page.color}15`,
            }}>
              <div style={{ display: "flex", gap: 7 }}>
                {["#ff5f57", "#ffbd2e", "#28c840"].map((c, ci) => (
                  <div key={ci} style={{
                    width: 11, height: 11, borderRadius: "50%", background: c,
                    boxShadow: `0 0 5px ${c}70`,
                  }} />
                ))}
              </div>
              <div style={{
                flex: 1, height: 24, marginLeft: 12,
                borderRadius: 5,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: palette.neonMint, boxShadow: `0 0 5px ${palette.neonMint}` }} />
                <span style={{ fontSize: 11, color: palette.textMuted }}>vehicle-intelligence.ai / {page.tag.toLowerCase()}</span>
              </div>
              <div style={{ display: "flex", gap: 5, opacity: 0.35 }}>
                {[12, 12, 12].map((w, wi) => (
                  <div key={wi} style={{ width: w, height: 12, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ position: "relative", height: mobileView ? 900 : 742, overflow: "hidden" }}>
            <Img
              src={staticFile(page.screenshot)}
              style={{
                width: "100%", height: "100%",
                objectFit: mobileView ? "contain" : "contain",
                objectPosition: "top",
                background: "#050b16",
              }}
            />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "30%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)",
              pointerEvents: "none",
            }} />
          </div>
        </div>

        {[
          { top: -6, left: -6, borderTop: `2px solid ${page.color}`, borderLeft: `2px solid ${page.color}` },
          { top: -6, right: -6, borderTop: `2px solid ${page.color}`, borderRight: `2px solid ${page.color}` },
          { bottom: -6, left: -6, borderBottom: `2px solid ${page.color}`, borderLeft: `2px solid ${page.color}` },
          { bottom: -6, right: -6, borderBottom: `2px solid ${page.color}`, borderRight: `2px solid ${page.color}` },
        ].map((style, i) => (
          <div key={i} style={{ position: "absolute", width: 20, height: 20, ...style }} />
        ))}
      </div>
    </div>
  );
};

// ─── Scenes ────────────────────────────────────────────────────────────────────

const SceneIntro: React.FC<{ frame: number }> = ({ frame }) => {
  const titleScale = spring({ fps: FPS, frame, config: { damping: 90, stiffness: 70 } });
  const titleSlide = interpolate(titleScale, [0, 1], [60, 0]);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      height: "100%", textAlign: "center",
      width: "100%",
      position: "relative",
    }}>
      {/* Eyebrow */}
      <div style={{
        fontSize: 14, letterSpacing: 6, color: palette.neonCyan,
        marginBottom: 28,
        opacity: interpolate(frame, [10, 40], [0, 1], clamp),
        textTransform: "uppercase", fontWeight: 600,
      }}>
        Intelligent Automotive Platform
      </div>

      {/* Main Title */}
      <div style={{
        fontSize: 80, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1,
        marginBottom: 28,
        background: `linear-gradient(135deg, ${palette.neonBlue} 0%, ${palette.neonCyan} 35%, ${palette.neonMint} 65%, ${palette.neonGold} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        transform: `scale(${titleScale}) translateY(${titleSlide}px)`,
        filter: "drop-shadow(0 0 80px rgba(56,189,248,0.3))",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}>
        Vehicle Intelligence
      </div>

      {/* Chinese subtitle */}
      <div style={{
        fontSize: 52, fontWeight: 700, letterSpacing: 4,
        color: palette.textMain, marginBottom: 36,
        opacity: interpolate(frame, [25, 55], [0, 1], clamp),
        textShadow: `0 0 40px ${palette.neonBlue}40`,
      }}>
        车辆智能平台
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 22, color: palette.textSub,
        opacity: interpolate(frame, [55, 85], [0, 1], clamp),
        letterSpacing: 1,
      }}>
        <TypewriterText text="从数据采集到智能决策的全链路引擎" frame={frame} startFrame={90} charFrames={3} />
      </div>

      {/* Decorative line */}
      <div style={{
        marginTop: 60, display: "flex", gap: 16, alignItems: "center",
        opacity: interpolate(frame, [100, 130], [0, 1], clamp),
      }}>
        {[palette.neonBlue, palette.neonMint, palette.neonGold].map((c, i) => (
          <div key={i} style={{
            width: i === 1 ? 60 : 24, height: 2, borderRadius: 2,
            background: c, boxShadow: `0 0 10px ${c}`,
          }} />
        ))}
      </div>
    </div>
  );
};

const SceneProblem: React.FC<{ frame: number }> = ({ frame }) => {
  const problems = [
    { text: "二手车数据分散，采集效率低", icon: "📡" },
    { text: "价格评估依赖人工，标准不统一", icon: "⚖️" },
    { text: "缺乏智能化工具支撑决策", icon: "🧠" },
    { text: "多系统割裂，协作成本高", icon: "🔗" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "0 120px" }}>
      <div style={{ fontSize: 14, letterSpacing: 5, color: palette.neonRose, marginBottom: 20, opacity: interpolate(frame, [0, 20], [0, 1], clamp), textTransform: "uppercase", fontWeight: 700 }}>
        The Challenge
      </div>
      <div style={{ fontSize: 76, fontWeight: 900, marginBottom: 56, letterSpacing: -2, opacity: interpolate(frame, [20, 50], [0, 1], clamp), background: `linear-gradient(135deg, ${palette.textMain}, ${palette.neonPink})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        行业痛点
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {problems.map((p, i) => {
          const s = spring({ fps: FPS, frame: frame - 60 - i * 12, config: { damping: 130, stiffness: 90 } });
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 24,
              opacity: s, transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
              padding: "20px 28px", borderRadius: 16,
              background: `rgba(244,114,182,${0.04 + i * 0.01})`,
              border: "1px solid rgba(244,114,182,0.12)",
            }}>
              <div style={{ fontSize: 32 }}>{p.icon}</div>
              <div style={{ fontSize: 30, color: palette.textSub, fontWeight: 500 }}>{p.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SceneSolution: React.FC<{ frame: number }> = ({ frame }) => {
  const solutions = [
    { title: "智能采集", desc: "Playwright 自动化爬虫，懂车帝数据实时入库", icon: "🚀", color: palette.neonBlue },
    { title: "标注训练", desc: "标注数据自动进入训练集，模型持续迭代", icon: "🎯", color: palette.neonMint },
    { title: "智能预测", desc: "机器学习模型输出价格区间，辅助决策", icon: "📈", color: palette.neonGold },
    { title: "AI 增强", desc: "多模型聊天 + RAG 检索 + MCP 工具调用", icon: "🤖", color: palette.neonPurple },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "0 80px" }}>
      <div style={{ fontSize: 14, letterSpacing: 5, color: palette.neonMint, marginBottom: 16, opacity: interpolate(frame, [0, 20], [0, 1], clamp), textTransform: "uppercase", fontWeight: 700 }}>
        Our Solution
      </div>
      <div style={{ fontSize: 72, fontWeight: 900, marginBottom: 52, letterSpacing: -2, opacity: interpolate(frame, [20, 50], [0, 1], clamp), background: `linear-gradient(135deg, ${palette.textMain}, ${palette.neonMint})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        全链路解决方案
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        {solutions.map((s, i) => (
          <GlassCard key={s.title} {...s} index={i} frame={frame - 60} />
        ))}
      </div>
    </div>
  );
};

const SceneArchitecture: React.FC<{ frame: number }> = ({ frame }) => {
  const layers = [
    {
      title: "Presentation Layer",
      nodes: [
        { label: "Frontend", sub: "React + Vite + Ant Design", icon: "🌐", color: palette.neonBlue },
        { label: "Mobile", sub: "Expo + React Native", icon: "📱", color: palette.neonGold },
      ],
    },
    {
      title: "Service Layer",
      nodes: [
        { label: "Backend API", sub: "FastAPI + SQLAlchemy", icon: "⚙️", color: palette.neonMint },
        { label: "AI Service", sub: "Kimi/Qwen/DeepSeek + RAG + MCP", icon: "🤖", color: palette.neonPurple },
        { label: "Crawler", sub: "Playwright 懂车帝爬虫", icon: "🕷️", color: palette.neonPink },
      ],
    },
    {
      title: "Data Layer",
      nodes: [
        { label: "MySQL", sub: "主数据库", icon: "🗄️", color: palette.neonCyan },
        { label: "SQLite", sub: "本地缓存", icon: "📁", color: palette.neonCyan },
        { label: "Qdrant", sub: "向量数据库", icon: "🔍", color: palette.neonCyan },
      ],
    },
  ];

  const nodeWidth = 300;
  const nodeHeight = 140;
  const layerGap = 195;
  const startY = 170;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "55px 80px" }}>
      <div style={{ fontSize: 14, letterSpacing: 5, color: palette.neonBlue, marginBottom: 12, opacity: interpolate(frame, [0, 20], [0, 1], clamp), textTransform: "uppercase", fontWeight: 700 }}>
        System Architecture
      </div>
      <div style={{ fontSize: 56, fontWeight: 900, marginBottom: 50, letterSpacing: -1.5, opacity: interpolate(frame, [20, 50], [0, 1], clamp), background: `linear-gradient(135deg, ${palette.textMain}, ${palette.neonBlue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        三服务架构
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        {layers.map((layer, layerIndex) => {
          const y = startY + layerIndex * layerGap;
          return (
            <div key={layer.title} style={{
              position: "absolute", left: 0, top: y + 50,
              fontSize: 12, color: palette.textMuted, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600,
              opacity: interpolate(frame, [30 + layerIndex * 20, 50 + layerIndex * 20], [0, 1], clamp),
            }}>
              {layer.title}
            </div>
          );
        })}

        {layers.map((layer, layerIndex) => {
          const y = startY + layerIndex * layerGap;
          const totalWidth = layer.nodes.length * nodeWidth + (layer.nodes.length - 1) * 44;
          const startX = (1920 - 160 - totalWidth) / 2 + 80;

          return layer.nodes.map((node, nodeIndex) => {
            const x = startX + nodeIndex * (nodeWidth + 44);
            const startFrame = 60 + layerIndex * 30 + nodeIndex * 15;
            return (
              <ArchitectureNode key={node.label} label={node.label} sub={node.sub}
                x={x} y={y} frame={frame} startFrame={startFrame}
                color={node.color} icon={node.icon} width={nodeWidth}
              />
            );
          });
        })}

        {layers.slice(0, -1).map((layer, layerIndex) => {
          const currentY = startY + layerIndex * layerGap + nodeHeight;
          const nextY = startY + (layerIndex + 1) * layerGap;
          const nextLayer = layers[layerIndex + 1];
          const currentTotalWidth = layer.nodes.length * nodeWidth + (layer.nodes.length - 1) * 44;
          const nextTotalWidth = nextLayer.nodes.length * nodeWidth + (nextLayer.nodes.length - 1) * 44;
          const currentStartX = (1920 - 160 - currentTotalWidth) / 2 + 80;
          const nextStartX = (1920 - 160 - nextTotalWidth) / 2 + 80;

          return layer.nodes.map((_, ci) => {
            const cx = currentStartX + ci * (nodeWidth + 44) + nodeWidth / 2;
            return nextLayer.nodes.map((_, ni) => {
              const nx = nextStartX + ni * (nodeWidth + 44) + nodeWidth / 2;
              const delay = 130 + layerIndex * 40 + ci * 10 + ni * 5;
              return (
                <FlowLine key={`${layerIndex}-${ci}-${ni}`}
                  frame={frame} x1={cx} y1={currentY} x2={nx} y2={nextY}
                  color={palette.neonMint} delay={delay}
                />
              );
            });
          });
        })}
      </div>
    </div>
  );
};

const SceneFeatures: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "55px 80px" }}>
    <div style={{ fontSize: 14, letterSpacing: 5, color: palette.neonGold, marginBottom: 12, opacity: interpolate(frame, [0, 20], [0, 1], clamp), textTransform: "uppercase", fontWeight: 700 }}>
      Feature Landscape
    </div>
    <div style={{ fontSize: 56, fontWeight: 900, marginBottom: 36, letterSpacing: -1.5, opacity: interpolate(frame, [20, 50], [0, 1], clamp), background: `linear-gradient(135deg, ${palette.textMain}, ${palette.neonGold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      功能矩阵
    </div>
    <FeatureGrid frame={frame - 60} />
  </div>
);

const SceneMetrics: React.FC<{ frame: number }> = ({ frame }) => {
  const metrics = [
    { label: "评估效率提升", value: 68, suffix: "%", color: palette.neonMint },
    { label: "智能回答准确率", value: 91, suffix: "%", color: palette.neonBlue },
    { label: "接口响应时间", value: 39, suffix: "ms", color: palette.neonGold },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", padding: "0 80px" }}>
      <div style={{ fontSize: 14, letterSpacing: 5, color: palette.neonCyan, marginBottom: 16, opacity: interpolate(frame, [0, 20], [0, 1], clamp), textTransform: "uppercase", fontWeight: 700 }}>
        Delivery Value
      </div>
      <div style={{ fontSize: 72, fontWeight: 900, marginBottom: 16, textAlign: "center", letterSpacing: -2, opacity: interpolate(frame, [20, 50], [0, 1], clamp), background: `linear-gradient(135deg, ${palette.textMain}, ${palette.neonCyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        可量化的工程收益
      </div>
      <div style={{ fontSize: 22, color: palette.textSub, marginBottom: 64, textAlign: "center", opacity: interpolate(frame, [50, 80], [0, 1], clamp) }}>
        自动化采集 + 智能估值 + 统一运营后台
      </div>
      <div style={{ display: "flex", gap: 36, width: "100%" }}>
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} index={i} frame={frame - 100} />
        ))}
      </div>
    </div>
  );
};

// ─── Enhanced Page Preview Scene ──────────────────────────────────────────────

const ScenePagePreview: React.FC<{ frame: number }> = ({ frame }) => {
  const pages = [
    { title: "移动首页", desc: "把网页端入口重组为手机优先的总览工作流，快速直达预测、AI 与数据工作台。", screenshot: "screenshots/mobile/home.png", tag: "HOME", color: palette.neonBlue, device: "mobile" as const },
    { title: "移动预测", desc: "压缩关键字段输入，保留机器学习估值结果与简单解释，适合碎片化决策。", screenshot: "screenshots/mobile/predict.png", tag: "ML", color: palette.neonGold, device: "mobile" as const },
    { title: "移动 AI", desc: "会话、模型切换、RAG 文档管理一起进入手机端，减少桌面依赖。", screenshot: "screenshots/mobile/ai.png", tag: "AI", color: palette.neonPurple, device: "mobile" as const },
    { title: "移动工作台", desc: "车源、训练集、采集任务、论坛与私信集中在单手可达的移动工作台。", screenshot: "screenshots/mobile/workbench.png", tag: "WORKBENCH", color: palette.neonCyan, device: "mobile" as const },
    { title: "移动账户", desc: "账户资料与角色状态收束为轻量面板，统一共享网页端账号体系。", screenshot: "screenshots/mobile/profile.png", tag: "PROFILE", color: palette.neonMint, device: "mobile" as const },
  ];

  const framesPerPage = 120;
  const totalPages = pages.length;
  const currentPage = Math.min(Math.floor(frame / framesPerPage), totalPages - 1);
  const currentColor = pages[currentPage]?.color ?? palette.neonBlue;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", position: "relative" }}>
      {/* Dynamic ambient background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 70% 50%, ${currentColor}08, transparent 60%)`,
      }} />

      {/* Header */}
      <div style={{
        padding: "40px 60px 0",
        opacity: interpolate(frame, [0, 20], [0, 1], clamp),
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 14, letterSpacing: 5, color: palette.neonPurple, marginBottom: 8, textTransform: "uppercase", fontWeight: 700 }}>
            Page Preview
          </div>
          <div style={{
            fontSize: 44, fontWeight: 900, letterSpacing: -1.5,
            background: `linear-gradient(135deg, ${palette.textMain}, ${palette.neonPurple})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            页面全景预览
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {pages.map((p, i) => (
            <div key={i} style={{
              width: i === currentPage ? 32 : 20,
              height: i === currentPage ? 20 : 14,
              borderRadius: 4,
              background: i === currentPage ? p.color : "rgba(255,255,255,0.12)",
              boxShadow: i === currentPage ? `0 0 12px ${p.color}` : "none",
              border: i < currentPage ? `1px solid ${p.color}50` : "1px solid transparent",
              opacity: i < currentPage ? 0.5 : 1,
            }} />
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {pages.map((page, i) => (
          <PagePreviewCard
            key={page.title}
            page={page}
            frame={frame}
            pageStartFrame={i * framesPerPage}
            framesPerPage={framesPerPage}
            totalPages={totalPages}
            pageIndex={i}
          />
        ))}
      </div>
    </div>
  );
};

const SceneOutro: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = spring({ fps: FPS, frame, config: { damping: 75, stiffness: 55 } });

  const nextSteps = ["实时行情流", "A/B 模型策略", "风控评分卡", "自动化运营报告"];

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", textAlign: "center", padding: "0 80px" }}>
      <div style={{ fontSize: 14, letterSpacing: 6, color: palette.neonBlue, marginBottom: 36, opacity: interpolate(frame, [0, 30], [0, 1], clamp), textTransform: "uppercase", fontWeight: 700 }}>
        Ready For Scale
      </div>
      <div style={{
        fontSize: 90, fontWeight: 900, letterSpacing: -3, lineHeight: 1,
        marginBottom: 28,
        background: `linear-gradient(135deg, ${palette.neonBlue}, ${palette.neonCyan}, ${palette.neonMint})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        transform: `scale(${scale})`,
        filter: `drop-shadow(0 0 60px ${palette.neonBlue}40)`,
      }}>
        Vehicle Intelligence
        <br />Platform
      </div>
      <div style={{ fontSize: 34, color: palette.textSub, marginBottom: 56, opacity: interpolate(frame, [40, 70], [0, 1], clamp), fontWeight: 300, letterSpacing: 2 }}>
        Data to Decision. End-to-End.
      </div>
      <div style={{
        display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center",
        opacity: interpolate(frame, [70, 100], [0, 1], clamp),
      }}>
        {nextSteps.map((s, i) => (
          <div key={i} style={{
            padding: "16px 28px", borderRadius: 100,
            border: `1px solid ${palette.neonBlue}35`,
            background: `linear-gradient(135deg, ${palette.neonBlue}12, ${palette.neonMint}08)`,
            fontSize: 20, color: palette.textMain, fontWeight: 600,
            boxShadow: `0 0 30px ${palette.neonBlue}15`,
          }}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Root Component ────────────────────────────────────────────────────────────

export const VipIntroVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const globalOpacity = interpolate(frame, [0, 20, TOTAL_FRAMES - 30, TOTAL_FRAMES - 1], [0, 1, 1, 0], clamp);
  const bgProgress = interpolate(frame, [0, TOTAL_FRAMES], [0, 1]);
  const bgColor = interpolateColors(bgProgress, [0, 0.3, 0.7, 1], [
    palette.bg0, palette.bg1, palette.bg2, palette.bg0,
  ]);

  return (
    <AbsoluteFill style={{
      fontFamily: "SF Pro Display, 'PingFang SC', 'Hiragino Sans GB', -apple-system, BlinkMacSystemFont, sans-serif",
      color: palette.textMain, opacity: globalOpacity, background: bgColor,
    }}>
      {/* Ambient orbs */}
      <GlowOrb frame={frame} x={-150} y={-120} size={700} color={palette.neonBlue} speed={0.7} opacity={0.28} />
      <GlowOrb frame={frame} x={width - 250} y={height - 250} size={600} color={palette.neonPurple} speed={0.9} opacity={0.22} />
      <GlowOrb frame={frame} x={width / 2 - 200} y={-80} size={500} color={palette.neonMint} speed={0.55} opacity={0.18} />
      <GlowOrb frame={frame} x={width * 0.8} y={height * 0.3} size={400} color={palette.neonGold} speed={1.1} opacity={0.15} />

      <ParticleField frame={frame} count={70} />
      <GridLines frame={frame} opacity={0.04} />
      <ScanLine frame={frame} />
      <NoiseTexture />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(2,6,23,0.5) 100%)",
      }} />

      <div style={{ position: "absolute", inset: 0, padding: "40px 60px", boxSizing: "border-box", overflow: "hidden" }}>
        <Sequence durationInFrames={600}>
          <div style={{ opacity: sectionOpacity(frame, 0, 600), height: "100%", width: "100%", overflow: "visible" }}>
            <SceneIntro frame={frame} />
          </div>
        </Sequence>

        <Sequence from={600} durationInFrames={480}>
          <div style={{ opacity: sectionOpacity(frame, 600, 1080), height: "100%" }}>
            <SceneProblem frame={frame - 600} />
          </div>
        </Sequence>

        <Sequence from={1080} durationInFrames={600}>
          <div style={{ opacity: sectionOpacity(frame, 1080, 1680), height: "100%" }}>
            <SceneSolution frame={frame - 1080} />
          </div>
        </Sequence>

        <Sequence from={1680} durationInFrames={600}>
          <div style={{ opacity: sectionOpacity(frame, 1680, 2280), height: "100%" }}>
            <SceneArchitecture frame={frame - 1680} />
          </div>
        </Sequence>

        <Sequence from={2280} durationInFrames={600}>
          <div style={{ opacity: sectionOpacity(frame, 2280, 2880), height: "100%" }}>
            <SceneFeatures frame={frame - 2280} />
          </div>
        </Sequence>

        <Sequence from={2880} durationInFrames={720}>
          <div style={{ opacity: sectionOpacity(frame, 2880, 3600), height: "100%" }}>
            <ScenePagePreview frame={frame - 2880} />
          </div>
        </Sequence>

        <Sequence from={3600} durationInFrames={360}>
          <div style={{ opacity: sectionOpacity(frame, 3600, 3960), height: "100%" }}>
            <SceneMetrics frame={frame - 3600} />
          </div>
        </Sequence>

        <Sequence from={3960} durationInFrames={240}>
          <div style={{ opacity: sectionOpacity(frame, 3960, 4200), height: "100%" }}>
            <SceneOutro frame={frame - 3960} />
          </div>
        </Sequence>
      </div>

      {/* Background Music */}
      <Audio src={staticFile("bgm/Evgeny Bardyuzha - Cyberpunk Sunrise.mp3")} volume={0.6} />

      {/* Border frame */}
      <div style={{
        position: "absolute", width, height,
        border: "1px solid rgba(255,255,255,0.04)",
        pointerEvents: "none", boxSizing: "border-box",
      }} />
    </AbsoluteFill>
  );
};
