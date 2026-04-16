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

Voice activity detection is driven by audio metering callbacks rather than a polling interval. This eliminates detection latency and keeps the VAD decoupled from any specific timer cadence.

### 2. Forward refs for circular dependency

Voice detection callbacks are wired up before the recorder and player exist, so they hold refs that are updated each render instead of closing over the functions directly. This breaks the initialization cycle without restructuring the hook hierarchy.

### 3. Ref + state mirroring for async callbacks

App state is stored in both React state (for rendering) and a plain ref (for async callbacks). Async handlers read from the ref to avoid acting on a stale snapshot captured at the time the callback was created.

### 4. Pitch shift via playback rate

Audio is played back faster than recorded, which raises pitch as a side effect — no DSP library needed. This keeps the dependency tree small and produces the same perceptible result for this use case.

### 5. Microphone off during playback

The microphone is stopped before playback begins. Without this, the device's speaker output bleeds into the open mic and corrupts the next recording session.

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
