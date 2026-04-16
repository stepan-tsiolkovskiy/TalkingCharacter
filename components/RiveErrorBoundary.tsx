import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RIVE_CHARACTER_SIZE } from '../constants/audio';
import { Colors, Typography } from '../constants/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RiveErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[RiveErrorBoundary] caught error:', error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Character unavailable</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    width: RIVE_CHARACTER_SIZE,
    height: RIVE_CHARACTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
  },
  text: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.sm,
  },
});
