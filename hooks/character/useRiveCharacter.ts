import { useCallback, useEffect, useRef, useState } from 'react';
import { type RiveRef } from 'rive-react-native';
import { AppState, INITIAL_APP_STATE } from '../../types/index';
import { RIVE_STATE_MACHINE, RIVE_INPUTS } from '../../constants/audio';

interface UseRiveCharacterReturn {
  riveRef: React.RefObject<RiveRef | null>;
  setCharacterState: (state: AppState) => void;
  onRiveReady: () => void;
}

/**
 * Drives the Rive character animation from AppState transitions.
 *
 * Responsibilities:
 * - Expose riveRef for binding to the <Rive> component
 * - Translate AppState into Rive boolean input pairs (Hear / Talk)
 * - Gate all state changes until the state machine signals it is ready
 *
 * Architecture notes:
 * - Boolean inputs are used instead of triggers because the Rive file models
 *   Hear and Talk as persistent boolean states, not one-shot events
 * - isReady flag prevents setInputState calls before the state machine initialises,
 *   which would otherwise silently no-op and leave the character in the wrong pose
 */
const RIVE_STATE_INPUTS: Record<AppState, { hear: boolean; talk: boolean }> = {
  [AppState.Idle]:      { hear: false, talk: false },
  [AppState.Listening]: { hear: true,  talk: false },
  [AppState.Playing]:   { hear: false, talk: true  },
};

export function useRiveCharacter(): UseRiveCharacterReturn {
  const riveRef = useRef<RiveRef>(null);
  const [characterState, setCharacterState] = useState<AppState>(INITIAL_APP_STATE);
  const [isReady, setIsReady] = useState<boolean>(false);

  const setRiveState = useCallback((state: AppState): void => {
    if (riveRef.current === null) return;
    const inputs = RIVE_STATE_INPUTS[state];
    riveRef.current.setInputState(RIVE_STATE_MACHINE, RIVE_INPUTS.hear, inputs.hear);
    riveRef.current.setInputState(RIVE_STATE_MACHINE, RIVE_INPUTS.talk, inputs.talk);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    setRiveState(characterState);
  }, [characterState, isReady, setRiveState]);

  const onRiveReady = useCallback((): void => {
    setIsReady(true);
  }, []);

  return { riveRef, setCharacterState, onRiveReady };
}
