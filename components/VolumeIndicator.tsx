import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import {
  DB_RANGE_MIN,
  VOLUME_SCALE_BASE,
  VOLUME_SCALE_DELTA,
  VOLUME_SPRING_BOUNCINESS,
  VOLUME_SPRING_SPEED,
} from '../constants/audio';
import { Colors, Layout } from '../constants/theme';

interface Props {
  db: number;
  isActive: boolean;
}

function normalizeDb(db: number): number {
  const clamped: number = Math.min(0, Math.max(DB_RANGE_MIN, db));
  return VOLUME_SCALE_BASE + ((clamped - DB_RANGE_MIN) / (-DB_RANGE_MIN)) * VOLUME_SCALE_DELTA;
}

export function VolumeIndicator({ db, isActive }: Props): React.JSX.Element | null {
  if (!isActive) return null;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: normalizeDb(db),
      speed: VOLUME_SPRING_SPEED,
      bounciness: VOLUME_SPRING_BOUNCINESS,
      useNativeDriver: true,
    }).start();
  }, [db]);

  return (
    <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]} />
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: Layout.character.size,
    height: Layout.character.size,
    borderRadius: Layout.character.borderRadius,
    backgroundColor: Colors.character.pulse,
    opacity: 0.3,
  },
});
