import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/navigation';
import { StyleSheet } from 'react-native';
import { initializeSettings } from './src/utils/storage';

export default function App() {
  useEffect(() => {
    initializeSettings();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Navigation />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});