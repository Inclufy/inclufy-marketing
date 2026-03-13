import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { fontWeight as fw, spacing } from '../theme';
import { useTranslation } from '../i18n';

// ─── Screens ────────────────────────────────────────────────────────
import LoginScreen from '../screens/LoginScreen';
// Tab root screens
import HomeScreen from '../screens/HomeScreen';
import EventListScreen from '../screens/EventListScreen';
import AutonomousHubScreen from '../screens/AutonomousHubScreen';
import NetworkingEngineScreen from '../screens/NetworkingEngineScreen';
import SettingsScreen from '../screens/SettingsScreen';
// Stack screens
import CampaignListScreen from '../screens/CampaignListScreen';
import AICommandScreen from '../screens/AICommandScreen';
import EventSetupScreen from '../screens/EventSetupScreen';
import LiveCaptureScreen from '../screens/LiveCaptureScreen';
import PostReviewScreen from '../screens/PostReviewScreen';
import EventDashboardScreen from '../screens/EventDashboardScreen';
import StoryArcScreen from '../screens/StoryArcScreen';
import EventRecapScreen from '../screens/EventRecapScreen';
import TeamManageScreen from '../screens/TeamManageScreen';
import CampaignCreateScreen from '../screens/CampaignCreateScreen';
import CampaignDetailScreen from '../screens/CampaignDetailScreen';
import ContentCreatorScreen from '../screens/ContentCreatorScreen';
import LeadCaptureScreen from '../screens/LeadCaptureScreen';
import SmartLeadScreen from '../screens/SmartLeadScreen';
import QRScanScreen from '../screens/QRScanScreen';
import CardScanScreen from '../screens/CardScanScreen';
import MyDigitalCardScreen from '../screens/MyDigitalCardScreen';
import NFCShareScreen from '../screens/NFCShareScreen';
import OpportunityRadarScreen from '../screens/OpportunityRadarScreen';
import MarketingAutomationScreen from '../screens/MarketingAutomationScreen';
import BudgetMonitorScreen from '../screens/BudgetMonitorScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import DemoEnvironmentScreen from '../screens/DemoEnvironmentScreen';
import AMOSHubScreen from '../screens/AMOSHubScreen';
import EventScannerScreen from '../screens/EventScannerScreen';
import EventIntelligenceScreen from '../screens/EventIntelligenceScreen';
import OpportunityFeedScreen from '../screens/OpportunityFeedScreen';

// ─── Navigators ─────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ─── Capture Center Tab Button ───────────────────────────────────────
function CaptureTabButton({ onPress }: { onPress?: (...args: any[]) => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[tabStyles.captureButton]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[tabStyles.captureCircle, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
        <Ionicons name="camera" size={26} color="#fff" />
      </View>
      <Text style={[tabStyles.captureLabel, { color: colors.primary }]}>Capture</Text>
    </TouchableOpacity>
  );
}

function CapturePlaceholder() { return <View />; }

// ─── Events Stack (for tab) ──────────────────────────────────────────
function EventsStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fw.semibold as any },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name={'EventsRoot' as any} component={EventListScreen} options={{ title: 'Events' }} />
      <Stack.Screen name={'EventIntelligenceTab' as any} component={EventIntelligenceScreen} options={{ title: 'Event Intelligence' }} />
    </Stack.Navigator>
  );
}

// ─── AI Stack (for tab) ─ starts at AMOSHubScreen (full hub) ────────
function AIStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fw.semibold as any },
        headerShadowVisible: false,
      }}
    >
      {/* Root = full AMOS Hub with ALL modules */}
      <Stack.Screen name={'AIRoot' as any} component={AMOSHubScreen} options={{ headerShown: false }} />
      {/* Sub-screens reachable from hub tiles */}
      <Stack.Screen name={'OpportunityFeedTab' as any} component={OpportunityFeedScreen} options={{ title: 'AI Opportunity Feed' }} />
      <Stack.Screen name={'CampaignListTab' as any} component={CampaignListScreen} options={{ title: 'Campagnes' }} />
      <Stack.Screen name={'AutonomousHubTab' as any} component={AutonomousHubScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ─── Network Stack (for tab) ─────────────────────────────────────────
function NetworkStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fw.semibold as any },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name={'NetworkRoot' as any} component={NetworkingEngineScreen} options={{ title: 'Netwerk' }} />
    </Stack.Navigator>
  );
}

