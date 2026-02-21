import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppTheme } from '@/constants/app-theme';
import { predict } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Form = {
  brand: string;
  age_years: string;
  engine: string;
  gearbox: string;
  transfer_cnt: string;
  price_new: string;
};

const initial: Form = {
  brand: '传祺',
  age_years: '2',
  engine: '2.0',
  gearbox: '自动',
  transfer_cnt: '1',
  price_new: '25',
};

export default function PredictScreen() {
  const { token } = useAuth();
  const [form, setForm] = useState<Form>(initial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const setField = (k: keyof Form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const submit = async () => {
    if (!token) return;
    setError('');
    setResult('');
    setLoading(true);
    try {
      const resp = await predict(
        {
          brand: form.brand.trim(),
          age_years: Number(form.age_years),
          engine: Number(form.engine),
          gearbox: form.gearbox.trim(),
          transfer_cnt: Number(form.transfer_cnt),
          price_new: Number(form.price_new),
        },
        token
      );
      setResult(`${resp.predicted_price} ${resp.price_unit}`);
    } catch (e: any) {
      setError(e?.message || '预测失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>车辆价格预测</Text>
        <Text style={styles.sub}>输入关键特征，实时获取估值</Text>
      </View>

      <Field label="品牌" value={form.brand} onChangeText={(v) => setField('brand', v)} />
      <Field label="车龄(年)" value={form.age_years} onChangeText={(v) => setField('age_years', v)} />
      <Field label="排量(L)" value={form.engine} onChangeText={(v) => setField('engine', v)} />
      <Field label="变速箱" value={form.gearbox} onChangeText={(v) => setField('gearbox', v)} />
      <Field
        label="过户次数"
        value={form.transfer_cnt}
        onChangeText={(v) => setField('transfer_cnt', v)}
      />
      <Field
        label="新车指导价(万)"
        value={form.price_new}
        onChangeText={(v) => setField('price_new', v)}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>预测结果</Text>
          <Text style={styles.result}>{result}</Text>
        </View>
      )}

      <Pressable onPress={submit} style={styles.btn} disabled={loading}>
        {loading ? <ActivityIndicator color="#0b1220" /> : <Text style={styles.btnText}>开始预测</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.bg,
  },
  content: {
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
  label: {
    color: AppTheme.textMuted,
    fontSize: 13,
  },
  input: {
    backgroundColor: AppTheme.bgSoft,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: AppTheme.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  btn: {
    marginTop: 8,
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
  resultCard: {
    backgroundColor: '#062625',
    borderWidth: 1,
    borderColor: '#0d4f45',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  resultLabel: {
    color: '#7eead4',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  result: {
    color: AppTheme.emerald,
    fontWeight: '700',
    fontSize: 20,
  },
});
