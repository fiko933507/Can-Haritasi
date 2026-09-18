import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NearbyReport } from './backend';
import { enableSmartNotifications } from './notifications';
import { COLORS } from './theme';

type PositionLike = { latitude: number; longitude: number } | null;

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return 'şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.round(hours / 24)} gün önce`;
}

export function NotificationCenter({
  reports, position, onBack, onOpenMap, onPreferences,
}: {
  reports: NearbyReport[];
  position: PositionLike;
  onBack: () => void;
  onOpenMap: () => void;
  onPreferences: () => void;
}) {
  const [enabling, setEnabling] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const items = useMemo(() => [...reports].sort((a, b) => {
    if (a.urgency !== b.urgency) return b.urgency - a.urgency;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }).slice(0, 20), [reports]);

  const enable = async () => {
    setEnabling(true);
    try {
      const result = await enableSmartNotifications(position);
      if (!result.enabled) {
        Alert.alert('Bildirim izni kapalı', 'Telefon ayarlarından Can Haritası bildirimlerine izin verdiğinde acil çağrıları anında alabilirsin.');
        return;
      }
      setEnabled(true);
      Alert.alert('Bildirimler açık', 'Yakınındaki uygun yardım çağrıları artık cihazına gönderilebilir.');
    } catch (error) {
      Alert.alert('Bildirimler açılamadı', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally { setEnabling(false); }
  };

  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.circle}><Ionicons name="arrow-back" size={22} color={COLORS.forestDark} /></Pressable>
      <View style={{ flex: 1 }}><Text style={styles.title}>Bildirimler</Text><Text style={styles.subtitle}>Yakındaki patilerden haberin olsun</Text></View>
      <View style={styles.paw}><Ionicons name="paw" size={22} color="#fff" /></View>
    </View>

    <View style={styles.pushCard}>
      <View style={styles.pushIcon}><Ionicons name="notifications" size={26} color={COLORS.coral} /></View>
      <View style={{ flex: 1 }}><Text style={styles.pushTitle}>Acil çağrıları kaçırma</Text><Text style={styles.pushText}>Bildirim izni açıksa seçtiğin mesafe ve türlere uyan yeni yardım çağrıları telefonuna anında gönderilir.</Text></View>
      <Pressable disabled={enabling || enabled} onPress={enable} style={[styles.enableButton, enabled && styles.enableDone]}>{enabling ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={enabled ? 'checkmark' : 'notifications-outline'} size={18} color="#fff" />}</Pressable>
    </View>

    <View style={styles.row}><Text style={styles.sectionTitle}>Yakındaki gelişmeler</Text><Pressable onPress={onPreferences}><Text style={styles.settings}>Ayarlar</Text></Pressable></View>

    {items.length ? items.map((report, index) => <Pressable key={report.id} onPress={onOpenMap} style={styles.item}>
      <View style={[styles.itemIcon, report.urgency >= 4 ? styles.itemIconUrgent : styles.itemIconNormal]}><Ionicons name={report.urgency >= 4 ? 'heart' : 'paw'} size={20} color={report.urgency >= 4 ? '#fff' : COLORS.orange} /></View>
      <View style={{ flex: 1 }}>
        <View style={styles.itemTop}><Text style={styles.itemTitle}>{report.urgency >= 4 ? 'Acil yardım çağrısı' : 'Yeni yardım çağrısı'}</Text>{index < 3 && <View style={styles.newBadge}><Text style={styles.newText}>YENİ</Text></View>}</View>
        <Text style={styles.itemBody}>{report.animal_type} • {report.condition}{report.description ? ` — ${report.description}` : ''}</Text>
        <Text style={styles.itemMeta}>{relativeTime(report.created_at)} • Haritada görüntüle</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#B7A49A" />
    </Pressable>) : <View style={styles.empty}>
      <View style={styles.emptyPaw}><Ionicons name="paw" size={38} color={COLORS.coral} /></View>
      <Text style={styles.emptyTitle}>Şimdilik yeni bildirim yok</Text>
      <Text style={styles.emptyText}>Yakınında yardıma ihtiyaç duyan yeni bir can olduğunda burada göreceksin.</Text>
      <Pressable onPress={onPreferences} style={styles.emptyButton}><Ionicons name="options-outline" size={17} color={COLORS.forestDark} /><Text style={styles.emptyButtonText}>Bildirim tercihlerini düzenle</Text></Pressable>
    </View>}

    <View style={styles.note}><Ionicons name="shield-checkmark" size={22} color={COLORS.success} /><Text style={styles.noteText}>Bildirimler konumunu paylaşmaz. Yakınlık hesabı yalnızca uygun yardım çağrılarını sana ulaştırmak için kullanılır.</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 38, backgroundColor: COLORS.cream },
  header: { flexDirection: 'row', gap: 11, alignItems: 'center', marginBottom: 18 },
  circle: { width: 44, height: 44, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  title: { color: COLORS.forestDark, fontSize: 26, fontWeight: '900', letterSpacing: -.7 },
  subtitle: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  paw: { width: 46, height: 46, borderRadius: 18, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '5deg' }] },
  pushCard: { backgroundColor: '#FFE8DB', borderRadius: 27, padding: 15, flexDirection: 'row', gap: 11, alignItems: 'center', borderWidth: 1, borderColor: '#F4D6C5' },
  pushIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pushTitle: { fontSize: 13, fontWeight: '900', color: COLORS.forestDark },
  pushText: { fontSize: 9, lineHeight: 14, color: '#795F55', marginTop: 3 },
  enableButton: { width: 42, height: 42, borderRadius: 16, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center' },
  enableDone: { backgroundColor: COLORS.success },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 10 },
  sectionTitle: { color: COLORS.forestDark, fontSize: 19, fontWeight: '900' },
  settings: { color: COLORS.coral, fontSize: 10, fontWeight: '900' },
  item: { backgroundColor: '#fff', borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: COLORS.line, marginBottom: 9 },
  itemIcon: { width: 44, height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  itemIconUrgent: { backgroundColor: COLORS.coral },
  itemIconNormal: { backgroundColor: '#FFF0E1' },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitle: { color: COLORS.forestDark, fontSize: 11, fontWeight: '900' },
  newBadge: { borderRadius: 999, backgroundColor: '#FFE0DB', paddingHorizontal: 6, paddingVertical: 2 },
  newText: { color: COLORS.coral, fontSize: 7, fontWeight: '900' },
  itemBody: { color: '#77645C', fontSize: 9, lineHeight: 14, marginTop: 3 },
  itemMeta: { color: COLORS.muted, fontSize: 8, marginTop: 5, fontWeight: '700' },
  empty: { backgroundColor: '#fff', borderRadius: 30, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  emptyPaw: { width: 72, height: 72, borderRadius: 28, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: COLORS.forestDark, fontSize: 17, fontWeight: '900', marginTop: 13 },
  emptyText: { color: COLORS.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 5, maxWidth: 270 },
  emptyButton: { minHeight: 44, borderRadius: 16, backgroundColor: '#FFF0E1', paddingHorizontal: 14, marginTop: 15, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: COLORS.forestDark, fontSize: 10, fontWeight: '900' },
  note: { flexDirection: 'row', gap: 10, backgroundColor: '#EAF6F0', borderRadius: 22, padding: 15, marginTop: 16, alignItems: 'center' },
  noteText: { flex: 1, color: '#61766D', fontSize: 9, lineHeight: 14 },
});
