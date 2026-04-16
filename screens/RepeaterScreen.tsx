import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRepeaterLogic } from '../hooks/character/useRepeaterLogic';
import { useRiveCharacter } from '../hooks/character/useRiveCharacter';
import { RiveCharacter } from '../components/RiveCharacter';
import { RiveErrorBoundary } from '../components/RiveErrorBoundary';
import { VolumeIndicator } from '../components/VolumeIndicator';
import { AppState, PermissionStatus } from '../types/index';
import { Colors, Layout, Typography } from '../constants/theme';
import { DB_RANGE_MIN, SILENCE_THRESHOLD_DB, WAVE_ANIMATION_DURATION_MS } from '../constants/audio';

const STATE_LABELS: Record<AppState, string> = {
  [AppState.Idle]:      'speak...',
  [AppState.Listening]: 'listening',
  [AppState.Playing]:   'repeating',
};

export function RepeaterScreen(): React.JSX.Element {
  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(false);

  const {
    appState,
    currentDb,
    hasPermission,
    startMonitoring,
    stopMonitoring,
  } = useRepeaterLogic();

  const { riveRef, setCharacterState, onRiveReady } = useRiveCharacter();

  const handleRiveReady = useCallback((): void => {
    onRiveReady();
    setTimeout((): void => {
      setIsIntroComplete(true);
    }, WAVE_ANIMATION_DURATION_MS);
  }, [onRiveReady]);

  useEffect(() => {
    setCharacterState(appState);
  }, [appState, setCharacterState]);

  useEffect(() => {
    return () => {
      stopMonitoring().catch((error: Error) => {
        console.error('[RepeaterScreen] stopMonitoring cleanup error', error);
      });
    };
  }, []);

  const isAboveThreshold: boolean = currentDb > SILENCE_THRESHOLD_DB;
  const barWidthPct: number = Math.min(100, Math.max(0, ((currentDb - DB_RANGE_MIN) / -DB_RANGE_MIN) * 100));

  useEffect(() => {
    if (!isIntroComplete) return;
    startMonitoring().catch((error: Error) => {
      console.error('[RepeaterScreen] startMonitoring error', error);
    });
  }, [isIntroComplete]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.characterContainer, { backgroundColor: 'transparent' }]}>
        <VolumeIndicator db={currentDb} isActive={appState !== AppState.Playing} />
        <RiveErrorBoundary>
          <RiveCharacter riveRef={riveRef} onRiveReady={handleRiveReady} />
        </RiveErrorBoundary>
      </View>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${barWidthPct}%`, backgroundColor: isAboveThreshold ? Colors.accent.primary : Colors.text.muted },
          ]}
        />
      </View>

      {hasPermission === PermissionStatus.Denied && (
        <Text style={styles.permissionError}>Microphone permission denied</Text>
      )}

      <Text style={styles.stateText}>{isIntroComplete ? STATE_LABELS[appState] : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: Colors.background.primary,
  },
  characterContainer: {
    width: Layout.character.size,
    height: Layout.character.size,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    fontSize: Typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wider,
    color: Colors.text.secondary,
  },
  barTrack: {
    width: Layout.indicator.width,
    height: Layout.indicator.height,
    borderRadius: Layout.indicator.borderRadius,
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },
  barFill: {
    height: Layout.indicator.height,
    borderRadius: Layout.indicator.borderRadius,
  },
  permissionError: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.danger,
  },
});
