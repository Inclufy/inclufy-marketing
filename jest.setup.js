// Jest setup for AMOS (Inclufy Marketing) — Expo SDK 55 / RN 0.83.6
// Mocks platform modules so tests run in pure Node without native bridges.

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn().mockResolvedValue(null),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  multiSet: jest.fn().mockResolvedValue(null),
  multiGet: jest.fn().mockResolvedValue([]),
  multiRemove: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null),
  getAllKeys: jest.fn().mockResolvedValue([]),
}));

// Single source of truth for the Supabase client used across hooks/services.
jest.mock("./src/services/supabase", () => {
  const fromBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  });
  return {
    supabase: {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
        signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
        signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
      from: jest.fn(fromBuilder),
      functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: null, error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "" } }),
          createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
          remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      },
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

// Sentry — no-op in tests
jest.mock("./src/lib/sentry", () => ({
  initSentry: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Expo modules used at module-load time (only those AMOS depends on)
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: "Images", Videos: "Videos", All: "All" },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "ExponentPushToken[test]" }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-id"),
}));

jest.mock("expo-local-authentication", () => ({
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1]),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  useSegments: jest.fn().mockReturnValue([]),
  Link: "Link",
  Tabs: { Screen: "Tabs.Screen" },
  Stack: { Screen: "Stack.Screen" },
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn((path) => `inclufygo://${path}`),
  openURL: jest.fn(),
  parse: jest.fn(),
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/documents/",
  cacheDirectory: "/mock/cache/",
  readAsStringAsync: jest.fn().mockResolvedValue(""),
  writeAsStringAsync: jest.fn().mockResolvedValue(null),
  deleteAsync: jest.fn().mockResolvedValue(null),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
}));

jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: "mock://manipulated" }),
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
  FlipType: { Horizontal: "horizontal", Vertical: "vertical" },
}));

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((cb) => cb({ setExtra: jest.fn(), setTag: jest.fn() })),
  ErrorBoundary: ({ children }) => children,
  reactNavigationIntegration: jest.fn(),
}));
