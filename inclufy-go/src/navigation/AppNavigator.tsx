import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import type { RootStackParamList } from '../types';
import { colors, fontWeight as fw } from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import EventListScreen from '../screens/EventListScreen';
import EventSetupScreen from '../screens/EventSetupScreen';
import LiveCaptureScreen from '../screens/LiveCaptureScreen';
import PostReviewScreen from '../screens/PostReviewScreen';
import EventDashboardScreen from '../screens/EventDashboardScreen';
import StoryArcScreen from '../screens/StoryArcScreen';
import EventRecapScreen from '../screens/EventRecapScreen';
import TeamManageScreen from '../screens/TeamManageScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Events: '📅',
    Capture: '📸',
    Activity: '📊',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22 }}>{icons[label] || '📱'}</Text>
      <Text
        style={{
          fontSize: 10,
          color: focused ? colors.primary : colors.textSecondary,
          fontWeight: focused ? fw.semibold : fw.normal,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: 20,
        },
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventListScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Events" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fw.semibold },
        headerShadowVisible: false,
      }}
    >
      {!isLoggedIn ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EventSetup"
            component={EventSetupScreen}
            options={{ title: 'Event Setup' }}
          />
          <Stack.Screen
            name="EventDashboard"
            component={EventDashboardScreen}
            options={{ title: 'Event' }}
          />
          <Stack.Screen
            name="LiveCapture"
            component={LiveCaptureScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PostReview"
            component={PostReviewScreen}
            options={{ title: 'Review Posts' }}
          />
          <Stack.Screen
            name="StoryArc"
            component={StoryArcScreen}
            options={{ title: 'Story Arc' }}
          />
          <Stack.Screen
            name="EventRecap"
            component={EventRecapScreen}
            options={{ title: 'Event Recap' }}
          />
          <Stack.Screen
            name="TeamManage"
            component={TeamManageScreen}
            options={{ title: 'Team' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
