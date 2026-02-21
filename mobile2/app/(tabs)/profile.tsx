import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>我的账号</Text>
        <Text style={styles.sub}>统一账号体系：与网页端共享登录身份</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.item}>用户名：{me?.username || '-'}</Text>
        <Text style={styles.item}>邮箱：{me?.email || '-'}</Text>
        <Text style={styles.item}>角色：{me?.role || '-'}</Text>
      </View>

      <Pressable onPress={onSignOut} style={styles.btn}>
        <Text style={styles.btnText}>退出登录</Text>
      </Pressable>
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
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  title: {
    color: AppTheme.text,
    fontSize: 24,
    fontWeight: '700',
  },
  sub: {
    color: AppTheme.textMuted,
  },
  card: {
    backgroundColor: AppTheme.cardStrong,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  item: {
    color: AppTheme.text,
    fontSize: 15,
  },
  btn: {
    marginTop: 8,
    backgroundColor: AppTheme.red,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  btnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
