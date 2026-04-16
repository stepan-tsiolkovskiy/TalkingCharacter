import { type RefObject } from 'react';
import Rive, { type RiveRef } from 'rive-react-native';
import { RIVE_STATE_MACHINE, RIVE_URL } from '../constants/audio';
import { Layout } from '../constants/theme';

interface Props {
  riveRef: RefObject<RiveRef | null>;
  onRiveReady?: () => void;
}

export function RiveCharacter({ riveRef, onRiveReady }: Props): React.JSX.Element {
  return (
    <Rive
      ref={riveRef}
      url={RIVE_URL}
      stateMachineName={RIVE_STATE_MACHINE}
      style={{ width: Layout.character.size, height: Layout.character.size, backgroundColor: 'transparent' }}
      onPlay={(animationName, isStateMachine) => {
        console.log(`[RiveCharacter] onPlay: "${animationName}" isStateMachine=${isStateMachine}`);
        if (isStateMachine) onRiveReady?.();
      }}
    />
  );
}
