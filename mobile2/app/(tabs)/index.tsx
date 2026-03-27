import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  ActionButton,
  HeroCard,
  Panel,
  Pill,
  ScreenScroll,
  SectionTitle,
  StatCard,
} from '@/components/mobile-kit';
import { AppTheme } from '@/constants/app-theme';
import { getCrawlCars, getCrawlTasks, getTrainCars } from '@/lib/api';
import { previewCrawlCars, previewCrawlTasks, previewTrainCars } from '@/lib/mock-data';
import { isPreviewMode } from '@/lib/preview';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const router = useRouter();
  const { me, token } = useAuth();
  const previewMode = isPreviewMode();
  const [trainCount, setTrainCount] = useState(previewTrainCars.length);
  const [crawlCount, setCrawlCount] = useState(previewCrawlCars.length);
  const [taskCount, setTaskCount] = useState(previewCrawlTasks.length);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!token || previewMode) return;
    (async () => {
      try {
        const [trainRes, crawlRes, taskRes] = await Promise.all([
          getTrainCars(token, { page: 1, page_size: 1 }),
          getCrawlCars(token, { page: 1, page_size: 1 }),
          getCrawlTasks(),
        ]);
        if (!mounted) return;
        setTrainCount(trainRes.total || 0);
        setCrawlCount(crawlRes.total || 0);
        setTaskCount(Array.isArray(taskRes) ? taskRes.length : 0);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || '加载首页概览失败');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [previewMode, token]);

  const quickActions = useMemo(
    () => [
      { title: '价格预测', desc: '录入关键特征，快速估值', route: '/(tabs)/predict', tone: 'orange' as const },
      { title: 'AI 助手', desc: '行情问答、RAG 检索、会话整理', route: '/(tabs)/ai', tone: 'cyan' as const },
      { title: '移动工作台', desc: '车源、训练集、论坛、消息集中处理', route: '/(tabs)/cars', tone: 'green' as const },
    ],
    []
  );

  return (
    <ScreenScroll>
      <HeroCard
        eyebrow="Mobile Rebuild"
        title="车辆智能平台"
        subtitle="网页端核心能力已重组为更适合手机操作的工作流。预测、AI、数据、社区和账户都能在一只手范围里完成。"
        right={<Pill text={previewMode ? '预览模式' : me?.role || '在线模式'} tone="blue" />}
      />

      <View style={styles.statRow}>
        <StatCard label="训练集" value={`${trainCount}`} tone="cyan" caption="可用于成交价参考" />
        <StatCard label="采集车源" value={`${crawlCount}`} tone="orange" caption="实时同步新车源" />
      </View>
      <View style={styles.statRow}>
        <StatCard label="采集任务" value={`${taskCount}`} tone="green" caption="支持任务跟踪" />
        <StatCard label="当前角色" value={me?.role || '-'} tone="blue" caption={me?.username || '未登录'} />
      </View>

      <Panel>
        <SectionTitle
          title="今日工作流"
          subtitle="把网页端分散的功能收束成手机端的高频任务入口。"
        />
        <View style={{ gap: 12 }}>
          {quickActions.map((item) => (
            <Pressable
              key={item.title}
              style={styles.actionCard}
              onPress={() => router.push(item.route as never)}>
              <View style={{ flex: 1, gap: 6 }}>
                <Pill text={item.title} tone={item.tone} />
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionDesc}>{item.desc}</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </Panel>

      <Panel>
        <SectionTitle
          title="移动端改造重点"
          subtitle="这次重构不是简单压缩网页，而是重新组织信息层级。"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pill text="首页总览" tone="cyan" />
          <Pill text="预测表单重做" tone="orange" />
          <Pill text="AI 对话 + 知识库" tone="blue" />
          <Pill text="数据中心" tone="green" />
          <Pill text="论坛 + 私信" tone="pink" />
          <Pill text="视频截图预览" tone="muted" />
        </View>
        <Text style={styles.noteText}>
          {previewMode
            ? '当前是截图预览模式，页面使用稳定 mock 数据，方便直接进入视频素材采集。'
            : '当前是在线模式，页面会优先读取真实接口；如果接口不可用，会保留清晰的错误提示。'}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      <Panel>
        <SectionTitle
          title="本轮效果"
          subtitle="移动端现在承担的是网页端的压缩工作台，而不是一个演示壳。"
          action={<ActionButton label="打开工作台" tone="secondary" onPress={() => router.push('/(tabs)/cars' as never)} />}
        />
      </Panel>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    backgroundColor: '#0b1424',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionTitle: {
    color: AppTheme.text,
    fontSize: 17,
    fontWeight: '800',
  },
  actionDesc: {
    color: AppTheme.textMuted,
    lineHeight: 18,
  },
  actionArrow: {
    color: AppTheme.cyan,
    fontSize: 24,
    fontWeight: '700',
  },
  noteText: {
    color: AppTheme.textMuted,
    lineHeight: 20,
  },
  errorText: {
    color: AppTheme.red,
  },
});
