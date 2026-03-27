import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { AppTheme } from '@/constants/app-theme';

export function ScreenScroll({
  children,
  contentContainerStyle,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      {children}
    </ScrollView>
  );
}

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroGlow} />
      <View style={{ flex: 1, gap: 6 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={{ marginLeft: 12 }}>{right}</View> : null}
    </View>
  );
}

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function StatCard({
  label,
  value,
  tone = 'cyan',
  caption,
  style,
}: {
  label: string;
  value: string;
  tone?: 'cyan' | 'orange' | 'green' | 'blue' | 'pink';
  caption?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.statCard, toneMap[tone], style]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {caption ? <Text style={styles.statCaption}>{caption}</Text> : null}
    </View>
  );
}

export function Pill({
  text,
  tone = 'cyan',
  style,
  textStyle,
}: {
  text: string;
  tone?: 'cyan' | 'orange' | 'green' | 'blue' | 'pink' | 'muted';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[styles.pill, pillToneMap[tone], style]}>
      <Text style={[styles.pillText, textStyle]}>{text}</Text>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmentedWrap}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentedItem, active ? styles.segmentedItemActive : null]}>
            <Text style={[styles.segmentedText, active ? styles.segmentedTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  tone = 'primary',
  disabled,
}: {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        tone === 'secondary' ? styles.buttonSecondary : null,
        tone === 'danger' ? styles.buttonDanger : null,
        disabled ? styles.buttonDisabled : null,
      ]}>
      <Text
        style={[
          styles.buttonText,
          tone === 'secondary' ? styles.buttonSecondaryText : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <Panel style={{ alignItems: 'center', paddingVertical: 28 }}>
      <Text style={{ color: AppTheme.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      {desc ? <Text style={styles.sectionSubtitle}>{desc}</Text> : null}
    </Panel>
  );
}

const toneMap = StyleSheet.create({
  cyan: { borderColor: 'rgba(34, 211, 238, 0.28)' },
  orange: { borderColor: 'rgba(249, 115, 22, 0.28)' },
  green: { borderColor: 'rgba(52, 211, 153, 0.28)' },
  blue: { borderColor: 'rgba(96, 165, 250, 0.28)' },
  pink: { borderColor: 'rgba(244, 114, 182, 0.28)' },
});

const pillToneMap = StyleSheet.create({
  cyan: { backgroundColor: 'rgba(34, 211, 238, 0.12)', borderColor: 'rgba(34, 211, 238, 0.26)' },
  orange: { backgroundColor: 'rgba(249, 115, 22, 0.12)', borderColor: 'rgba(249, 115, 22, 0.26)' },
  green: { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.26)' },
  blue: { backgroundColor: 'rgba(96, 165, 250, 0.12)', borderColor: 'rgba(96, 165, 250, 0.26)' },
  pink: { backgroundColor: 'rgba(244, 114, 182, 0.12)', borderColor: 'rgba(244, 114, 182, 0.26)' },
  muted: { backgroundColor: 'rgba(148, 163, 184, 0.12)', borderColor: 'rgba(148, 163, 184, 0.2)' },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppTheme.bg,
  },
  screenContent: {
    padding: 16,
    gap: 16,
  },
  glowA: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 211, 238, 0.07)',
  },
  glowB: {
    position: 'absolute',
    top: 160,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.18)',
    backgroundColor: '#0a1120',
    padding: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroGlow: {
    position: 'absolute',
    right: -20,
    top: -24,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
  },
  eyebrow: {
    color: AppTheme.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: AppTheme.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroSubtitle: {
    color: AppTheme.textMuted,
    lineHeight: 20,
  },
  panel: {
    borderRadius: 22,
    backgroundColor: AppTheme.cardStrong,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    padding: 16,
    gap: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: AppTheme.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: AppTheme.textMuted,
    lineHeight: 18,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#0d1628',
    padding: 14,
    gap: 8,
  },
  statLabel: {
    color: AppTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: AppTheme.text,
    fontSize: 24,
    fontWeight: '900',
  },
  statCaption: {
    color: AppTheme.textMuted,
    fontSize: 12,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    color: AppTheme.text,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedWrap: {
    flexDirection: 'row',
    backgroundColor: '#0a1222',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    padding: 4,
    gap: 4,
  },
  segmentedItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentedItemActive: {
    backgroundColor: 'rgba(34, 211, 238, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.24)',
  },
  segmentedText: {
    color: AppTheme.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  segmentedTextActive: {
    color: AppTheme.text,
  },
  button: {
    borderRadius: 14,
    backgroundColor: AppTheme.cyan,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.24)',
  },
  buttonDanger: {
    backgroundColor: '#7f1d1d',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: AppTheme.bg,
    fontWeight: '800',
  },
  buttonSecondaryText: {
    color: AppTheme.cyan,
  },
});
