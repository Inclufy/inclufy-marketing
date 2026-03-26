import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CONSENT_KEY = '@inclufy_ai_consent';
const AI_CONSENT_DATE_KEY = '@inclufy_ai_consent_date';

class AIConsentService {
  private consentCache: boolean | null = null;

  /** Check if the user has given AI data processing consent. */
  async hasConsent(): Promise<boolean> {
    if (this.consentCache !== null) return this.consentCache;
    try {
      const value = await AsyncStorage.getItem(AI_CONSENT_KEY);
      this.consentCache = value === 'true';
      return this.consentCache;
    } catch {
      return false;
    }
  }

  /** Record that the user gave consent. */
  async grantConsent(): Promise<void> {
    try {
      await AsyncStorage.setItem(AI_CONSENT_KEY, 'true');
      await AsyncStorage.setItem(AI_CONSENT_DATE_KEY, new Date().toISOString());
      this.consentCache = true;
    } catch {
      // Silently fail — the modal will show again next time
    }
  }

  /** Revoke consent (from Settings). */
  async revokeConsent(): Promise<void> {
    try {
      await AsyncStorage.setItem(AI_CONSENT_KEY, 'false');
      this.consentCache = false;
    } catch {}
  }

  /** Clear cache so next check reads from disk. */
  clearCache(): void {
    this.consentCache = null;
  }
}

export const aiConsentService = new AIConsentService();
