import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppTheme } from '@/constants/app-theme';
import { register, sendEmailCode } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { token, signIn, loading, error } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [localError, setLocalError] = useState('');
  const [tip, setTip] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState<'buyer' | 'seller'>('buyer');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace('/(tabs)');
    }
  }, [router, token]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLocalError('请输入邮箱和密码');
      return;
    }
    setLocalError('');
    setTip('');
    const ok = await signIn(email.trim(), password);
    if (ok) router.replace('/(tabs)');
  };

  const onSendCode = async () => {
    if (!regEmail.trim()) {
      setLocalError('请先输入注册邮箱');
      return;
    }
    setLocalError('');
    setTip('');
    setSendingCode(true);
    try {
      await sendEmailCode(regEmail.trim());
      setTip('验证码已发送，请查收邮箱');
      setCountdown(60);
    } catch (e: any) {
      setLocalError(e?.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const onRegister = async () => {
    if (!regEmail.trim() || !regCode.trim() || !regUsername.trim() || !regPassword.trim()) {
      setLocalError('请完整填写注册信息');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setLocalError('两次密码不一致');
      return;
    }
    setLocalError('');
    setTip('');
    setRegistering(true);
    try {
      await register({
        email: regEmail.trim(),
        code: regCode.trim(),
        username: regUsername.trim(),
        role: regRole,
        full_name: regFullName.trim() || undefined,
        password: regPassword,
      });
      setTip('注册成功，请使用新账号登录');
      setMode('login');
      setEmail(regEmail.trim());
      setPassword('');
    } catch (e: any) {
      setLocalError(e?.message || '注册失败');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />
      <ScrollView contentContainerStyle={styles.scrollWrap} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Vehicle Intelligence</Text>
          <Text style={styles.title}>智能车辆分析系统</Text>
          <Text style={styles.subtitle}>与网页端共用同一后端、同一数据库</Text>

          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, mode === 'login' ? styles.modeBtnActive : null]}
              onPress={() => setMode('login')}>
              <Text style={[styles.modeText, mode === 'login' ? styles.modeTextActive : null]}>登录</Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === 'register' ? styles.modeBtnActive : null]}
              onPress={() => setMode('register')}>
              <Text style={[styles.modeText, mode === 'register' ? styles.modeTextActive : null]}>注册</Text>
            </Pressable>
          </View>

          {mode === 'login' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="邮箱"
                placeholderTextColor={AppTheme.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="密码"
                placeholderTextColor={AppTheme.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={onLogin} style={styles.btn} disabled={loading}>
                {loading ? <ActivityIndicator color={AppTheme.bg} /> : <Text style={styles.btnText}>登录</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="邮箱"
                placeholderTextColor={AppTheme.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={regEmail}
                onChangeText={setRegEmail}
              />
              <View style={styles.inlineRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="验证码"
                  placeholderTextColor={AppTheme.textMuted}
                  value={regCode}
                  onChangeText={setRegCode}
                />
                <Pressable
                  onPress={onSendCode}
                  style={[styles.codeBtn, (sendingCode || countdown > 0) ? styles.codeBtnDisabled : null]}
                  disabled={sendingCode || countdown > 0}>
                  <Text style={styles.codeBtnText}>
                    {sendingCode ? '发送中' : countdown > 0 ? `${countdown}s` : '发验证码'}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="用户名（不能是 admin）"
                placeholderTextColor={AppTheme.textMuted}
                value={regUsername}
                onChangeText={setRegUsername}
              />
              <View style={styles.inlineRow}>
                <Pressable
                  style={[styles.roleBtn, regRole === 'buyer' ? styles.roleBtnActive : null]}
                  onPress={() => setRegRole('buyer')}>
                  <Text style={[styles.roleText, regRole === 'buyer' ? styles.roleTextActive : null]}>buyer</Text>
                </Pressable>
                <Pressable
                  style={[styles.roleBtn, regRole === 'seller' ? styles.roleBtnActive : null]}
                  onPress={() => setRegRole('seller')}>
                  <Text style={[styles.roleText, regRole === 'seller' ? styles.roleTextActive : null]}>seller</Text>
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="姓名（可选）"
                placeholderTextColor={AppTheme.textMuted}
                value={regFullName}
                onChangeText={setRegFullName}
              />
              <TextInput
                style={styles.input}
                placeholder="密码"
                placeholderTextColor={AppTheme.textMuted}
                secureTextEntry
                value={regPassword}
                onChangeText={setRegPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="确认密码"
                placeholderTextColor={AppTheme.textMuted}
                secureTextEntry
                value={regConfirmPassword}
                onChangeText={setRegConfirmPassword}
              />
              <Pressable onPress={onRegister} style={styles.btn} disabled={registering}>
                {registering ? <ActivityIndicator color={AppTheme.bg} /> : <Text style={styles.btnText}>注册</Text>}
              </Pressable>
            </>
          )}

          {!!localError && <Text style={styles.error}>{localError}</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!tip && <Text style={styles.tipSuccess}>{tip}</Text>}

          <Text style={styles.tip}>API: {process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.bg,
  },
  scrollWrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  blobA: {
    width: 240,
    height: 240,
    backgroundColor: AppTheme.cyan,
    top: 80,
    right: -80,
  },
  blobB: {
    width: 260,
    height: 260,
    backgroundColor: AppTheme.blue,
    bottom: 80,
    left: -100,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: AppTheme.cardStrong,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  eyebrow: {
    color: AppTheme.cyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: AppTheme.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: AppTheme.textMuted,
    marginBottom: 2,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: AppTheme.bgSoft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppTheme.border,
    overflow: 'hidden',
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modeBtnActive: {
    backgroundColor: '#0d3040',
  },
  modeText: {
    color: AppTheme.textMuted,
    fontWeight: '700',
  },
  modeTextActive: {
    color: AppTheme.cyan,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: AppTheme.bgSoft,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: AppTheme.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  codeBtn: {
    backgroundColor: AppTheme.cyan,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  codeBtnDisabled: {
    opacity: 0.6,
  },
  codeBtnText: {
    color: AppTheme.bg,
    fontWeight: '700',
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppTheme.border,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: AppTheme.bgSoft,
  },
  roleBtnActive: {
    borderColor: AppTheme.cyan,
    backgroundColor: '#0d3040',
  },
  roleText: {
    color: AppTheme.textMuted,
    fontWeight: '700',
  },
  roleTextActive: {
    color: AppTheme.cyan,
  },
  btn: {
    marginTop: 2,
    backgroundColor: AppTheme.cyan,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  btnText: {
    color: AppTheme.bg,
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    color: AppTheme.red,
  },
  tipSuccess: {
    color: AppTheme.emerald,
  },
  tip: {
    marginTop: 2,
    color: AppTheme.textMuted,
    fontSize: 12,
  },
});
