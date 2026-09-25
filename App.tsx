import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initDb } from '@/db/schema';
import { reconcile } from '@/db/repository';
import { RootNavigator } from '@/navigation';
import { colors } from '@/theme/colors';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      initDb();
      reconcile();
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
