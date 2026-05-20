import { Layout } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}

function TabBarIcon({ name, color, focused }: TabBarIconProps) {
  return (
    <Ionicons name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)} size={22} color={color} />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;

  const tabBarHeight = Layout.tabBarHeight + (Platform.OS === 'android' ? Math.max(insets.bottom, 8) : insets.bottom);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.textPrimary,
          tabBarInactiveTintColor: c.textMuted,
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabBarHeight,
              paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) : insets.bottom,
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarBackground: () => <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Biblioteca',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="library" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Buscar',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="search" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'Más',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="ellipsis-horizontal" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
