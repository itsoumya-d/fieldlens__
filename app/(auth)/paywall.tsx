import { View, Text, TouchableOpacity, ScrollView, Pressable, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';

const PRIMARY = '#15803D';
const PRIMARY_BG = '#DCFCE7';

const PLANS = [
  {
    id: 'annual',
    label: 'Annual',
    price: '$49.99',
    perMonth: '$4.17/mo',
    badge: 'Most Popular',
    savings: 'Save 58% — Best Value',
    trial: '7-day free trial included',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$9.99',
    perMonth: '$9.99/mo',
    badge: null,
    savings: null,
    trial: null,
  },
];

const FEATURES = [
  { icon: 'camera', text: 'Unlimited AI camera scans' },
  { icon: 'volume-high', text: 'ElevenLabs audio guidance' },
  { icon: 'library', text: 'Complete trade guide library' },
  { icon: 'location', text: 'GPS-tagged job reports' },
  { icon: 'checkmark-circle', text: 'Equipment checklists' },
  { icon: 'people', text: 'CRM integration' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    // RevenueCat: await Purchases.purchasePackage(selectedPackage);
    setTimeout(() => { setLoading(false); router.replace('/(tabs)/'); }, 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.closeRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} accessibilityLabel="Close" accessibilityRole="button">
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={s.header}>
            <View style={[s.iconWrap, { backgroundColor: PRIMARY_BG }]}>
              <Ionicons name="camera" size={34} color={PRIMARY} />
            </View>
            <Text style={s.headline}>Your AI Field Assistant</Text>
            <Text style={s.subhead}>Hands-free AI guidance, trade guides, and job documentation.</Text>
          </View>

          <View style={s.socialBar}>
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map(i => (
                <Ionicons key={i} name="star" size={14} color="#F59E0B" />
              ))}
            </View>
            <Text style={s.socialText}>
              Trusted by <Text style={s.socialBold}>9,400+</Text> users worldwide
            </Text>
          </View>

          <View style={s.features}>
            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={[s.featureIcon, { backgroundColor: PRIMARY_BG }]}>
                  <Ionicons name={f.icon as any} size={15} color={PRIMARY} />
                </View>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <View style={s.plans}>
            {PLANS.map(plan => {
              const sel = selectedPlan === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => { Haptics.selectionAsync(); setSelectedPlan(plan.id); }}
                  style={[s.planCard, sel && { borderColor: PRIMARY, backgroundColor: PRIMARY + '10' }]}
                >
                  {plan.badge && (
                    <View style={[s.planBadge, { backgroundColor: PRIMARY }]}>
                      <Text style={s.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <View style={s.planLeft}>
                    <View style={[s.radio, sel && { borderColor: PRIMARY }]}>
                      {sel && <View style={[s.radioDot, { backgroundColor: PRIMARY }]} />}
                    </View>
                    <View>
                      <Text style={[s.planLabel, sel && { color: PRIMARY }]}>{plan.label}</Text>
                      <Text style={s.planPerMonth}>{plan.perMonth}</Text>
                      {plan.savings && <Text style={s.planSavings}>{plan.savings}</Text>}
                    </View>
                  </View>
                  <View>
                    <Text style={[s.planPrice, sel && { color: PRIMARY }]}>{plan.price}</Text>
                    <Text style={s.planPeriod}>{plan.id === 'annual' ? '/year' : '/month'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedPlan === 'annual' && (
            <View style={s.trialNote}>
              <Ionicons name="gift-outline" size={16} color="#059669" />
              <Text style={s.trialText}>First 7 days free — cancel anytime before trial ends</Text>
            </View>
          )}

          <View style={s.cta}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={handleSubscribe}
                disabled={loading}
                style={[s.ctaBtn, { backgroundColor: PRIMARY }]}
              >
                <Text style={s.ctaBtnText}>
                  {loading ? 'Processing...' : selectedPlan === 'annual' ? '🎁  Start Free Trial' : '  Subscribe Now'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/')} style={s.skipBtn}>
              <Text style={s.skipText}>Maybe later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.restoreBtn}>
              <Text style={s.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>
            <Text style={s.legalText}>
              Cancel anytime. Payment charged to Apple ID / Google Play. Auto-renews unless cancelled 24h before period ends.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  closeBtn: { padding: 8 },
  header: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headline: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  subhead: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  socialBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginBottom: 20, backgroundColor: '#FFF7ED', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  stars: { flexDirection: 'row', gap: 2 },
  socialText: { fontSize: 13, color: '#92400E', flex: 1 },
  socialBold: { fontWeight: '700' },
  features: { paddingHorizontal: 24, marginBottom: 24, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, color: '#374151', flex: 1, fontWeight: '500' },
  plans: { paddingHorizontal: 24, marginBottom: 12, gap: 10 },
  planCard: { borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  planBadge: { position: 'absolute', top: -10, left: 16, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  planBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  planLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  planPerMonth: { fontSize: 13, color: '#9CA3AF', marginTop: 1 },
  planSavings: { fontSize: 12, color: '#059669', fontWeight: '600', marginTop: 2 },
  planPrice: { fontSize: 20, fontWeight: '800', color: '#374151', textAlign: 'right' },
  planPeriod: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  trialNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginBottom: 16, backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  trialText: { fontSize: 13, color: '#065F46', fontWeight: '500', flex: 1 },
  cta: { paddingHorizontal: 24, paddingBottom: 32 },
  ctaBtn: { borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  ctaBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  skipBtn: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  skipText: { color: '#9CA3AF', fontSize: 14 },
  restoreBtn: { paddingVertical: 8, alignItems: 'center' },
  restoreText: { color: '#9CA3AF', fontSize: 12, textDecorationLine: 'underline' },
  legalText: { color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
