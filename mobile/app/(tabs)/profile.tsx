import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <User size={48} color={colors.mutedForeground} />
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Your profile and settings
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
