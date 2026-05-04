import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Home, MessageCircle, Users, Route } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12) + 8,
          height: 60 + Math.max(insets.bottom, 12) + 8,
          elevation: 0,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={90}
            tint="light"
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.85)' }]}
          />
        ),
        tabBarLabelStyle: {
          fontFamily: 'DMSans_700Bold',
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontFamily: 'DMSans_700Bold',
          fontSize: 18,
          color: colors.foreground,
        },
        headerShadowVisible: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
          tabBarBadge: 3,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: '#fff',
            fontFamily: 'DMSans_600SemiBold',
            fontSize: 10,
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tabs.Screen
        name="seekers"
        options={{
          title: 'Seekers',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journeys"
        options={{
          title: 'Journeys',
          tabBarIcon: ({ color }) => <Route size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
