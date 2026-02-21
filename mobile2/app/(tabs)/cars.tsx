import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppTheme } from '@/constants/app-theme';
import { CrawlCar, getCrawlCars } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function CarsScreen() {
  const { token } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CrawlCar[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(
    async (nextPage: number, reset = false) => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const res = await getCrawlCars(token, {
          page: nextPage,
          page_size: 20,
          keyword: keyword.trim() || undefined,
        });
        setPage(res.page || nextPage);
        setTotal(res.total || 0);
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      } catch (e: any) {
        setError(e?.message || '获取车源失败');
      } finally {
        setLoading(false);
      }
    },
    [keyword, token]
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>爬虫车源</Text>
        <Text style={styles.sub}>实时查看采集结果并按关键词筛选</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="输入标题或source_car_id"
          placeholderTextColor="#64748b"
        />
        <Pressable style={styles.searchBtn} onPress={() => load(1, true)} disabled={loading}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </Pressable>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item, idx) => `${item.source_car_id || 'car'}-${idx}`}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title || '未命名车辆'}
            </Text>
            <Text style={styles.meta}>ID: {item.source_car_id || '-'}</Text>
            <Text style={styles.meta}>当前售价: {String(item.info?.['当前售价'] ?? '-')} 万</Text>
            <Text style={styles.meta}>抓取时间: {item.crawl_time || '-'}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={{ paddingVertical: 12 }}>
            {loading ? <ActivityIndicator color="#22d3ee" /> : null}
            {!loading && items.length < total ? (
              <Pressable style={styles.moreBtn} onPress={() => load(page + 1)}>
                <Text style={styles.moreText}>加载更多</Text>
              </Pressable>
            ) : null}
            {!loading && items.length >= total ? <Text style={styles.endText}>没有更多数据</Text> : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.bg,
    padding: 16,
  },
  hero: {
    backgroundColor: AppTheme.card,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
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
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: AppTheme.bgSoft,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: AppTheme.text,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchBtn: {
    backgroundColor: AppTheme.cyan,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: AppTheme.bg,
    fontWeight: '700',
  },
  card: {
    backgroundColor: AppTheme.cardStrong,
    borderColor: AppTheme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: {
    color: AppTheme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  meta: {
    color: AppTheme.textMuted,
    fontSize: 12,
  },
  moreBtn: {
    borderWidth: 1,
    borderColor: AppTheme.cyan,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  moreText: {
    color: AppTheme.cyan,
    fontWeight: '700',
  },
  endText: {
    textAlign: 'center',
    color: AppTheme.textMuted,
  },
  error: {
    color: AppTheme.red,
    marginBottom: 8,
  },
});
