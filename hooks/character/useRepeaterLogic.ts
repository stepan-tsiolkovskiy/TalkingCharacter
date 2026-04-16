import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { useAudioRecorder } from '../audio/useAudioRecorder';
import { useAudioPlayer } from '../audio/useAudioPlayer';
import { useVoiceDetector } from '../voice/useVoiceDetector';
import {
  AppState,
  PermissionStatus,
  type StopRecordingFn,
  type PlayWithPitchFn,
  type StartMonitoringFn,
  type StopMonitoringMicFn,
} from '../../types/index';
import { MIN_RECORDING_DURATION_MS, PLAYBACK_TAIL_MS } from '../../constants/audio';

interface UseRepeaterLogicReturn {
  appState: AppState;
  currentDb: number;
  hasPermission: PermissionStatus;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
}

/**
 * Orchestrates the record → detect silence → play loop and owns AppState.
 *
 * Responsibilities:
 * - Coordinate useAudioRecorder, useAudioPlayer, and useVoiceDetector
 * - Drive AppState through idle → listening → playing → idle transitions
 * - Track microphone PermissionStatus and abort the loop when permission is lost
 *
 * Architecture notes:
 * - Forward refs (stopRecordingRef, playWithPitchRef, startMonitoringRef) break the
 *   circular dependency: onVoiceEnd callbacks are passed to useVoiceDetector before
 *   recorder and player are instantiated, so refs are synced on every render instead
 * - appStateRef mirrors useState so async callbacks always read the current value
 *   without needing to be recreated when state changes
 */
export function useRepeaterLogic(): UseRepeaterLogicReturn {
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [hasPermission, setHasPermission] = useState<PermissionStatus>(PermissionStatus.Undetermined);

  const appStateRef = useRef<AppState>(AppState.Idle);

  const stopRecordingRef = useRef<StopRecordingFn>(() => Promise.resolve(null));
  const playWithPitchRef = useRef<PlayWithPitchFn>(() => Promise.resolve());
  const startMonitoringRef = useRef<StartMonitoringFn>(() => Promise.resolve());
  const stopMonitoringMicRef = useRef<StopMonitoringMicFn>(() => Promise.resolve());

  const updateAppState = useCallback((next: AppState): void => {
    appStateRef.current = next;
    setAppState(next);
  }, []);

  const detector = useVoiceDetector({
    onVoiceStart: useCallback((): void => {
      if (appStateRef.current === AppState.Idle) {
        updateAppState(AppState.Listening);
      }
    }, [updateAppState]),

    onVoiceEnd: useCallback((): void => {
      if (appStateRef.current !== AppState.Listening) return;

      (async (): Promise<void> => {
        // Check whether permission was revoked during listening
        const { granted } = await Audio.getPermissionsAsync();
        if (!granted) {
          setHasPermission(PermissionStatus.Denied);
          updateAppState(AppState.Idle);
          await stopRecordingRef.current();
          return;
        }

        const duration = recorder.getRecordingDuration();
        const uri: string | null = await stopRecordingRef.current();

        // Recording too short — likely noise, discard and reset
        if (duration < MIN_RECORDING_DURATION_MS) {
          updateAppState(AppState.Idle);
          startMonitoringRef.current().catch((error: Error) => {
            console.error('[useRepeaterLogic] startMonitoring after short recording error', error);
            updateAppState(AppState.Idle);
          });
          return;
        }

        // Stop microphone before playback — otherwise the speaker output
        // bleeds into the next recording session
        await stopMonitoringMicRef.current();

        // null uri means recording failed — do not attempt playback
        if (uri !== null) {
          updateAppState(AppState.Playing);
          playWithPitchRef.current(uri, (): void => {
            updateAppState(AppState.Idle);
            // Brief delay after playback to let the speaker tail off
            setTimeout((): void => {
              startMonitoringRef.current().catch((error: Error) => {
                console.error('[useRepeaterLogic] startMonitoring after playback error', error);
                updateAppState(AppState.Idle);
              });
            }, PLAYBACK_TAIL_MS);
          }).catch((error: Error) => {
            console.error('[useRepeaterLogic] playback failed', error);
            updateAppState(AppState.Idle);
            startMonitoringRef.current().catch((startError: Error) => {
              console.error('[useRepeaterLogic] startMonitoring after playback failure error', startError);
              updateAppState(AppState.Idle);
            });
          });
        } else {
          updateAppState(AppState.Idle);
        }
      })().catch((error: Error) => {
        console.error('[useRepeaterLogic] onVoiceEnd handler error', error);
        updateAppState(AppState.Idle);
      });
    }, [updateAppState]),
  });

  const recorder = useAudioRecorder({ onMetering: detector.feed });
  const player = useAudioPlayer();

  stopRecordingRef.current = recorder.stopRecording;
  stopMonitoringMicRef.current = recorder.stopRecording;
  playWithPitchRef.current = player.playWithPitch;

  const startMonitoring = useCallback(async (): Promise<void> => {
    const status = await recorder.requestPermission();
    setHasPermission(status);
    if (status !== PermissionStatus.Granted) return;
    await recorder.startRecording();
  }, [recorder.requestPermission, recorder.startRecording]);

  startMonitoringRef.current = startMonitoring;

  const stopMonitoring = useCallback(async (): Promise<void> => {
    await recorder.stopRecording();
    updateAppState(AppState.Idle);
  }, [recorder.stopRecording, updateAppState]);

  useEffect(() => {
    return () => {
      recorder.stopRecording().catch((error: Error) => {
        console.error('[useRepeaterLogic] cleanup stopRecording error', error);
      });
    };
  }, []);

  return {
    appState,
    currentDb: recorder.currentDb,
    hasPermission,
    startMonitoring,
    stopMonitoring,
  };
}
