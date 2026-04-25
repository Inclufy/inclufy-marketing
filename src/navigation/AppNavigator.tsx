import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { fontWeight as fw, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../i18n';

// ─── Screens ────────────────────────────────────────────────────────
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import EventListScreen from '../screens/EventListScreen';
import AutonomousHubScreen from '../screens/AutonomousHubScreen';
import NetworkingEngineScreen from '../screens/NetworkingEngineScreen';
import SettingsScreen from '../screens/SettingsScreen';
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
import BrandKitScreen from '../screens/BrandKitScreen';
import EventAttendeesScreen from '../screens/EventAttendeesScreen';
import EventShareScreen from '../screens/EventShareScreen';
import CopilotScreen from '../screens/CopilotScreen';
import FollowedOrganizersScreen from '../screens/FollowedOrganizersScreen';
import ProductsScreen from '../screens/ProductsScreen';
import TeamDirectoryScreen from '../screens/TeamDirectoryScreen';
import OrganizationScreen from '../screens/OrganizationScreen';
import MarketingStrategyScreen from '../screens/MarketingStrategyScreen';
import ContentProposalsScreen from '../screens/ContentProposalsScreen';
import ContentCalendarScreen from '../screens/ContentCalendarScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AllPostsScreen from '../screens/AllPostsScreen';
import MultiAgentScreen from '../screens/MultiAgentScreen';
import IntegrationsScreen from '../screens/IntegrationsScreen';
import WhatsAppSettingsScreen from '../screens/WhatsAppSettingsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import LibraryImportScreen from '../screens/LibraryImportScreen';
import LibraryPostDetailScreen from '../screens/LibraryPostDetailScreen';

// ─── Navigators ─────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Capture Categories ─────────────────────────────────────────────
const CAPTURE_CATEGORIES = [
  { key: 'event', label: 'Event Capture', desc: 'Content van events & conferenties', icon: 'party-popper' as const, color: '#E8317A' },
  { key: 'product', label: 'Product Capture', desc: 'Product shots, demos & unboxings', icon: 'package-variant-closed' as const, color: '#3B82F6' },
  { key: 'inspiration', label: 'Inspiratie', desc: 'Trends, ideeën & concurrentie', icon: 'lightbulb-on' as const, color: '#F59E0B' },
  { key: 'behind_scenes', label: 'Behind the Scenes', desc: 'Team, kantoor & bedrijfscultuur', icon: 'account-group' as const, color: '#10B981' },
];

// ─── Events Stack ───────────────────────────────────────────────────
function EventsStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: fw.semibold as any }, headerShadowVisible: false }}>
      <Stack.Screen name={'EventsRoot' as any} component={EventListScreen} options={{ title: 'Events' }} />
      <Stack.Screen name={'EventIntelligenceTab' as any} component={EventIntelligenceScreen} options={{ title: 'Event Intelligence' }} />
    </Stack.Navigator>
  );
}

// ─── Campaigns Stack ────────────────────────────────────────────────
function CampaignsStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: fw.semibold as any }, headerShadowVisible: false }}>
      <Stack.Screen name={'CampaignsRoot' as any} component={CampaignListScreen} options={{ title: 'Campagnes' }} />
    </Stack.Navigator>
  );
}

