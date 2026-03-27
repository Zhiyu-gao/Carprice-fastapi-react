import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

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
  brand: '特斯拉',
  age_years: '2',
  engine: '0',
  gearbox: '电动车单速',
  transfer_cnt: '0',
  price_new: '26.8',
};

export default function PredictScreen() {
  const { token } = useAuth();
  const [form, setForm] = useState<Form>(initial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState('');

  const priceGap = useMemo(() => {
    if (result === null) return null;
    return Number(form.price_new) - result;
  }, [form.price_new, result]);

  const setField = (k: keyof Form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const submit = async () => {
    if (!token) return;
    setError('');
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
      setResult(Number(resp.predicted_price));
    } catch (e: any) {
      setError(e?.message || '预测失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll>
      <HeroCard
        eyebrow="Pricing Engine"
        title="移动端价格预测"
        subtitle="把网页端的核心表单压缩成更适合手机录入的决策流，同时保留估值结果的解释空间。"
        right={<Pill text="ML + AI" tone="orange" />}
      />

      <Panel>
        <SectionTitle title="车辆信息" subtitle="先输入会显著影响价格的关键特征。" />
        <Field label="品牌" value={form.brand} onChangeText={(v) => setField('brand', v)} />
        <View style={styles.row}>
          <Field label="车龄(年)" value={form.age_years} onChangeText={(v) => setField('age_years', v)} compact />
          <Field label="过户次数" value={form.transfer_cnt} onChangeText={(v) => setField('transfer_cnt', v)} compact />
        </View>
        <View style={styles.row}>
          <Field label="排量(L)" value={form.engine} onChangeText={(v) => setField('engine', v)} compact />
          <Field label="变速箱" value={form.gearbox} onChangeText={(v) => setField('gearbox', v)} compact />
        </View>
        <Field label="新车指导价(万)" value={form.price_new} onChangeText={(v) => setField('price_new', v)} />

        <ActionButton label={loading ? '预测中...' : '开始估值'} onPress={submit} disabled={loading} />
        {loading ? <ActivityIndicator color={AppTheme.cyan} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Panel>

      {result !== null ? (
        <>
          <View style={styles.row}>
            <StatCard label="预测成交价" value={`${result.toFixed(2)} 万`} tone="green" />
            <StatCard
              label="相对新车"
              value={`${(priceGap || 0).toFixed(2)} 万`}
              tone="blue"
              caption={(priceGap || 0) >= 0 ? '与新车存在价差' : '高于新车指导价'}
            />
          </View>

          <Panel>
            <SectionTitle title="估值提示" subtitle="把数字结果转换成更容易判断的手机端提示。" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pill text={Number(form.age_years) <= 2 ? '低车龄' : '成熟车龄'} tone="cyan" />
              <Pill text={Number(form.transfer_cnt) === 0 ? '一手车优势' : `已过户 ${form.transfer_cnt} 次`} tone="orange" />
              <Pill text={Number(form.price_new) > result ? '二手性价比更高' : '建议复核配置'} tone="green" />
            </View>
            <Text style={styles.resultNote}>
              当前移动端把网页端的预测能力重做成“输入少量关键项，先快速出价，再继续去 AI 和工作台深挖”的链路。
            </Text>
          </Panel>
        </>
      ) : null}
    </ScreenScroll>
  );
}

function Field({
  label,
  value,
  onChangeText,
  compact,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.field, compact ? { flex: 1 } : null]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholderTextColor={AppTheme.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: AppTheme.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0a1222',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 16,
    color: AppTheme.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    color: AppTheme.red,
  },
  resultNote: {
    color: AppTheme.textMuted,
    lineHeight: 20,
  },
});
