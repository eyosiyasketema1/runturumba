import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Route } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

export default function JourneysScreen() {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Route size={48} color={colors.mutedForeground} />
      <Text style={[styles.title, { color: colors.foreground }]}>Journeys</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Faith journeys will appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
});
