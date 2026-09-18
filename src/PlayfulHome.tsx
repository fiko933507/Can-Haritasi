import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDownloadUrl, NearbyReport } from './backend';
import { COLORS } from './theme';

type PositionLike = { latitude: number; longitude: number; city?: string | null; district?: string | null } | null;
type IconName = keyof typeof Ionicons.glyphMap & string;

const needIcon: Record<string, IconName> = {
  Mama: 'fast-food',
  Su: 'water',
  Veteriner: 'medical',
  'Güvenli alan': 'home',
};

function humanDistance(meters: number) {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0).replace('.', ',')} km`;
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return 'şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.round(hours / 24)} gün önce`;
}

function BoneButton({ label, onPress, icon = 'paw' }: { label: string; onPress: () => void; icon?: IconName }) {
  return <Pressable onPress={onPress} style={styles.boneWrap}>
    <View style={[styles.boneLobe, styles.boneLT]} />
    <View style={[styles.boneLobe, styles.boneLB]} />
    <View style={[styles.boneLobe, styles.boneRT]} />
    <View style={[styles.boneLobe, styles.boneRB]} />
    <View style={styles.boneCore}><Ionicons name={icon} size={20} color="#fff" /><Text style={styles.boneText}>{label}</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></View>
  </Pressable>;
}

function RescueCard({ report, onHelp, onModerated }: { report: NearbyReport; onHelp: (id: string) => Promise<void>; onModerated: () => Promise<void> }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [helped, setHelped] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!report.image_key) return () => { alive = false; };
    getDownloadUrl(report.image_key).then(v => { if (alive) setImageUrl(v.downloadUrl); }).catch(() => undefined);
    return () => { alive = false; };
  }, [report.image_key]);

  const help = async () => {
    if (busy || helped) return;
    setBusy(true);
    try { await onHelp(report.id); setHelped(true); await onModerated(); } finally { setBusy(false); }
  };

  return <View style={styles.rescueCard}>
    <View style={styles.photoWrap}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.photo} /> : <View style={styles.photoFallback}><Text style={styles.petEmoji}>{report.animal_type === 'Köpek' ? '🐶' : report.animal_type === 'Kedi' ? '🐱' : '🐾'}</Text></View>}
      {report.urgency >= 4 && <View style={styles.urgentBadge}><Ionicons name="heart" size={11} color="#fff" /><Text style={styles.urgentText}>Acil</Text></View>}
    </View>
    <View style={styles.rescueBody}>
      <View style={styles.rescueTop}><Text style={styles.rescueName}>{report.animal_type}</Text><Text style={styles.distance}>{humanDistance(report.distance_m)}</Text></View>
      <Text numberOfLines={2} style={styles.rescueDesc}>{report.description || report.title || report.condition}</Text>
      <View style={styles.tagRow}><View style={styles.needTag}><Ionicons name={needIcon[report.condition] || 'paw'} size={13} color={COLORS.coral} /><Text style={styles.needText}>{report.condition}</Text></View><Text style={styles.time}>{relativeTime(report.created_at)}</Text></View>
      <Pressable onPress={help} style={[styles.helpButton, helped && styles.helpButtonDone]}>{busy ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name={helped ? 'checkmark-circle' : 'heart'} size={16} color="#fff" /><Text style={styles.helpText}>{helped ? 'Yoldayım' : 'Destek ol'}</Text></>}</Pressable>
    </View>
  </View>;
}

