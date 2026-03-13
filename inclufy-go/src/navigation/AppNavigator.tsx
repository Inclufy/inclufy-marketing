import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../types';
import { colors, fontWeight as fw } from '../theme';
import { useTranslation } from '../i18n';

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
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import DemoEnvironmentScreen from '../screens/DemoEnvironmentScreen';
import AMOSHubScreen from '../screens/AMOSHubScreen';
import EventScannerScreen from '../screens/EventScannerScreen';
import EventIntelligenceScreen from '../screens/EventIntelligenceScreen';
import OpportunityFeedScreen from '../screens/OpportunityFeedScreen';
import AutonomousHubScreen from '../screens/AutonomousHubScreen';
import NetworkingEngineScreen from '../screens/NetworkingEngineScreen';

// ─── Navigators ─────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ─── Create Button (center tab) ─────────────────────────────────────
function CreateTabButton({ onPress, label }: { onPress?: (...args: any[]) => void; label?: string }) {
  return (
    <TouchableOpacity style={tabStyles.createButton} onPress={onPress} activeOpacity={0.8}>
      <View style={tabStyles.createCircle}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </View>
      <Text style={tabStyles.createLabel}>{label ?? 'Create'}</Text>
    </TouchableOpacity>
  );
}

// Placeholder for the Create tab (navigation happens via custom button)
function CreatePlaceholder() {
  return <View />;
}

// ─── Bottom Tabs ────────────────────────────────────────────────────
function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: fw.medium,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: '#111120',
          borderTopColor: '#252338',
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 24,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t.nav.home,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CampaignsTab"
        component={CampaignListScreen}
        options={{
          tabBarLabel: t.nav.campaigns,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'megaphone' : 'megaphone-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreatePlaceholder}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <CreateTabButton onPress={props.onPress} label={t.nav.create} />
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
          tabBarLabel: t.nav.events,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AMOSHubScreen}
        options={{
          tabBarLabel: 'AMOS',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? 'robot' : 'robot-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ─────────────────────────────────────────────────
export default function AppNavigator({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#111120' },
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
            options={{ title: t.screenTitles.eventSetup }}
          />
          <Stack.Screen
            name="EventDashboard"
            component={EventDashboardScreen}
            options={{ title: t.screenTitles.event }}
          />
          <Stack.Screen
            name="LiveCapture"
            component={LiveCaptureScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PostReview"
            component={PostReviewScreen}
            options={{ title: t.screenTitles.reviewPosts }}
          />
          <Stack.Screen
            name="StoryArc"
            component={StoryArcScreen}
            options={{ title: t.screenTitles.storyArc }}
          />
          <Stack.Screen
            name="EventRecap"
            component={EventRecapScreen}
            options={{ title: t.screenTitles.eventRecap }}
          />
          <Stack.Screen
            name="TeamManage"
            component={TeamManageScreen}
            options={{ title: t.screenTitles.team }}
          />

          {/* ─── Campaign Screens ─── */}
          <Stack.Screen
            name="CampaignList"
            component={CampaignListScreen}
            options={{ title: t.screenTitles.campaigns }}
          />
          <Stack.Screen
            name="CampaignCreate"
            component={CampaignCreateScreen}
            options={{ title: t.screenTitles.campaignCreate }}
          />
          <Stack.Screen
            name="CampaignDetail"
            component={CampaignDetailScreen}
            options={{ title: t.screenTitles.campaign }}
          />

          {/* ─── AI & Content ─── */}
          <Stack.Screen
            name="ContentCreator"
            component={ContentCreatorScreen}
            options={{ title: t.screenTitles.contentCreator }}
          />
          <Stack.Screen
            name="AICommand"
            component={AICommandScreen}
            options={{ title: t.screenTitles.aiCopilot }}
          />

          {/* ─── Smart Contact Capture ─── */}
          <Stack.Screen
            name="SmartLead"
            component={SmartLeadScreen}
            options={{ title: t.screenTitles.smartLead ?? 'Smart Contact' }}
          />
          <Stack.Screen
            name="QRScan"
            component={QRScanScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CardScan"
            component={CardScanScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyDigitalCard"
            component={MyDigitalCardScreen}
            options={{ title: t.screenTitles.myDigitalCard ?? 'My Digital Card' }}
          />
          <Stack.Screen
            name="NFCShare"
            component={NFCShareScreen}
            options={{ title: t.screenTitles.nfcShare ?? 'NFC Share' }}
          />
          <Stack.Screen
            name="LeadCapture"
            component={LeadCaptureScreen}
            options={{ title: t.screenTitles.leadCapture }}
          />

          {/* ─── Opportunity Radar ─── */}
          <Stack.Screen
            name="OpportunityRadar"
            component={OpportunityRadarScreen}
            options={{ title: t.screenTitles.opportunityRadar ?? 'Opportunity Radar' }}
          />

          {/* ─── Marketing Automation ─── */}
          <Stack.Screen
            name="MarketingAutomation"
            component={MarketingAutomationScreen}
            options={{ title: t.screenTitles.automation ?? 'Automation' }}
          />

          {/* ─── Budget ─── */}
          <Stack.Screen
            name="BudgetMonitor"
            component={BudgetMonitorScreen}
            options={{ title: t.screenTitles.marketingBudget }}
          />

          {/* ─── Settings & Notifications ─── */}
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: t.screenTitles.settings }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: t.screenTitles.notifications }}
          />

          {/* ─── Demo Environment ─── */}
          <Stack.Screen
            name="DemoEnvironment"
            component={DemoEnvironmentScreen}
            options={{ title: t.screenTitles.demoEnvironment ?? 'Demo Omgeving' }}
          />

          {/* ─── AMOS Hub ─── */}
          <Stack.Screen
            name="AMOSHub"
            component={AMOSHubScreen}
            options={{ headerShown: false }}
          />

          {/* ─── Event Scanner ─── */}
          <Stack.Screen
            name="EventScanner"
            component={EventScannerScreen}
            options={{ title: 'Event Scanner' }}
          />

          {/* ─── AMOS Intelligence Screens ─── */}
          <Stack.Screen
            name="EventIntelligence"
            component={EventIntelligenceScreen}
            options={{ title: 'Event Intelligence' }}
          />
          <Stack.Screen
            name="OpportunityFeed"
            component={OpportunityFeedScreen}
            options={{ title: 'AI Opportunity Feed' }}
          />
          <Stack.Screen
            name="AutonomousHub"
            component={AutonomousHubScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NetworkingEngine"
            component={NetworkingEngineScreen}
            options={{ title: 'Networking Engine' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// ─── Tab Bar Styles ─────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
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
  createLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: fw.semibold,
    marginTop: 4,
  },
});
