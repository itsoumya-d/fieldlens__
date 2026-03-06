import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from '@/lib/auth';
import { useAuthStore } from '@/store/auth';

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
    <TouchableOpacity
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
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, trade, experienceLevel, setSession, setUser, setOnboardingComplete } = useAuthStore();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoDismiss, setAutoDismiss] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [metricUnits, setMetricUnits] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tradesperson';
  const email = user?.email || 'No email';

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          setSession(null);
          setUser(null);
          setOnboardingComplete(false);
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account deletion requires contacting support at support@fieldlens.app');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
          <Text style={{ fontSize: 28, color: '#FFFFFF', fontWeight: '800' }}>Settings</Text>
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
                {displayName[0]?.toUpperCase() || 'U'}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 }}>
                {displayName}
              </Text>
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

        {/* Subscription */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <TouchableOpacity
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
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Free Plan</Text>
                <View
                  style={{
                    backgroundColor: '#3A3A3C',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '600' }}>3 analyses/day</Text>
                </View>
              </View>
              <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>
                Upgrade for unlimited AI coaching
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
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Upgrade</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* AI Preferences */}
        <SettingsSection title="AI Preferences">
          <SettingsRow
            icon="mic"
            iconColor="#E8711A"
            label="Voice Commands"
            toggle
            toggleValue={voiceEnabled}
            onToggle={setVoiceEnabled}
            showChevron={false}
          />
          <SettingsRow
            icon="timer-outline"
            iconColor="#1976D2"
            label="Auto-Dismiss Results"
            toggle
            toggleValue={autoDismiss}
            onToggle={setAutoDismiss}
            showChevron={false}
          />
          <SettingsRow
            icon="repeat"
            iconColor="#2D8A4E"
            label="Continuous Analysis Mode"
            toggle
            toggleValue={continuousMode}
            onToggle={setContinuousMode}
            showChevron={false}
          />
        </SettingsSection>

        {/* App Preferences */}
        <SettingsSection title="App Preferences">
          <SettingsRow
            icon="notifications"
            iconColor="#F9A825"
            label="Push Notifications"
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
            showChevron={false}
          />
          <SettingsRow
            icon="resize"
            iconColor="#9C27B0"
            label="Units"
            value={metricUnits ? 'Metric' : 'Imperial'}
            onPress={() => setMetricUnits(!metricUnits)}
          />
          <SettingsRow
            icon="construct"
            iconColor="#8E8E93"
            label="Trade"
            value={trade ? trade.charAt(0).toUpperCase() + trade.slice(1) : 'Not set'}
            onPress={() => router.push('/onboarding/trade')}
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection title="Account">
          <SettingsRow
            icon="mail"
            iconColor="#1976D2"
            label="Change Email"
            onPress={() => Alert.alert('Change Email', 'Email changes are handled via magic link. A new link will be sent to your new address.')}
          />
          <SettingsRow
            icon="log-out"
            iconColor="#F9A825"
            label="Sign Out"
            onPress={handleSignOut}
          />
          <SettingsRow
            icon="trash"
            iconColor="#D32F2F"
            label="Delete Account"
            destructive
            onPress={handleDeleteAccount}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsRow
            icon="information-circle"
            iconColor="#8E8E93"
            label="Version"
            value="1.0.0"
            showChevron={false}
          />
          <SettingsRow
            icon="document-text"
            iconColor="#8E8E93"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingsRow
            icon="shield-checkmark"
            iconColor="#8E8E93"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsRow
            icon="star-outline"
            iconColor="#F9A825"
            label="Rate FieldLens"
            onPress={() => {}}
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
