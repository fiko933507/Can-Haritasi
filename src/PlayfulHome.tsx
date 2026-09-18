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

function BoneButton({ label, onPress, icon = 'paw', compact = false }: { label: string; onPress: () => void; icon?: IconName; compact?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.boneWrap, compact && styles.boneWrapCompact]}>
    <View style={[styles.boneLobe, styles.boneLT]} />
    <View style={[styles.boneLobe, styles.boneLB]} />
    <View style={[styles.boneLobe, styles.boneRT]} />
    <View style={[styles.boneLobe, styles.boneRB]} />
    <View style={styles.boneCore}><Ionicons name={icon} size={18} color={COLORS.night} /><Text style={styles.boneText}>{label}</Text></View>
  </Pressable>;
}

function BowlStat({ icon, value, label, onPress, tone }: { icon: IconName; value: string | number; label: string; onPress?: () => void; tone: string }) {
  const body = <><View style={[styles.bowlRim, { borderColor: tone }]}><Ionicons name={icon} size={18} color={tone} /><Text style={styles.bowlValue}>{value}</Text></View><View style={[styles.bowlFoot, { backgroundColor: tone }]} /><Text style={styles.bowlLabel}>{label}</Text></>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={styles.bowl}>{body}</Pressable> : <View style={styles.bowl}>{body}</View>;
}

