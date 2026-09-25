import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { colors, typography, spacing } from '@/theme/colors';

interface Props {
  title: string;
  values: number[];
  labels: string[];
  color: string;
  maxOverride?: number;
  height?: number;
}

export function LineChart({ title, values, labels, color, maxOverride, height = 120 }: Props) {
  const width = 300;
  const padding = 12;
  const max = Math.max(maxOverride ?? 0, ...values, 1);

  const points = values.map((v, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - (v / max) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {values.length === 0 ? (
        <Text style={styles.empty}>Not enough data yet.</Text>
      ) : (
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={colors.cardBorder} strokeWidth={1} />
          <Polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => {
            const [x, y] = p.split(',').map(Number);
            return <Circle key={i} cx={x} cy={y} r={3} fill={color} />;
          })}
        </Svg>
      )}
      <View style={styles.labelRow}>
        {labels.map((l, i) => (
          <Text key={i} style={styles.labelText} numberOfLines={1}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing(5) },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing(2) },
  empty: { color: colors.textMuted, ...typography.caption },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing(1) },
  labelText: { ...typography.caption, color: colors.textMuted, flex: 1, textAlign: 'center' },
});
