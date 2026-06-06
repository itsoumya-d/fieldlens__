import { View, Text, ScrollView, StyleSheet, Share, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

const PRIMARY = '#E8711A';
const BG = '#0F172A';
const CARD = '#1E293B';

interface LineItem {
  label: string;
  hours?: number;
  rate?: number;
  amount: number;
}

const STUB_LINE_ITEMS: LineItem[] = [
  { label: 'Labor', hours: 4, rate: 85, amount: 340 },
  { label: 'Materials', amount: 75 },
  { label: 'Service Call', amount: 50 },
];

export default function InvoiceScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [sent, setSent] = useState(false);

  const subtotal = STUB_LINE_ITEMS.reduce((s, i) => s + i.amount, 0);
  const tax = subtotal * 0.085;
  const total = subtotal + tax;
  const invoiceNum = `INV-${(jobId ?? 'DEMO').slice(0, 6).toUpperCase()}`;
  const today = new Date();
  const due = new Date(today);
  due.setDate(today.getDate() + 14);

  const handleShare = async () => {
    await Share.share({
      message: `Invoice ${invoiceNum}\nFieldLens Pro Services\nTotal: $${total.toFixed(2)}\nDue: ${due.toLocaleDateString()}\n\nThank you for your business!`,
      title: invoiceNum,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Invoice</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Invoice header card */}
        <View style={s.invoiceCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={s.invoiceNum}>{invoiceNum}</Text>
              <Text style={s.brand}>FieldLens Pro</Text>
            </View>
            <View style={[s.statusBadge, sent && { backgroundColor: '#22C55E20' }]}>
              <Text style={[s.statusText, sent && { color: '#22C55E' }]}>{sent ? '✓ Sent' : 'Draft'}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={s.label}>Bill To</Text>
              <Text style={s.value}>Customer</Text>
              <Text style={s.valueMuted}>123 Main St, City, ST</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.label}>Invoice Date</Text>
              <Text style={s.value}>{today.toLocaleDateString()}</Text>
              <Text style={s.label}>Due Date</Text>
              <Text style={[s.value, { color: '#F59E0B' }]}>{due.toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Line items table */}
        <View style={s.tableCard}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 2 }]}>Service</Text>
            <Text style={s.tableHeaderCell}>Hrs</Text>
            <Text style={s.tableHeaderCell}>Rate</Text>
            <Text style={[s.tableHeaderCell, { textAlign: 'right' }]}>Total</Text>
          </View>
          {STUB_LINE_ITEMS.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 2 }]}>{item.label}</Text>
              <Text style={s.tableCell}>{item.hours ? `${item.hours}h` : '—'}</Text>
              <Text style={s.tableCell}>{item.rate ? `$${item.rate}/h` : '—'}</Text>
              <Text style={[s.tableCell, { textAlign: 'right', color: '#FFFFFF' }]}>${item.amount.toFixed(2)}</Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalVal}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Tax (8.5%)</Text>
            <Text style={s.totalVal}>${tax.toFixed(2)}</Text>
          </View>
          <View style={[s.totalRow, { marginTop: 8 }]}>
            <Text style={[s.totalLabel, { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }]}>TOTAL</Text>
            <Text style={[s.totalVal, { color: PRIMARY, fontWeight: '700', fontSize: 18 }]}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.emailBtn}
          onPress={() => Alert.alert('Email Sent', 'Invoice sent to customer email on file.')}
        >
          <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
          <Text style={s.emailBtnText}>Send Invoice by Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.sentBtn}
          onPress={() => {
            setSent(true);
            Alert.alert('Invoice Marked Sent', 'Invoice status updated.');
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={PRIMARY} />
          <Text style={s.sentBtnText}>Mark as Sent</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  invoiceCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  invoiceNum: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brand: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#64748B20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
  },
  label: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  valueMuted: {
    color: '#94A3B8',
    fontSize: 12,
  },
  tableCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 4,
  },
  tableHeaderCell: {
    flex: 1,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tableCell: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 13,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  totalVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  emailBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: `${PRIMARY}12`,
    marginBottom: 12,
  },
  sentBtnText: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
});
