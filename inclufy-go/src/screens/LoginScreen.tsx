import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import { colors, brandGradient, spacing, borderRadius, fontSize, fontWeight } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Vul email en wachtwoord in');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Login mislukt', error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Vul eerst je email in', 'We sturen je een reset link.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert('Fout', error.message);
    } else {
      Alert.alert('Check je email', 'We hebben een wachtwoord reset link verstuurd.');
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Vul email en wachtwoord in om een account aan te maken');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Registratie mislukt', error.message);
    } else {
      Alert.alert('Account aangemaakt!', 'Check je email om je account te bevestigen.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={brandGradient.light as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            {/* Bars icon */}
            <View style={styles.barsContainer}>
              <View style={[styles.bar, styles.barShort]} />
              <View style={[styles.bar, styles.barTall]} />
              <View style={[styles.bar, styles.barMedium]} />
            </View>
          </LinearGradient>

          <View style={styles.titleRow}>
            <Text style={styles.title}>Inclufy</Text>
            <Text style={styles.titleDot}>.</Text>
          </View>
          <Text style={styles.subtitleBrand}>AI MARKETING</Text>
          <Text style={styles.subtitleGo}>on the go</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>{'\u2709'}</Text>
              </View>
              <View style={styles.inputSeparator} />
              <TextInput
                style={styles.input}
                placeholder="naam@bedrijf.nl"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Wachtwoord</Text>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Vergeten?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>{'\u{1F512}'}</Text>
              </View>
              <View style={styles.inputSeparator} />
              <TextInput
                style={styles.input}
                placeholder="Wachtwoord"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '\u{1F441}' : '\u{1F441}\u200D\u{1F5E8}'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <LinearGradient
            colors={brandGradient.deep as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.loginButton, loading && styles.buttonDisabled]}
          >
            <TouchableOpacity
              style={styles.loginButtonInner}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.loginButtonText}>Inloggen</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>of</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpText}>Account aanmaken</Text>
            <Text style={styles.signUpArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Door in te loggen ga je akkoord met onze{' '}
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Voorwaarden</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}> en </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacybeleid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 90,
    height: 90,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 42,
  },
  bar: {
    width: 11,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 3,
  },
  barShort: { height: 18 },
  barTall: { height: 38 },
  barMedium: { height: 28 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  titleDot: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    color: colors.secondary,
  },
  subtitleBrand: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 3,
    marginTop: 2,
  },
  subtitleGo: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.secondary,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 1,
  },

  // Form
  form: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  inputIcon: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    opacity: 0.4,
  },
  inputSeparator: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.md,
    color: colors.text,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  eyeIcon: {
    fontSize: 18,
    opacity: 0.4,
  },

  // Buttons
  loginButton: {
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  loginButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },

  // Sign up
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  signUpText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  signUpArrow: {
    fontSize: fontSize.lg,
    color: colors.primary,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  footerLink: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
