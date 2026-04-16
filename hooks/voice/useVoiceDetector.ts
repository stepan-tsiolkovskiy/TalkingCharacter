import { useCallback, useEffect, useRef, useState } from 'react';
import { SILENCE_THRESHOLD_DB, SILENCE_DURATION_MS } from '../../constants/audio';

interface UseVoiceDetectorProps {
  onVoiceStart: () => void;
  onVoiceEnd: () => void;
  threshold?: number;       // dB above which voice is considered active
  silenceDuration?: number; // ms of silence before onVoiceEnd fires
}

interface UseVoiceDetectorReturn {
  isVoiceActive: boolean;
  feed: (db: number) => void;
}

/**
 * Detects voice activity from a push-based stream of dB metering values.
 *
 * Responsibilities:
 * - Fire onVoiceStart when dB exceeds threshold
 * - Fire onVoiceEnd after sustained silence of silenceDuration ms
 * - Cancel the silence timer if voice resumes before it expires
 *
 * Architecture notes:
 * - feed() is memoised with an empty dep array; all mutable values are read via
 *   refs to avoid stale closures without requiring re-subscription on prop changes
 * - Silence is debounced with a single timer — only one timer is ever live at a time
 */
export function useVoiceDetector({
  onVoiceStart,
  onVoiceEnd,
  threshold = SILENCE_THRESHOLD_DB,
  silenceDuration = SILENCE_DURATION_MS,
}: UseVoiceDetectorProps): UseVoiceDetectorReturn {
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);

  const isVoiceActiveRef = useRef<boolean>(false);
  const onVoiceStartRef = useRef<() => void>(onVoiceStart);
  const onVoiceEndRef = useRef<() => void>(onVoiceEnd);
  const thresholdRef = useRef<number>(threshold);
  const silenceDurationRef = useRef<number>(silenceDuration);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  onVoiceStartRef.current = onVoiceStart;
  onVoiceEndRef.current = onVoiceEnd;
  thresholdRef.current = threshold;
  silenceDurationRef.current = silenceDuration;

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current !== null) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const feed = useCallback((db: number): void => {
    const active: boolean = isVoiceActiveRef.current;

    if (db > thresholdRef.current) {
      // Cancel any pending silence timer — voice resumed
      if (silenceTimerRef.current !== null) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (!active) {
        isVoiceActiveRef.current = true;
        setIsVoiceActive(true);
        onVoiceStartRef.current();
      }
    } else {
      // Below threshold while voice was active — start silence countdown
      if (active && silenceTimerRef.current === null) {
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          isVoiceActiveRef.current = false;
          setIsVoiceActive(false);
          onVoiceEndRef.current();
        }, silenceDurationRef.current);
      }
    }
  }, []);

  return { isVoiceActive, feed };
}
