import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../utils/theme';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  glowColor?: string;
}

export function GlassPanel({ children, style, elevated = false, glowColor }: GlassPanelProps) {
  return (
    <View
      style={[
        styles.panel,
        elevated ? styles.panelElevated : styles.panelNormal,
        glowColor ? { borderColor: glowColor } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  panelNormal: {
    backgroundColor: '#232126',
    borderColor: '#36333D',
  },
  panelElevated: {
    backgroundColor: '#2B292F',
    borderColor: '#433E4B',
  },
});