export function PlayfulHome({
  reports, loading, position, refresh, goReport, userName, onHelp, onModerated, onNotifications, unreadCount,
}: {
  reports: NearbyReport[];
  loading: boolean;
  position: PositionLike;
  refresh: () => void;
  goReport: () => void;
  userName: string;
  onHelp: (id: string) => Promise<void>;
  onModerated: () => Promise<void>;
  onNotifications: () => void;
  unreadCount: number;
}) {
  const [filter, setFilter] = useState('Tümü');
  const place = [position?.district, position?.city].filter(Boolean).join(' • ') || 'Konum bekleniyor';
  const filtered = useMemo(() => reports.filter(r => filter === 'Tümü' || (filter === 'Acil' ? r.urgency >= 4 : r.animal_type === filter || r.condition === filter)), [reports, filter]);

  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
    <View style={styles.header}>
      <View style={styles.brandRow}><View style={styles.brandPaw}><Ionicons name="paw" size={24} color="#fff" /></View><View><Text style={styles.brand}>Can Haritası</Text><Text style={styles.tagline}>Daha fazla patiye, daha fazla iyilik...</Text></View></View>
      <Pressable onPress={onNotifications} style={styles.bell}><Ionicons name="notifications" size={22} color={COLORS.forestDark} />{unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{Math.min(unreadCount, 9)}</Text></View>}</Pressable>
    </View>

    <View style={styles.locationLine}><Ionicons name="location" size={15} color={COLORS.coral} /><Text numberOfLines={1} style={styles.locationText}>{place}</Text><Pressable onPress={refresh}><Ionicons name="locate" size={18} color={COLORS.forest} /></Pressable></View>

    <LinearGradient colors={['#FFF0E0', '#FFE4D2', '#FFD6C2']} style={styles.hero}>
      <View style={styles.doodleOne}><Ionicons name="heart" size={24} color="#FF8A7E" /></View>
      <View style={styles.doodleTwo}><Ionicons name="paw" size={34} color="rgba(255,98,88,.16)" /></View>
      <Text style={styles.heroEyebrow}>MAHALLENDEKİ CANLAR</Text>
      <Text style={styles.heroTitle}>{loading ? 'Yakındaki dostları\narıyoruz...' : reports.length ? `${reports.length} can sana\nyakınında.` : 'Bir pati izi\nseni bekliyor.'}</Text>
      <Text style={styles.heroBody}>Bir canı görünür kıl, yardımı doğru kişiye ulaştır. Küçük bir iyilik büyük bir fark yaratır.</Text>
      <View style={styles.mascots}><View style={styles.mascotDog}><Text style={styles.mascotEmoji}>🐶</Text></View><View style={styles.mascotCat}><Text style={styles.mascotEmoji}>🐱</Text></View></View>
      <BoneButton label="Yardım bildir" onPress={goReport} icon="paw" />
    </LinearGradient>

    <View style={styles.stats}>
      <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#FFE7E2' }]}><Ionicons name="heart" size={18} color={COLORS.coral} /></View><Text style={styles.statValue}>{reports.length}</Text><Text style={styles.statLabel}>Yakındaki çağrı</Text></View>
      <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#FFF0CB' }]}><Ionicons name="star" size={18} color="#E9A12F" /></View><Text style={styles.statValue}>{reports.filter(r => r.urgency >= 4).length}</Text><Text style={styles.statLabel}>Acil ihtiyaç</Text></View>
      <Pressable onPress={refresh} style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#DFF4ED' }]}><Ionicons name="locate" size={18} color={COLORS.success} /></View><Text style={styles.statValue}>↻</Text><Text style={styles.statLabel}>Konumu yenile</Text></Pressable>
    </View>

    <View style={styles.sectionRow}><View><Text style={styles.sectionTitle}>Yakındaki canlar</Text><Text style={styles.sectionSub}>Çevrendeki dostlara birlikte ulaşalım</Text></View><Ionicons name="heart-outline" size={24} color={COLORS.coral} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{['Tümü', 'Acil', 'Köpek', 'Kedi', 'Mama'].map(x => <Pressable key={x} onPress={() => setFilter(x)} style={[styles.filter, filter === x && styles.filterActive]}><Text style={[styles.filterText, filter === x && styles.filterTextActive]}>{x}</Text></Pressable>)}</ScrollView>

    {loading && reports.length === 0 ? <ActivityIndicator style={{ marginVertical: 40 }} color={COLORS.coral} /> : filtered.length ? filtered.map(r => <RescueCard key={r.id} report={r} onHelp={onHelp} onModerated={onModerated} />) : <View style={styles.empty}><Text style={styles.emptyEmoji}>🐾</Text><Text style={styles.emptyTitle}>Şimdilik sessiz bir mahalle</Text><Text style={styles.emptyText}>Yakınında açık çağrı yok. Bir canın yardıma ihtiyacı olduğunu görürsen ilk pati izini sen bırakabilirsin.</Text><BoneButton label="İlk çağrıyı oluştur" onPress={goReport} /></View>}

    <View style={styles.footer}><Ionicons name="shield-checkmark" size={24} color={COLORS.success} /><View style={{ flex: 1 }}><Text style={styles.footerTitle}>Güvenli yardım ağı</Text><Text style={styles.footerText}>Canlı konumun yayınlanmaz. Bildirimler yalnızca seçtiğin mesafe ve ihtiyaçlara göre gönderilir.</Text></View></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 34, backgroundColor: COLORS.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  brandRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  brandPaw: { width: 46, height: 46, borderRadius: 17, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }] },
  brand: { color: COLORS.forestDark, fontSize: 24, fontWeight: '900', letterSpacing: -.8 },
  tagline: { color: COLORS.muted, fontSize: 9, marginTop: 1 },
  bell: { width: 46, height: 46, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  badge: { position: 'absolute', right: 4, top: 4, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 3, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 13, height: 42, borderWidth: 1, borderColor: COLORS.line, marginBottom: 13 },
  locationText: { flex: 1, fontSize: 10, color: COLORS.forest, fontWeight: '700' },
  hero: { minHeight: 350, borderRadius: 34, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F4D3BF' },
  doodleOne: { position: 'absolute', right: 22, top: 18, transform: [{ rotate: '12deg' }] },
  doodleTwo: { position: 'absolute', right: 30, bottom: 55, transform: [{ rotate: '-15deg' }] },
  heroEyebrow: { color: COLORS.coral, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  heroTitle: { color: COLORS.forestDark, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.2, marginTop: 10, maxWidth: '70%' },
  heroBody: { color: '#775F57', fontSize: 12, lineHeight: 18, marginTop: 10, maxWidth: '68%' },
  mascots: { position: 'absolute', right: 8, bottom: 75, width: 135, height: 145 },
  mascotDog: { position: 'absolute', right: 25, top: 0, width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFF7EE', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff', transform: [{ rotate: '5deg' }] },
  mascotCat: { position: 'absolute', right: 2, bottom: 4, width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFE9DD', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff', transform: [{ rotate: '-7deg' }] },
  mascotEmoji: { fontSize: 48 },
  boneWrap: { alignSelf: 'flex-start', marginTop: 22, minWidth: 190, height: 58, justifyContent: 'center' },
  boneCore: { zIndex: 2, height: 52, borderRadius: 22, paddingHorizontal: 22, backgroundColor: COLORS.coral, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: COLORS.coral, shadowOpacity: .2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  boneLobe: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.coral, zIndex: 1 },
  boneLT: { left: -7, top: 2 }, boneLB: { left: -7, bottom: 2 }, boneRT: { right: -7, top: 2 }, boneRB: { right: -7, bottom: 2 },
  boneText: { color: '#fff', fontSize: 14, fontWeight: '900', flex: 1, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  statCard: { flex: 1, minHeight: 104, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line, padding: 8 },
  statIcon: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: COLORS.forestDark },
  statLabel: { fontSize: 8, lineHeight: 11, textAlign: 'center', color: COLORS.muted, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 },
  sectionTitle: { color: COLORS.forestDark, fontSize: 22, fontWeight: '900', letterSpacing: -.5 },
  sectionSub: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  filters: { gap: 8, paddingVertical: 14, paddingRight: 10 },
  filter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.line },
  filterActive: { backgroundColor: COLORS.coral, borderColor: COLORS.coral },
  filterText: { color: COLORS.forest, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  rescueCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 25, borderWidth: 1, borderColor: COLORS.line, padding: 10, marginBottom: 11, shadowColor: '#8F6554', shadowOpacity: .05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  photoWrap: { width: 92, minHeight: 118, borderRadius: 21, overflow: 'hidden', backgroundColor: '#FFECE1' },
  photo: { width: '100%', height: '100%', position: 'absolute' },
  photoFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  petEmoji: { fontSize: 44 },
  urgentBadge: { position: 'absolute', left: 6, bottom: 6, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: COLORS.coral, flexDirection: 'row', alignItems: 'center', gap: 3 },
  urgentText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  rescueBody: { flex: 1, paddingLeft: 12, paddingVertical: 2 },
  rescueTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rescueName: { color: COLORS.forestDark, fontSize: 17, fontWeight: '900' },
  distance: { color: COLORS.muted, fontSize: 9, fontWeight: '700' },
  rescueDesc: { color: '#725F57', fontSize: 10, lineHeight: 15, marginTop: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 7 },
  needTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: COLORS.coralSoft },
  needText: { color: COLORS.coral, fontSize: 8, fontWeight: '900' },
  time: { color: COLORS.muted, fontSize: 8 },
  helpButton: { height: 34, borderRadius: 13, marginTop: 8, backgroundColor: COLORS.coral, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  helpButtonDone: { backgroundColor: COLORS.success },
  helpText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  empty: { backgroundColor: '#fff', borderRadius: 28, borderWidth: 1, borderColor: COLORS.line, padding: 22, alignItems: 'center' },
  emptyEmoji: { fontSize: 42 },
  emptyTitle: { marginTop: 8, fontSize: 17, fontWeight: '900', color: COLORS.forestDark },
  emptyText: { color: COLORS.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  footer: { marginTop: 18, padding: 16, borderRadius: 23, backgroundColor: '#E9F5EF', flexDirection: 'row', gap: 10, alignItems: 'center' },
  footerTitle: { color: COLORS.forestDark, fontSize: 12, fontWeight: '900' },
  footerText: { color: '#667A71', fontSize: 9, lineHeight: 14, marginTop: 2 },
});
