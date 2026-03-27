import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
import { useAuth } from '@/lib/auth-context';

export default function ProfileScreen() {
  const { me, refreshMe, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const onSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <ScreenScroll>
      <HeroCard
        eyebrow="Account Center"
        title={me?.username || '我的账号'}
        subtitle="移动端把网页端个人中心压缩为更直接的资料与状态面板。"
        right={<Pill text={me?.role || '-'} tone="blue" />}
      />

      <View style={styles.row}>
        <StatCard label="用户名" value={me?.username || '-'} tone="cyan" />
        <StatCard label="角色" value={me?.role || '-'} tone="orange" />
      </View>

      <Panel>
        <SectionTitle title="资料概览" subtitle="与网页端共享同一账号体系和权限。" />
        <InfoRow label="邮箱" value={me?.email || '-'} />
        <InfoRow label="姓名" value={me?.full_name || '-'} />
        <InfoRow label="创建时间" value={me?.created_at || '-'} />
      </Panel>

      <Panel>
        <SectionTitle title="移动端定位" subtitle="不是完整复刻网页排版，而是把高频动作前置。" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pill text="查看资料" tone="blue" />
          <Pill text="退出登录" tone="muted" />
          <Pill text="工作台入口" tone="green" />
          <Pill text="AI 问答入口" tone="pink" />
        </View>
      </Panel>

      <ActionButton label="退出登录" tone="danger" onPress={onSignOut} />
    </ScreenScroll>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  infoRow: {
    gap: 4,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.16)',
  },
  infoLabel: {
    color: AppTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  infoValue: {
    color: AppTheme.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