// ─── AI / AMOS Stack ────────────────────────────────────────────────
function AIStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: fw.semibold as any }, headerShadowVisible: false }}>
      <Stack.Screen name={'AIRoot' as any} component={AMOSHubScreen} options={{ headerShown: false }} />
      <Stack.Screen name={'OpportunityFeedTab' as any} component={OpportunityFeedScreen} options={{ title: 'AI Opportunity Feed' }} />
      <Stack.Screen name={'CampaignListTab' as any} component={CampaignListScreen} options={{ title: 'Campagnes' }} />
      <Stack.Screen name={'AutonomousHubTab' as any} component={AutonomousHubScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ─── Main Tabs + Floating Camera FAB ────────────────────────────────
function MainTabsWrapper() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  const handleCaptureCategory = (category: string) => {
    setShowCaptureModal(false);
    setTimeout(() => navigation.navigate('LiveCapture' as any, { captureCategory: category }), 200);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: { fontSize: 10, fontWeight: fw.medium as any, marginTop: -2 },
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
              <MaterialCommunityIcons name={focused ? 'view-dashboard' : 'view-dashboard-outline'} size={22} color={color} />
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
              <MaterialCommunityIcons name={focused ? 'calendar-star' : 'calendar-blank-outline'} size={22} color={color} />
            ),
          }}
        />

        {/* Tab 3 — Campaigns */}
        <Tab.Screen
          name="CampaignsTab"
          component={CampaignsStack}
          options={{
            tabBarLabel: 'Campagnes',
            tabBarIcon: ({ focused, color }) => (
              <MaterialCommunityIcons name={focused ? 'bullhorn' : 'bullhorn-outline'} size={22} color={color} />
            ),
          }}
        />

        {/* Tab 4 — Alle Posts */}
        <Tab.Screen
          name="AllPostsTab"
          component={AllPostsScreen}
          options={{
            tabBarLabel: 'Posts',
            tabBarIcon: ({ focused, color }) => (
              <MaterialCommunityIcons name={focused ? 'post' : 'post-outline'} size={22} color={color} />
            ),
          }}
        />

        {/* Tab 5 — Copilot */}
        <Tab.Screen
          name="CopilotTab"
          component={CopilotScreen}
          options={{
            tabBarLabel: 'Copilot',
            tabBarIcon: ({ focused, color }) => (
              <MaterialCommunityIcons name={focused ? 'robot' : 'robot-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* ── Floating Camera FAB ── */}
      <TouchableOpacity
        testID="camera-fab"
        accessibilityLabel="camera-fab"
        style={[fabStyles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={() => setShowCaptureModal(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="camera-plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Capture Category Modal ── */}
      <Modal visible={showCaptureModal} transparent animationType="slide" onRequestClose={() => setShowCaptureModal(false)}>
        <TouchableOpacity style={fabStyles.modalOverlay} activeOpacity={1} onPress={() => setShowCaptureModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[fabStyles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[fabStyles.handleBar, { backgroundColor: colors.border }]} />

              <Text style={[fabStyles.modalTitle, { color: colors.text }]}>Wat wil je vastleggen?</Text>
              <Text style={[fabStyles.modalSubtitle, { color: colors.textSecondary }]}>Kies een categorie voor je content</Text>

              <View style={fabStyles.categoriesGrid}>
                {CAPTURE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[fabStyles.categoryCard, { backgroundColor: cat.color + '08', borderColor: cat.color + '30' }]}
                    onPress={() => handleCaptureCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[fabStyles.categoryIcon, { backgroundColor: cat.color + '18' }]}>
                      <MaterialCommunityIcons name={cat.icon} size={28} color={cat.color} />
                    </View>
                    <Text style={[fabStyles.categoryLabel, { color: colors.text }]}>{cat.label}</Text>
                    <Text style={[fabStyles.categoryDesc, { color: colors.textSecondary }]}>{cat.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[fabStyles.quickCapture, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => handleCaptureCategory('quick')}
              >
                <MaterialCommunityIcons name="camera-burst" size={20} color={colors.primary} />
                <Text style={[fabStyles.quickCaptureText, { color: colors.primary }]}>Snel vastleggen</Text>
              </TouchableOpacity>

              <TouchableOpacity style={fabStyles.cancelBtn} onPress={() => setShowCaptureModal(false)}>
                <Text style={[fabStyles.cancelText, { color: colors.textSecondary }]}>Annuleren</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
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
          <Stack.Screen name="Main" component={MainTabsWrapper} options={{ headerShown: false }} />

          {/* ─── Event Screens ─── */}
          <Stack.Screen name="EventSetup" component={EventSetupScreen} options={{ title: t.screenTitles.eventSetup }} />
          <Stack.Screen name="EventDashboard" component={EventDashboardScreen} options={{ title: t.screenTitles.event }} />
          <Stack.Screen name="LiveCapture" component={LiveCaptureScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PostReview" component={PostReviewScreen} options={{ title: t.screenTitles.reviewPosts }} />
          <Stack.Screen name="StoryArc" component={StoryArcScreen} options={{ title: t.screenTitles.storyArc }} />
          <Stack.Screen name="EventRecap" component={EventRecapScreen} options={{ title: t.screenTitles.eventRecap }} />
          <Stack.Screen name="TeamManage" component={TeamManageScreen} options={{ title: t.screenTitles.team }} />
          <Stack.Screen name="EventScanner" component={EventScannerScreen} options={{ title: 'Event Scanner' }} />
          <Stack.Screen name="EventAttendees" component={EventAttendeesScreen} options={{ title: t.screenTitles.eventAttendees ?? 'Attendees' }} />
          <Stack.Screen name="EventShare" component={EventShareScreen} options={{ title: t.screenTitles.eventShare ?? 'Share Event' }} />

          {/* ─── Campaign Screens ─── */}
          <Stack.Screen name="CampaignList" component={CampaignListScreen} options={{ title: t.screenTitles.campaigns }} />
          <Stack.Screen name="CampaignCreate" component={CampaignCreateScreen} options={{ title: t.screenTitles.campaignCreate }} />
          <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} options={{ title: t.screenTitles.campaign }} />

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
          <Stack.Screen name="FollowedOrganizers" component={FollowedOrganizersScreen} options={{ title: 'Gevolgde Organisatoren' }} />

          {/* ─── Marketing Automation ─── */}
          <Stack.Screen name="MarketingAutomation" component={MarketingAutomationScreen} options={{ title: t.screenTitles.automation ?? 'Automation' }} />
          <Stack.Screen name="BudgetMonitor" component={BudgetMonitorScreen} options={{ title: t.screenTitles.marketingBudget }} />
          <Stack.Screen name="AMOSHub" component={AMOSHubScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AutonomousHub" component={AutonomousHubScreen} options={{ headerShown: false }} />
          <Stack.Screen name="NetworkingEngine" component={NetworkingEngineScreen} options={{ title: 'Networking Engine' }} />

          {/* ─── Content Hubs ─── */}
          <Stack.Screen name="Products" component={ProductsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TeamDirectory" component={TeamDirectoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Organization" component={OrganizationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MarketingStrategy" component={MarketingStrategyScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ContentProposals" component={ContentProposalsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ContentCalendar" component={ContentCalendarScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AllPosts" component={AllPostsScreen} options={{ title: t.screenTitles.allPosts ?? 'Alle Posts' }} />
          <Stack.Screen name="MultiAgent" component={MultiAgentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Integrations" component={IntegrationsScreen} options={{ headerShown: false }} />

          {/* ─── Content Library ─── */}
          <Stack.Screen name="Library" component={LibraryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LibraryImport" component={LibraryImportScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LibraryPostDetail" component={LibraryPostDetailScreen} options={{ headerShown: false }} />

          {/* ─── Settings & Notifications ─── */}
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t.screenTitles.settings }} />
          <Stack.Screen name="WhatsAppSettings" component={WhatsAppSettingsScreen} options={{ title: 'WhatsApp Business' }} />
          <Stack.Screen name="BrandKit" component={BrandKitScreen} options={{ title: t.screenTitles.brandKit ?? 'Brand Kit' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t.screenTitles.notifications }} />
          <Stack.Screen name="DemoEnvironment" component={DemoEnvironmentScreen} options={{ title: t.screenTitles.demoEnvironment ?? 'Demo Omgeving' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 76,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: fw.bold as any,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    width: (SCREEN_W - 52) / 2,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: fw.bold as any,
    textAlign: 'center',
  },
  categoryDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  quickCapture: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  quickCaptureText: {
    fontSize: 14,
    fontWeight: fw.semibold as any,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: fw.medium as any,
  },
});
