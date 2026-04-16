export enum AppState {
  Idle = 'idle',
  Listening = 'listening',
  Playing = 'playing',
}

export enum PermissionStatus {
  Undetermined = 'undetermined',
  Granted = 'granted',
  Denied = 'denied',
}

export const INITIAL_APP_STATE = AppState.Idle;

export type StopRecordingFn = () => Promise<string | null>;
export type PlayWithPitchFn = (uri: string, onFinish: () => void) => Promise<void>;
export type StartMonitoringFn = () => Promise<void>;
export type StopMonitoringMicFn = () => Promise<void>;
