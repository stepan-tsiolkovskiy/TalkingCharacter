import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { DB_SILENCE, METERING_INTERVAL_MS, MICROPHONE_WARMUP_MS } from '../../constants/audio';
import { PermissionStatus } from '../../types/index';

interface UseAudioRecorderProps {
  onMetering?: (db: number) => void;
}

interface UseAudioRecorderReturn {
  requestPermission: () => Promise<PermissionStatus>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  isRecording: boolean;
  /** Reactive dB value for UI display. Updates every 100 ms while recording. */
  currentDb: number;
  /** Non-reactive getter for polling inside other hooks (e.g. VAD) without triggering re-renders. */
  getMetering: () => number;
  /** Returns elapsed recording duration in ms, or 0 if not recording. */
  getRecordingDuration: () => number;
}

/**
 * Records microphone input and streams dB metering via expo-av.
 *
 * Responsibilities:
 * - Request and report microphone permission
 * - Start/stop recording with HIGH_QUALITY preset and metering enabled
 * - Emit dB values to onMetering callback and expose a polling getter
 *
 * Architecture notes:
 * - meteringRef mirrors currentDb state so callers can poll the latest value
 *   inside memoised callbacks without triggering re-renders
 * - onMeteringRef is updated on every render to keep the callback fresh without
 *   adding it as a dep of startRecording (which would re-create the recording session)
 */
export function useAudioRecorder({ onMetering }: UseAudioRecorderProps = {}): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentDb, setCurrentDb] = useState<number>(DB_SILENCE);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meteringRef = useRef<number>(DB_SILENCE);
  const recordingStartTimeRef = useRef<number | null>(null);
  const isWarmingUpRef = useRef<boolean>(false);
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMeteringRef = useRef<((db: number) => void) | undefined>(onMetering);
  onMeteringRef.current = onMetering;

  useEffect(() => {
    return () => {
      if (warmupTimerRef.current !== null) {
        clearTimeout(warmupTimerRef.current);
      }
      if (recordingRef.current !== null) {
        recordingRef.current.stopAndUnloadAsync().catch((err: unknown) => {
          console.warn('[useAudioRecorder] cleanup stopAndUnload error:', err);
        });
      }
    };
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.warn('[useAudioRecorder] microphone permission not granted');
        return;
      }

      // Route audio through speaker and enable recording session on iOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();

      const options: Audio.RecordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      };

      await recording.prepareToRecordAsync(options);

      recording.setOnRecordingStatusUpdate((status: Audio.RecordingStatus) => {
        if (status.metering !== undefined) {
          if (isWarmingUpRef.current) return;
          meteringRef.current = status.metering;
          setCurrentDb(status.metering);
          onMeteringRef.current?.(status.metering);
        }
      });
      // Poll every METERING_INTERVAL_MS for smooth VAD response
      recording.setProgressUpdateInterval(METERING_INTERVAL_MS);

      await recording.startAsync();
      recordingStartTimeRef.current = Date.now();
      recordingRef.current = recording;
      setIsRecording(true);
      isWarmingUpRef.current = true;
      warmupTimerRef.current = setTimeout(() => {
        isWarmingUpRef.current = false;
      }, MICROPHONE_WARMUP_MS);
    } catch (err: unknown) {
      console.warn('[useAudioRecorder] startRecording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (recordingRef.current === null) {
      return null;
    }
    try {
      recordingStartTimeRef.current = null;
      await recordingRef.current.stopAndUnloadAsync();
      const uri: string | null = recordingRef.current.getURI();
      recordingRef.current = null;
      meteringRef.current = DB_SILENCE;
      setCurrentDb(DB_SILENCE);
      setIsRecording(false);
      return uri;
    } catch (err: unknown) {
      console.warn('[useAudioRecorder] stopRecording error:', err);
      recordingRef.current = null;
      recordingStartTimeRef.current = null;
      setCurrentDb(DB_SILENCE);
      setIsRecording(false);
      return null;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      return granted ? PermissionStatus.Granted : PermissionStatus.Denied;
    } catch (err: unknown) {
      console.warn('[useAudioRecorder] requestPermission error:', err);
      return PermissionStatus.Denied;
    }
  }, []);

  const getMetering = useCallback((): number => {
    return meteringRef.current;
  }, []);

  const getRecordingDuration = useCallback((): number => {
    return recordingStartTimeRef.current !== null
      ? Date.now() - recordingStartTimeRef.current
      : 0;
  }, []);

  return { requestPermission, startRecording, stopRecording, isRecording, currentDb, getMetering, getRecordingDuration };
}
