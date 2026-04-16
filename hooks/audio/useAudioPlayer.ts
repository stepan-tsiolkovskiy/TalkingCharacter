import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { PITCH_RATE } from '../../constants/audio';

interface UseAudioPlayerReturn {
  playWithPitch: (uri: string, onFinish: () => void) => Promise<void>;
  stopPlaying: () => Promise<void>;
  isPlaying: boolean;
}

/**
 * Loads and plays an audio file with pitch shift via expo-av.
 *
 * Responsibilities:
 * - Switch iOS audio mode to speaker before playback
 * - Apply PITCH_RATE (no pitch correction) for the Talking Tom effect
 * - Notify caller via onFinish when playback ends or errors
 *
 * Architecture notes:
 * - Audio mode is set to allowsRecordingIOS:false before each play — required on
 *   iOS to route output to the speaker after a recording session ends
 * - Previous Sound instance is unloaded before creating a new one to prevent leaks
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current !== null) {
        soundRef.current.unloadAsync().catch((err: unknown) => {
          console.warn('[useAudioPlayer] cleanup unload error:', err);
        });
      }
    };
  }, []);

  const playWithPitch = useCallback(
    async (uri: string, onFinish: () => void): Promise<void> => {
      try {
        // Disable recording session so audio routes back to speaker on iOS
        // Must be first — if this fails we cannot safely play anything
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        // Release previous sound before loading a new one
        if (soundRef.current !== null) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
        );

        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            onFinish();
          }
        });

        // shouldCorrectPitch: false — let pitch rise with rate (Talking Tom effect)
        await sound.setRateAsync(PITCH_RATE, false);

        soundRef.current = sound;
        setIsPlaying(true);
        await sound.playAsync();
      } catch (err: unknown) {
        console.warn('[useAudioPlayer] playWithPitch error:', err);
        setIsPlaying(false);
        onFinish();
      }
    },
    [],
  );

  const stopPlaying = useCallback(async (): Promise<void> => {
    if (soundRef.current === null) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
    } catch (err: unknown) {
      console.warn('[useAudioPlayer] stopPlaying error:', err);
      soundRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return { playWithPitch, stopPlaying, isPlaying };
}
