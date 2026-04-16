# TalkingCharacter — project context

## Що це

Expo + React Native застосунок. Talking Tom клон.
Персонаж слухає голос користувача і повторює його з вищим pitch.

## Стек

- Expo SDK 51+
- TypeScript
- expo-av (запис + відтворення)
- rive-react-native (анімація персонажа)

## Архітектура

Все розділено по фічах через кастомні хуки.
Жодних класів, жодних зовнішніх сервісів.

hooks/
audio/
useAudioRecorder.ts — тільки запис
useAudioPlayer.ts — тільки відтворення з pitch
voice/
useVoiceDetector.ts — VAD: metering + threshold + silence timer
character/
useRiveCharacter.ts — керування Rive state machine
useRepeaterLogic.ts — бізнес логіка, зшиває всі хуки

components/
RiveCharacter.tsx
VolumeIndicator.tsx

screens/
RepeaterScreen.tsx — тільки UI

## Стейт машина

idle → (гучність > -35dB) → listening → (тиша 1с) → playing → idle

## Важливо

- Без кнопок
- Без серверів
- Pitch: rate 1.4 через expo-av
- Rive тригери: перевірити точні назви в редакторі
