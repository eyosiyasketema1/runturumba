import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 320;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = Colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          automaticallyAdjustKeyboardInsets
        >
          {/* ─── Hero / Top Section ────────────────────────────────── */}
          <View style={[styles.heroContainer, { paddingTop: insets.top }]}>
            {/* Background gradient image */}
            <Image
              source={require('@/assets/images/Abstract Blue Gradient (1).jpeg')}
              style={styles.heroBgImage}
              resizeMode="stretch"
            />
            {/* Logo centered */}
            <View style={styles.logoWrap}>
              <Image
                source={require('@/assets/images/Asset 10 2.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ─── Form Card ────────────────────────────────────────── */}
          <View style={styles.formCard}>
            <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Please enter your details to sign in.
            </Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.secondary }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={[styles.forgotText, { color: colors.mutedForeground }]}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrap, { backgroundColor: colors.secondary }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={[styles.googleBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={styles.googleIconWrap}>
                <Text style={styles.googleIcon}>G</Text>
              </View>
              <Text style={[styles.googleText, { color: colors.foreground }]}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ─── Hero ─────────────────────────────────────────────────────────────────

  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  logoWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
  },

  // ─── Form Card ────────────────────────────────────────────────────────────

  formCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    marginBottom: 28,
    lineHeight: 22,
  },

  // ─── Fields ───────────────────────────────────────────────────────────────

  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  forgotText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    padding: 0,
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 8,
  },

  // ─── Sign In ──────────────────────────────────────────────────────────────

  signInBtn: {
    backgroundColor: '#2563eb',
    height: 54,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signInText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#fff',
  },

  // ─── Divider ──────────────────────────────────────────────────────────────

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },

  // ─── Google ───────────────────────────────────────────────────────────────

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 54,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: '#0f172a',
  },
  googleText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
});
