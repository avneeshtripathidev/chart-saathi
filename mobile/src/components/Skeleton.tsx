import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, borderRadius } from '../utils/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadiusValue?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadiusValue = borderRadius.sm, style }: SkeletonProps) {
  const animValue = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [animValue]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius: borderRadiusValue, opacity: animValue },
        style,
      ]}
    />
  );
}

export function CoachCardSkeleton() {
  return (
    <View style={styles.coachCard}>
      <Skeleton width={40} height={20} />
      <Skeleton width={60} height={14} style={{ marginTop: 6 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SearchResultSkeleton() {
  return (
    <View style={styles.searchResult}>
      <Skeleton width="60%" height={18} />
      <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#1E293B',
  },
  coachCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    margin: 6,
    width: 140,
  },
  searchResult: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
  },
});
