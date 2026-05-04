import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Home, MessageCircle, Users, Route, User } from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colors = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
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
          tabBarIcon: ({ color, size }) => <Home size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size ?? 22} color={color} />,
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
          tabBarIcon: ({ color, size }) => <Users size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journeys"
        options={{
          title: 'Journeys',
          tabBarIcon: ({ color, size }) => <Route size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size ?? 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