// ─── Bottom Tabs ─────────────────────────────────────────────────────
function MainTabs() {
  const { colors, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: fw.medium as any,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
      }}
    >
      {/* Tab 1 — Dashboard */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* Tab 2 — Events */}
      <Tab.Screen
        name="EventsTab"
        component={EventsStack}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* Tab 3 — Capture (center) */}
      <Tab.Screen
        name="CaptureTab"
        component={CapturePlaceholder}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <CaptureTabButton onPress={props.onPress} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('LiveCapture');
          },
        })}
      />

      {/* Tab 4 — AI Hub */}
      <Tab.Screen
        name="AITab"
        component={AIStack}
        options={{
          tabBarLabel: 'AI Hub',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={focused ? 'brain' : 'brain'} size={22} color={focused ? color : colors.textTertiary} />
          ),
        }}
      />

      {/* Tab 5 — Netwerk */}
      <Tab.Screen
        name="NetworkTab"
        component={NetworkStack}
        options={{
          tabBarLabel: 'Netwerk',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ─────────────────────────────────────────────────
export default function AppNavigator({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fw.semibold as any },
        headerShadowVisible: false,
      }}
    >
      {!isLoggedIn ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />

          {/* ─── Event Screens ─── */}
          <Stack.Screen name="EventSetup" component={EventSetupScreen} options={{ title: t.screenTitles.eventSetup }} />
          <Stack.Screen name="EventDashboard" component={EventDashboardScreen} options={{ title: t.screenTitles.event }} />
          <Stack.Screen name="LiveCapture" component={LiveCaptureScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PostReview" component={PostReviewScreen} options={{ title: t.screenTitles.reviewPosts }} />
          <Stack.Screen name="StoryArc" component={StoryArcScreen} options={{ title: t.screenTitles.storyArc }} />
          <Stack.Screen name="EventRecap" component={EventRecapScreen} options={{ title: t.screenTitles.eventRecap }} />
          <Stack.Screen name="TeamManage" component={TeamManageScreen} options={{ title: t.screenTitles.team }} />
          <Stack.Screen name="EventScanner" component={EventScannerScreen} options={{ title: 'Event Scanner' }} />

          {/* ─── Campaign Screens ─── */}
          <Stack.Screen name="CampaignList" component={CampaignListScreen} options={{ title: t.screenTitles.campaigns }} />
          <Stack.Screen name="CampaignCreate" component={CampaignCreateScreen} options={{ title: t.screenTitles.campaignCreate }} />
          <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} options={{ title: t.screenTitles.campaign }} />
          <Stack.Screen name="CampaignsTab" component={CampaignListScreen} options={{ title: t.screenTitles.campaigns }} />

          {/* ─── AI & Content ─── */}
          <Stack.Screen name="ContentCreator" component={ContentCreatorScreen} options={{ title: t.screenTitles.contentCreator }} />
          <Stack.Screen name="AICommand" component={AICommandScreen} options={{ title: t.screenTitles.aiCopilot }} />

          {/* ─── Networking / Contacts ─── */}
          <Stack.Screen name="SmartLead" component={SmartLeadScreen} options={{ title: t.screenTitles.smartLead ?? 'Smart Contact' }} />
          <Stack.Screen name="QRScan" component={QRScanScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CardScan" component={CardScanScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MyDigitalCard" component={MyDigitalCardScreen} options={{ title: t.screenTitles.myDigitalCard ?? 'My Digital Card' }} />
          <Stack.Screen name="NFCShare" component={NFCShareScreen} options={{ title: t.screenTitles.nfcShare ?? 'NFC Share' }} />
          <Stack.Screen name="LeadCapture" component={LeadCaptureScreen} options={{ title: t.screenTitles.leadCapture }} />

          {/* ─── Intelligence ─── */}
          <Stack.Screen name="OpportunityRadar" component={OpportunityRadarScreen} options={{ title: t.screenTitles.opportunityRadar ?? 'Opportunity Radar' }} />
          <Stack.Screen name="EventIntelligence" component={EventIntelligenceScreen} options={{ title: 'Event Intelligence' }} />
          <Stack.Screen name="OpportunityFeed" component={OpportunityFeedScreen} options={{ title: 'AI Opportunity Feed' }} />

          {/* ─── Marketing Automation ─── */}
          <Stack.Screen name="MarketingAutomation" component={MarketingAutomationScreen} options={{ title: t.screenTitles.automation ?? 'Automation' }} />
          <Stack.Screen name="BudgetMonitor" component={BudgetMonitorScreen} options={{ title: t.screenTitles.marketingBudget }} />
          <Stack.Screen name="AMOSHub" component={AMOSHubScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AutonomousHub" component={AutonomousHubScreen} options={{ headerShown: false }} />
          <Stack.Screen name="NetworkingEngine" component={NetworkingEngineScreen} options={{ title: 'Networking Engine' }} />

          {/* ─── Settings & Notifications ─── */}
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t.screenTitles.settings }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t.screenTitles.notifications }} />
          <Stack.Screen name="DemoEnvironment" component={DemoEnvironmentScreen} options={{ title: t.screenTitles.demoEnvironment ?? 'Demo Omgeving' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
    width: 72,
  },
  captureCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  captureLabel: {
    fontSize: 10,
    fontWeight: fw.semibold as any,
    marginTop: 4,
  },
});
