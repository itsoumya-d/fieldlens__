import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, Alert, Linking, Modal, TextInput, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';
import { useToast } from '@/lib/useToast';
import Toast from '@/components/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useTranslation } from 'react-i18next';
import { signOut } from '@/lib/auth';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { isBiometricAvailable, getBiometricType, setBiometricEnabled, isBiometricEnabled } from '@/lib/biometrics';
import { shareContent } from '@/lib/share';
import { LanguagePicker } from '@/components/LanguagePicker';

import { NotificationPreferences } from '@/components/NotificationPreferences';

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 11,
          color: '#8E8E93',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 10,
          paddingHorizontal: 20,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: '#2C2C2E',
          marginHorizontal: 20,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#3A3A3C',
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  iconColor = '#8E8E93',
  label,
  value,
  onPress,
  destructive = false,
  toggle,
  toggleValue,
  onToggle,
  showChevron = true,
}: {
  icon: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  showChevron?: boolean;
}) {
  return (
    <PressableScale haptic="light" accessibilityRole="button"
      onPress={onPress}
      disabled={toggle || !onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3C',
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: `${iconColor}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon as any} size={17} color={iconColor} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: destructive ? '#D32F2F' : '#FFFFFF',
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
      {value && (
        <Text style={{ fontSize: 14, color: '#8E8E93', marginRight: 6 }}>{value}</Text>
      )}
      {toggle && onToggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#3A3A3C', true: 'rgba(232, 113, 26, 0.5)' }}
          thumbColor={toggleValue ? '#E8711A' : '#8E8E93'}
        />
      )}
      {showChevron && !toggle && (
        <Ionicons name="chevron-forward" size={16} color="#636366" />
      )}
    </PressableScale>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, trade, experienceLevel, setSession, setUser, setOnboardingComplete } = useAuthStore();
  const { toast, showToast, hideToast } = useToast();
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [autoDismiss, setAutoDismiss] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [metricUnits, setMetricUnits] = useState(false);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricType, setBiometricTypeState] = useState<'face' | 'fingerprint' | 'none'>('none');

  const resolvedName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tradesperson';
  const email = user?.email || 'No email';

  const [editVisible, setEditVisible] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Profile updated', 'success');
    setEditVisible(false);
  };

  useEffect(() => {
    async function checkBiometric() {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricTypeState(type);
        const enabled = await isBiometricEnabled();
        setBiometricEnabledState(enabled);
      }
    }
    checkBiometric();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    await setBiometricEnabled(value);
    setBiometricEnabledState(value);
  };

  const handleSignOut = async () => {
    Alert.alert(t('settings.signOut'), 'Are you sure you want to sign out?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            setSession(null);
            setUser(null);
            setOnboardingComplete(false);
            router.replace('/auth/login');
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Something went wrong';
            showToast(message, 'error');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      'This will permanently delete all your data. This cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              setSession(null);
              setUser(null);
              setOnboardingComplete(false);
              router.replace('/auth/login');
            } catch (e: unknown) {
              const message = e instanceof Error ? e.message : 'Something went wrong';
              showToast(message, 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View entering={FadeInDown.delay(80).duration(500).springify()}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
          <Text style={{ fontSize: 28, color: '#FFFFFF', fontWeight: '800' }}>{t('settings.title')}</Text>
        </View>

        {/* Profile Card */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: '#2C2C2E',
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: '#3A3A3C',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(232, 113, 26, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#E8711A',
              }}
            >
              <Text style={{ fontSize: 26, color: '#E8711A', fontWeight: '700' }}>
                {resolvedName[0]?.toUpperCase() || 'U'}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 }}>
                  {resolvedName}
                </Text>
                <PressableScale haptic="light" accessibilityRole="button" onPress={() => setEditVisible(true)}>
                  <Ionicons name="pencil" size={16} color="#E8711A" />
                </PressableScale>
              </View>
              <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 8 }}>{email}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {trade && (
                  <View
                    style={{
                      backgroundColor: 'rgba(232, 113, 26, 0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ color: '#E8711A', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
                      {trade}
                    </Text>
                  </View>
                )}
                {experienceLevel && (
                  <View
                    style={{
                      backgroundColor: '#3A3A3C',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                      {experienceLevel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        </Animated.View>

        {/* Subscription */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <PressableScale haptic="medium" accessibilityRole="button"
            style={{
              backgroundColor: 'rgba(232, 113, 26, 0.1)',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: 'rgba(232, 113, 26, 0.3)',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(232, 113, 26, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="star" size={22} color="#E8711A" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{t('settings.freePlan')}</Text>
                <View
                  style={{
                    backgroundColor: '#3A3A3C',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '600' }}>{t('settings.analysesPerDay')}</Text>
                </View>
              </View>
              <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>
                {t('settings.upgradeCoaching')}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#E8711A',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{t('settings.upgrade')}</Text>
            </View>
          </PressableScale>
        </View>

        {/* AI Preferences */}
        <SettingsSection title={t('settings.aiPreferences')}>
          <SettingsRow
            icon="mic"
            iconColor="#E8711A"
            label={t('settings.voiceCommands')}
            toggle
            toggleValue={voiceEnabled}
            onToggle={setVoiceEnabled}
            showChevron={false}
          />
          <SettingsRow
            icon="timer-outline"
            iconColor="#1976D2"
            label={t('settings.autoDismiss')}
            toggle
            toggleValue={autoDismiss}
            onToggle={setAutoDismiss}
            showChevron={false}
          />
          <SettingsRow
            icon="repeat"
            iconColor="#2D8A4E"
            label={t('settings.continuousMode')}
            toggle
            toggleValue={continuousMode}
            onToggle={setContinuousMode}
            showChevron={false}
          />
        </SettingsSection>

        {/* App Preferences */}
        <SettingsSection title={t('settings.appPreferences')}>
          <SettingsRow
            icon="notifications"
            iconColor="#F9A825"
            label={t('settings.pushNotifications')}
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
            showChevron={false}
          />
          <SettingsRow
            icon="resize"
            iconColor="#9C27B0"
            label={t('settings.units')}
            value={metricUnits ? t('settings.metric') : t('settings.imperial')}
            onPress={() => setMetricUnits(!metricUnits)}
          />
          <SettingsRow
            icon="construct"
            iconColor="#8E8E93"
            label={t('settings.trade')}
            value={trade ? trade.charAt(0).toUpperCase() + trade.slice(1) : t('settings.notSet')}
            onPress={() => router.push('/onboarding/trade')}
          />
          <LanguagePicker currentLocale={i18n.language} />
        </SettingsSection>

        {/* Security */}
        {biometricAvailable && (
          <SettingsSection title={t('settings.security')}>
            <SettingsRow
              icon={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'}
              iconColor="#10B981"
              label={biometricType === 'face' ? t('settings.faceId') : t('settings.fingerprint')}
              toggle
              toggleValue={biometricEnabled}
              onToggle={handleBiometricToggle}
              showChevron={false}
            />
          </SettingsSection>
        )}

        {/* Account */}
        <SettingsSection title={t('settings.account')}>
          <SettingsRow
            icon="mail"
            iconColor="#1976D2"
            label={t('settings.changeEmail')}
            onPress={() => showToast('Email changes are handled via magic link. A new link will be sent to your new address.', 'info')}
          />
          <SettingsRow
            icon="log-out"
            iconColor="#F9A825"
            label={t('settings.signOut')}
            onPress={handleSignOut}
          />
          <SettingsRow
            icon="trash"
            iconColor="#D32F2F"
            label={t('settings.deleteAccount')}
            destructive
            onPress={handleDeleteAccount}
          />
        </SettingsSection>

        {/* Referral */}
        <SettingsSection title={t('settings.referral')}>
          <SettingsRow
            icon="gift-outline"
            iconColor="#E8711A"
            label={t('settings.referAFriend')}
            value={t('settings.getOneFree')}
            onPress={() => shareContent({ title: 'Join FieldLens', message: 'Join me on FieldLens!', url: 'https://fieldlens.app/?ref=USER123' })}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title={t('settings.about')}>
          <SettingsRow
            icon="information-circle"
            iconColor="#8E8E93"
            label={t('settings.version')}
            value="1.0.0"
            showChevron={false}
          />
          <SettingsRow
            icon="document-text"
            iconColor="#8E8E93"
            label={t('settings.terms')}
            onPress={() => Linking.openURL('https://fieldlens.app/terms')}
          />
          <SettingsRow
            icon="shield-checkmark"
            iconColor="#8E8E93"
            label={t('settings.privacy')}
            onPress={() => Linking.openURL('https://fieldlens.app/privacy')}
          />
          <SettingsRow
            icon="star-outline"
            iconColor="#F9A825"
            label={t('settings.rateApp')}
            onPress={() => StoreReview.requestReview()}
          />
        </SettingsSection>
      </ScrollView>
    
      <NotificationPreferences visible={showNotifPrefs} onClose={() => setShowNotifPrefs(false)} />
      <Toast {...toast} onHide={hideToast} />

      {/* Profile Edit Bottom Sheet */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#2C2C2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 }}>Edit Profile</Text>
            <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 6 }}>FULL NAME</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={{ backgroundColor: '#3A3A3C', borderRadius: 10, padding: 14, fontSize: 15, color: '#FFFFFF', marginBottom: 20 }}
              placeholderTextColor="#636366"
              placeholder="Your name"
            />
            <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 6 }}>EMAIL</Text>
            <Text style={{ fontSize: 15, color: '#636366', marginBottom: 24 }}>{user?.email}</Text>
            <PressableScale haptic="medium" accessibilityRole="button"
              onPress={handleSaveProfile} disabled={saving}
              style={{ backgroundColor: '#E8711A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Save Changes</Text>}
            </PressableScale>
            <PressableScale haptic="light" accessibilityRole="button"
              onPress={() => setEditVisible(false)}
              style={{ alignItems: 'center', paddingVertical: 12, marginTop: 8 }}
            >
              <Text style={{ color: '#8E8E93', fontSize: 15 }}>Cancel</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
  );
}
