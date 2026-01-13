import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// This is the initial loading screen.
// The RootLayout will automatically redirect the user
// to the correct screen ((auth) or (patient)/(doctor)).
export default function AppRoot() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});