import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../utils/theme';
import type { TrainClass } from '../types';

interface ClassSegmentControlProps {
  availableClasses?: TrainClass[];
  selectedClass?: TrainClass;
  onSelectClass: (cls: TrainClass | undefined) => void;
}

const DEFAULT_CLASSES: TrainClass[] = ['1A', '2A', '3A', 'SL', 'CC'];

export function ClassSegmentControl({
  availableClasses,
  selectedClass,
  onSelectClass,
}: ClassSegmentControlProps) {
  const classes = availableClasses && availableClasses.length > 0 ? availableClasses : DEFAULT_CLASSES;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>SELECT TRAVEL CLASS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Classes segment */}
        <TouchableOpacity
          style={[styles.segment, !selectedClass && styles.segmentActive]}
          onPress={() => onSelectClass(undefined)}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, !selectedClass && styles.segmentTextActive]}>
            All Classes
          </Text>
        </TouchableOpacity>

        {classes.map((cls) => {
          const isActive = selectedClass === cls;
          return (
            <TouchableOpacity
              key={cls}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => onSelectClass(isActive ? undefined : cls)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {cls}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand.roseStone,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 2,
  },
  scrollContent: {
    flexDirection: 'row',
    backgroundColor: '#1E1D21',
    borderRadius: borderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: '#34313B',
    gap: 4,
  },
  segment: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: colors.brand.primary, // Solid Coral #E45F60
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
});
