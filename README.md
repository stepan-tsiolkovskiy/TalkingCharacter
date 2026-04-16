# TalkingCharacter

A React Native app that listens to your voice and plays it back at a higher pitch, animated by a Rive character.

## Demo

<!-- GIF or video placeholder -->

## Tech stack

- Expo SDK 53 + React Native
- TypeScript
- expo-av — recording and playback
- rive-react-native — character animation

## Architecture decisions

### 1. Push-based VAD instead of polling

`useVoiceDetector` exposes a `feed(db)` function that `useAudioRecorder` calls from `onRecordingStatusUpdate`. This means the VAD reacts the moment a metering value arrives — no polling interval, no drift between sample rate and detection cadence. A `setInterval` approach would add up to one interval of latency on every voice-start event and requires a separate cleanup path.

### 2. Forward refs for circular dependency

`onVoiceEnd` is passed to `useVoiceDetector` before `useAudioRecorder` and `useAudioPlayer` are instantiated — so it cannot close over their return values directly. Instead, `stopRecordingRef`, `playWithPitchRef`, and `startMonitoringRef` are created first with no-op defaults, then overwritten on every render with the real functions. This lets callbacks always call the latest function without re-subscribing to the detector.

### 3. `appStateRef` alongside `useState`

`onVoiceEnd` is a long-lived async callback. If it read `appState` from a closure, it would capture a stale value from the render where it was created. `appStateRef` is updated synchronously every time `setAppState` is called, so any in-flight async handler always sees the current state without needing to be recreated.

### 4. Pitch shift via playback rate

`sound.setRateAsync(1.4, false)` increases playback speed with `shouldCorrectPitch: false`, which raises pitch proportionally — the same trick Talking Tom uses. This requires zero native DSP dependencies and works within expo-av's existing API. A dedicated pitch-shift library would add significant bundle size and native complexity for the same perceptible result.

### 5. Microphone off during playback

Before calling `playAsync`, the app calls `recorder.stopRecording()` and sets `allowsRecordingIOS: false`. Without this, the iOS audio session stays in recording mode, the speaker routes through the earpiece at low volume, and the open microphone picks up the playback — polluting the next recording with an echo.

## Known limitations

- VAD threshold is fixed at −28 dB — no adaptation to background noise level
- Rive file is loaded from CDN — for production, bundle it locally
- expo-av is deprecated in SDK 54 — next step is migration to expo-audio
- No handling of audio interruptions (incoming call during recording)

## Running locally

```bash
git clone ...
cd TalkingCharacter
npm install
cd ios && pod install && cd ..
npx expo run:ios
```
