import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import type { RootStackParamList } from '../types';
import { colors, fontWeight as fw, fontSize, spacing, borderRadius } from '../theme';

// ─── Screens ────────────────────────────────────────────────────────
import LoginScreen from '../screens/LoginScreen';
// Tab screens
import HomeScreen from '../screens/HomeScreen';
import CampaignListScreen from '../screens/CampaignListScreen';
import EventListScreen from '../screens/EventListScreen';
import AICommandScreen from '../screens/AICommandScreen';
// Stack screens
import EventSetupScreen from '../screens/EventSetupScreen';
import LiveCaptureScreen from '../screens/LiveCaptureScreen';
import PostReviewScreen from '../screens/PostReviewScreen';
import EventDashboardScreen from '../screens/EventDashboardScreen';
import StoryArcScreen from '../screens/StoryArcScreen';
import EventRecapScreen from '../screens/EventRecapScreen';
import TeamManageScreen from '../screens/TeamManageScreen';
import CampaignDetailScreen from '../screens/CampaignDetailScreen';
import ContentCreatorScreen from '../screens/ContentCreatorScreen';
import LeadCaptureScreen from '../screens/LeadCaptureScreen';
import BudgetMonitorScreen from '../screens/BudgetMonitorScreen';

// ─── Navigators ─────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ─── Tab Icon ───────────────────────────────────────────────────────
function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>{icon}</Text>
      <Text
        style={[
          tabStyles.label,
          { color: focused ? colors.primary : colors.textTertiary },
          focused && { fontWeight: fw.semibold },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Create Button (center tab) ─────────────────────────────────────
function CreateTabButton({ onPress }: { onPress?: (...args: any[]) => void }) {
  return (
    <TouchableOpacity style={tabStyles.createButton} onPress={onPress} activeOpacity={0.8}>
      <View style={tabStyles.createCircle}>
        <Text style={tabStyles.createIcon}>+</Text>
      </View>
      <Text style={tabStyles.createLabel}>Create</Text>
    </TouchableOpacity>
  );
}

// Placeholder for the Create tab (navigation happens via custom button)
function CreatePlaceholder() {
  return <View />;
}

// ─── Bottom Tabs ────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u{1F3E0}'} label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CampaignsTab"
        component={CampaignListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u{1F4E3}'} label="Campagnes" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreatePlaceholder}
        options={{
          tabBarButton: (props) => (
            <CreateTabButton onPress={props.onPress} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ContentCreator');
          },
        })}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u{1F4C5}'} label="Events" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AICommandScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u{1F916}'} label="AI" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ─────────────────────────────────────────────────
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
          {/* Main Tabs */}
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />

          {/* ─── Event Screens ─── */}
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

          {/* ─── Campaign Screens ─── */}
          <Stack.Screen
            name="CampaignDetail"
            component={CampaignDetailScreen}
            options={{ title: 'Campagne' }}
          />

          {/* ─── AI & Content ─── */}
          <Stack.Screen
            name="ContentCreator"
            component={ContentCreatorScreen}
            options={{ title: 'Content Creator' }}
          />
          <Stack.Screen
            name="AICommand"
            component={AICommandScreen}
            options={{ title: 'AI Copilot' }}
          />

          {/* ─── Leads & Budget ─── */}
          <Stack.Screen
            name="LeadCapture"
            component={LeadCaptureScreen}
            options={{ title: 'Lead Vastleggen' }}
          />
          <Stack.Screen
            name="BudgetMonitor"
            component={BudgetMonitorScreen}
            options={{ title: 'Marketing Budget' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// ─── Tab Bar Styles ─────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 22,
  },
  iconFocused: {
    // slightly larger when focused
  },
  label: {
    fontSize: 10,
    fontWeight: fw.normal,
    marginTop: 1,
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
  },
  createCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  createIcon: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: fw.bold,
    lineHeight: 30,
  },
  createLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: fw.semibold,
    marginTop: 4,
  },
});
