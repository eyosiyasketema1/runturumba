import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

export default function SeekersScreen() {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Users size={48} color={colors.mutedForeground} />
      <Text style={[styles.title, { color: colors.foreground }]}>Seekers</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Your assigned seekers will appear here
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
    fontSize: 24,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
  },
});