function RescueOrbit({ report, onHelp, onModerated }: { report: NearbyReport; onHelp: (id: string) => Promise<void>; onModerated: () => Promise<void> }) {
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

  return <View style={styles.orbit}>
    <View style={[styles.orbitRing, report.urgency >= 4 && styles.orbitRingUrgent]}>
      <View style={styles.photoCircle}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.photo} /> : <Text style={styles.petEmoji}>{report.animal_type === 'Köpek' ? '🐶' : report.animal_type === 'Kedi' ? '🐱' : '🐾'}</Text>}
      </View>
      <View style={styles.distanceMoon}><Text style={styles.distance}>{humanDistance(report.distance_m)}</Text></View>
    </View>
    <View style={styles.collarStrap}><View style={styles.collarHole} /><Text numberOfLines={1} style={styles.collarName}>{report.animal_type}</Text><View style={styles.collarHole} /></View>
    <Text numberOfLines={2} style={styles.rescueDesc}>{report.description || report.title || report.condition}</Text>
    <View style={styles.needLine}><Ionicons name={needIcon[report.condition] || 'paw'} size={13} color={COLORS.apricot} /><Text style={styles.needText}>{report.condition}</Text><Text style={styles.time}>• {relativeTime(report.created_at)}</Text></View>
    <Pressable accessibilityRole="button" onPress={help} style={[styles.tagButton, helped && styles.tagButtonDone]}>
      {busy ? <ActivityIndicator size="small" color={COLORS.night} /> : <><Ionicons name={helped ? 'checkmark-circle' : 'heart'} size={16} color={COLORS.night} /><Text style={styles.tagButtonText}>{helped ? 'Yoldayım' : 'Destek ol'}</Text></>}
    </Pressable>
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
    <View style={styles.starOne} /><View style={styles.starTwo} /><View style={styles.starThree} />
    <View style={styles.header}>
      <View style={styles.brandRow}><View style={styles.pawMoon}><Ionicons name="paw" size={24} color={COLORS.night} /></View><View><Text style={styles.brand}>Can Haritası</Text><Text style={styles.tagline}>Gecenin içinde bir iyilik izi</Text></View></View>
      <Pressable accessibilityLabel="Bildirimler" onPress={onNotifications} style={styles.bell}><Ionicons name="notifications" size={21} color={COLORS.moon} />{unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{Math.min(unreadCount, 9)}</Text></View>}</Pressable>
    </View>

    <View style={styles.collarLocation}><View style={styles.collarBuckle}><Ionicons name="location" size={16} color={COLORS.night} /></View><Text numberOfLines={1} style={styles.locationText}>{place}</Text><Pressable accessibilityLabel="Konumu yenile" onPress={refresh} style={styles.locate}><Ionicons name="locate" size={18} color={COLORS.collar} /></Pressable></View>

    <LinearGradient colors={['#12382D', '#0D291F', '#091C17']} style={styles.den}>
      <View style={styles.denEarLeft} /><View style={styles.denEarRight} />
      <View style={styles.denMoon}><Ionicons name="moon" size={22} color={COLORS.night} /></View>
      <View style={styles.denPaws}><Text style={styles.mascot}>🐶</Text><Text style={[styles.mascot, styles.cat]}>🐱</Text></View>
      <Text style={styles.heroEyebrow}>YAKININDA BİR CAN VAR</Text>
      <Text style={styles.heroTitle}>{loading ? 'Pati izlerini\narıyoruz…' : reports.length ? `${reports.length} can sana\nyakın.` : 'Sessizliği ilk\nsen duy.'}</Text>
      <Text style={styles.heroBody}>Bir canı görünür kıl. Mahallendeki iyilik halkasına katıl.</Text>
      <BoneButton label="Yardım bildir" onPress={goReport} />
    </LinearGradient>

    <View style={styles.bowls}>
      <BowlStat icon="heart" value={reports.length} label="yakın çağrı" tone={COLORS.coral} />
      <BowlStat icon="flash" value={reports.filter(r => r.urgency >= 4).length} label="acil ihtiyaç" tone={COLORS.apricot} />
      <BowlStat icon="locate" value="↻" label="konumu yenile" tone={COLORS.collar} onPress={refresh} />
    </View>

    <View style={styles.sectionOrbit}><View style={styles.sectionPaw}><Ionicons name="paw" size={20} color={COLORS.night} /></View><View><Text style={styles.sectionTitle}>Yakındaki canlar</Text><Text style={styles.sectionSub}>Her halka gerçek bir yardım çağrısı</Text></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{['Tümü', 'Acil', 'Köpek', 'Kedi', 'Mama'].map(x => <Pressable key={x} onPress={() => setFilter(x)} style={[styles.filterTag, filter === x && styles.filterTagActive]}><View style={styles.tagHole} /><Text style={[styles.filterText, filter === x && styles.filterTextActive]}>{x}</Text></Pressable>)}</ScrollView>

    {loading && reports.length === 0 ? <ActivityIndicator style={{ marginVertical: 44 }} color={COLORS.collar} /> : filtered.length ? <View style={styles.orbitGrid}>{filtered.map(r => <RescueOrbit key={r.id} report={r} onHelp={onHelp} onModerated={onModerated} />)}</View> : <View style={styles.emptyMoon}><View style={styles.emptyPaw}><Text style={styles.emptyEmoji}>🐾</Text></View><Text style={styles.emptyTitle}>Mahalle şimdilik sessiz</Text><Text style={styles.emptyText}>İlk yardım izini sen bırakabilirsin.</Text><BoneButton label="İlk çağrıyı oluştur" onPress={goReport} compact /></View>}

    <View style={styles.safetyCollar}><View style={styles.shieldCircle}><Ionicons name="shield-checkmark" size={22} color={COLORS.night} /></View><View style={{ flex: 1 }}><Text style={styles.footerTitle}>Güvenli yardım halkası</Text><Text style={styles.footerText}>Canlı konumun yayınlanmaz; yalnızca seçtiğin mesafedeki çağrılar gösterilir.</Text></View></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 42, backgroundColor: COLORS.night, minHeight: '100%' },
  starOne: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: '#6FD7B5', top: 105, right: 34, opacity: .6 },
  starTwo: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#FFD089', top: 180, left: 23, opacity: .65 },
  starThree: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', top: 255, right: 20, opacity: .45 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  brandRow: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  pawMoon: { width: 49, height: 49, borderRadius: 25, backgroundColor: COLORS.collar, alignItems: 'center', justifyContent: 'center' },
  brand: { color: COLORS.moon, fontSize: 24, fontWeight: '900', letterSpacing: -.8 },
  tagline: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  bell: { width: 47, height: 47, borderRadius: 24, backgroundColor: COLORS.nightRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  badge: { position: 'absolute', right: 1, top: 1, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 3, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.night },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  collarLocation: { flexDirection: 'row', alignItems: 'center', height: 45, borderRadius: 23, backgroundColor: '#102A23', borderWidth: 2, borderColor: '#245143', marginBottom: 17, paddingRight: 8 },
  collarBuckle: { width: 41, height: 41, borderRadius: 21, backgroundColor: COLORS.collar, alignItems: 'center', justifyContent: 'center' },
  locationText: { flex: 1, marginHorizontal: 10, fontSize: 10, color: COLORS.moon, fontWeight: '800' },
  locate: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#173C31' },
  den: { minHeight: 375, borderTopLeftRadius: 180, borderTopRightRadius: 180, borderBottomLeftRadius: 70, borderBottomRightRadius: 70, paddingHorizontal: 27, paddingTop: 58, paddingBottom: 28, overflow: 'hidden', borderWidth: 2, borderColor: '#245143' },
  denEarLeft: { position: 'absolute', width: 78, height: 105, borderTopLeftRadius: 55, borderTopRightRadius: 55, backgroundColor: '#12382D', left: 35, top: -25, transform: [{ rotate: '-18deg' }] },
  denEarRight: { position: 'absolute', width: 78, height: 105, borderTopLeftRadius: 55, borderTopRightRadius: 55, backgroundColor: '#12382D', right: 35, top: -25, transform: [{ rotate: '18deg' }] },
  denMoon: { position: 'absolute', right: 27, top: 35, width: 49, height: 49, borderRadius: 25, backgroundColor: COLORS.apricot, alignItems: 'center', justifyContent: 'center' },
  denPaws: { position: 'absolute', right: 15, bottom: 68, width: 135, height: 130 },
  mascot: { position: 'absolute', fontSize: 73, right: 25, top: 0 },
  cat: { fontSize: 55, right: 0, top: 67 },
  heroEyebrow: { color: COLORS.collar, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  heroTitle: { color: COLORS.moon, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.3, marginTop: 10, maxWidth: '75%' },
  heroBody: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 11, maxWidth: '64%' },
  boneWrap: { alignSelf: 'flex-start', marginTop: 25, minWidth: 176, height: 56, justifyContent: 'center' },
  boneWrapCompact: { minWidth: 200 },
  boneCore: { zIndex: 2, height: 48, borderRadius: 24, paddingHorizontal: 22, backgroundColor: COLORS.apricot, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  boneLobe: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.apricot, zIndex: 1 },
  boneLT: { left: -7, top: 1 }, boneLB: { left: -7, bottom: 1 }, boneRT: { right: -7, top: 1 }, boneRB: { right: -7, bottom: 1 },
  boneText: { color: COLORS.night, fontSize: 13, fontWeight: '900' },
  bowls: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 20 },
  bowl: { flex: 1, alignItems: 'center', minHeight: 108 },
  bowlRim: { width: 86, height: 68, borderRadius: 43, borderWidth: 3, backgroundColor: COLORS.nightRaised, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  bowlFoot: { width: 60, height: 11, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, marginTop: -7, opacity: .85 },
  bowlValue: { fontSize: 18, fontWeight: '900', color: COLORS.moon, marginTop: -2 },
  bowlLabel: { fontSize: 8, color: COLORS.muted, fontWeight: '800', marginTop: 7, textAlign: 'center' },
  sectionOrbit: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 20 },
  sectionPaw: { width: 43, height: 43, borderRadius: 22, backgroundColor: COLORS.collar, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: COLORS.moon, fontSize: 21, fontWeight: '900' },
  sectionSub: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  filters: { gap: 8, paddingVertical: 15, paddingRight: 10 },
  filterTag: { minWidth: 70, height: 38, paddingHorizontal: 13, borderRadius: 20, backgroundColor: COLORS.nightRaised, borderWidth: 1, borderColor: COLORS.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  filterTagActive: { backgroundColor: COLORS.collar, borderColor: COLORS.collar },
  tagHole: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.night },
  filterText: { color: COLORS.muted, fontSize: 10, fontWeight: '900' },
  filterTextActive: { color: COLORS.night },
  orbitGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  orbit: { width: '48%', alignItems: 'center', paddingVertical: 10, marginBottom: 12 },
  orbitRing: { width: 142, height: 142, borderRadius: 71, borderWidth: 3, borderColor: COLORS.collar, padding: 8, backgroundColor: '#0D241D' },
  orbitRingUrgent: { borderColor: COLORS.coral },
  photoCircle: { flex: 1, borderRadius: 62, overflow: 'hidden', backgroundColor: '#183B31', alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  petEmoji: { fontSize: 54 },
  distanceMoon: { position: 'absolute', right: -5, bottom: 8, minWidth: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.apricot, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.night },
  distance: { color: COLORS.night, fontSize: 8, fontWeight: '900' },
  collarStrap: { marginTop: -3, minWidth: 120, height: 30, borderRadius: 15, backgroundColor: '#214C3F', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 9 },
  collarHole: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.collar },
  collarName: { color: COLORS.moon, fontSize: 12, fontWeight: '900', maxWidth: 74 },
  rescueDesc: { minHeight: 34, color: COLORS.muted, fontSize: 9, lineHeight: 13, textAlign: 'center', marginTop: 8, paddingHorizontal: 5 },
  needLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 },
  needText: { color: COLORS.apricot, fontSize: 8, fontWeight: '900' },
  time: { color: COLORS.muted, fontSize: 7 },
  tagButton: { minWidth: 105, height: 34, borderRadius: 17, marginTop: 9, paddingHorizontal: 12, backgroundColor: COLORS.apricot, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  tagButtonDone: { backgroundColor: COLORS.success },
  tagButtonText: { color: COLORS.night, fontWeight: '900', fontSize: 9 },
  emptyMoon: { width: 285, minHeight: 285, borderRadius: 143, alignSelf: 'center', backgroundColor: COLORS.nightRaised, borderWidth: 2, borderColor: COLORS.line, padding: 34, alignItems: 'center', justifyContent: 'center' },
  emptyPaw: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#173C31', alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: { color: COLORS.moon, fontSize: 16, fontWeight: '900', marginTop: 12 },
  emptyText: { color: COLORS.muted, fontSize: 9, textAlign: 'center', marginTop: 5 },
  safetyCollar: { minHeight: 78, borderRadius: 39, marginTop: 22, backgroundColor: '#102A23', borderWidth: 2, borderColor: '#245143', flexDirection: 'row', gap: 11, alignItems: 'center', padding: 11 },
  shieldCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.collar, alignItems: 'center', justifyContent: 'center' },
  footerTitle: { color: COLORS.moon, fontSize: 12, fontWeight: '900' },
  footerText: { color: COLORS.muted, fontSize: 9, lineHeight: 14, marginTop: 3, paddingRight: 8 },
});
