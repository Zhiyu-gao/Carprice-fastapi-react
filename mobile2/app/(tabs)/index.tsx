import { StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '@/constants/app-theme';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const { me } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Dashboard</Text>
        <Text style={styles.title}>车辆智能平台</Text>
        <Text style={styles.sub}>移动端已接通核心后端 API</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>当前用户</Text>
        <Text style={styles.item}>用户名：{me?.username || '-'}</Text>
        <Text style={styles.item}>邮箱：{me?.email || '-'}</Text>
        <Text style={styles.item}>角色：{me?.role || '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>已接入接口</Text>
        <Text style={styles.item}>POST /auth/login</Text>
        <Text style={styles.item}>GET /me</Text>
        <Text style={styles.item}>POST /predict</Text>
        <Text style={styles.item}>GET /crawl-cars</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.bg,
    padding: 16,
    gap: 12,
  },
  hero: {
    backgroundColor: AppTheme.card,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 3,
  },
  eyebrow: {
    color: AppTheme.cyan,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: AppTheme.text,
    fontSize: 28,
    fontWeight: '700',
  },
  sub: {
    color: AppTheme.textMuted,
  },
  card: {
    backgroundColor: AppTheme.cardStrong,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: AppTheme.cyan,
    fontWeight: '700',
    marginBottom: 4,
  },
  item: {
    color: AppTheme.text,
  },
});
