import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ANIMAL_TIPS, tipOfTheDay } from './animalTips';
import {
  addCommunityPoint,
  CommunityPoint,
  getCommunityPoints,
  getNotificationPreferences,
  getVolunteerPreferences,
  NotificationPreferences,
  refreshCommunityPoint,
  saveNotificationPreferences,
  saveVolunteerPreferences,
  VolunteerPreferences,
} from './communityApi';
import { COLORS, RADII } from './theme';
import { enableSmartNotifications } from './notifications';

type IconName = keyof typeof Ionicons.glyphMap & string;
type PositionLike = {
  latitude: number;
  longitude: number;
  city?: string | null;
  district?: string | null;
} | null;

const DEFAULT_VOLUNTEER: VolunteerPreferences = {
  can_transport: false,
  has_carrier: false,
  can_foster: false,
  can_vet_run: false,
  can_feed: false,
  updated_at: null,
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  radius_m: 3000,
  urgent_only: true,
  cats: true,
  dogs: true,
  updated_at: null,
};

const VOLUNTEER_ITEMS: { key: keyof Omit<VolunteerPreferences, 'updated_at'>; label: string; icon: IconName }[] = [
  { key: 'can_transport', label: 'Aracımla taşıyabilirim', icon: 'car-outline' },
  { key: 'has_carrier', label: 'Taşıma çantam/kafesim var', icon: 'briefcase-outline' },
  { key: 'can_foster', label: 'Geçici yuva olabilirim', icon: 'home-outline' },
  { key: 'can_vet_run', label: 'Veterinere götürebilirim', icon: 'medical-outline' },
  { key: 'can_feed', label: 'Mama-su desteği verebilirim', icon: 'fast-food-outline' },
];

function ToggleCard({ active, icon, label, onPress }: { active: boolean; icon: IconName; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.toggleCard, active && styles.toggleCardActive]}>
    <View style={[styles.toggleIcon, active && styles.toggleIconActive]}><Ionicons name={icon} size={20} color={active ? '#fff' : COLORS.forest} /></View>
    <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{label}</Text>
    <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={active ? COLORS.success : '#A2ADA7'} />
  </Pressable>;
}

function SectionTitle({ icon, title, subtitle }: { icon: IconName; title: string; subtitle: string }) {
  return <View style={styles.sectionTitleRow}>
    <View style={styles.sectionIcon}><Ionicons name={icon} size={19} color={COLORS.coral} /></View>
    <View style={{ flex: 1 }}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSub}>{subtitle}</Text></View>
  </View>;
}

function pointLabel(type: CommunityPoint['point_type']) {
  if (type === 'food') return 'Mama';
  if (type === 'water') return 'Su';
  return 'Mama + Su';
}

function pointIcon(type: CommunityPoint['point_type']): IconName {
  if (type === 'food') return 'fast-food';
  if (type === 'water') return 'water';
  return 'paw';
}

function niceDistance(meters: number) {
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function CommunityHub({ position, reportCount }: { position: PositionLike; reportCount: number }) {
  const daily = useMemo(() => tipOfTheDay(), []);
  const [volunteer, setVolunteer] = useState<VolunteerPreferences>(DEFAULT_VOLUNTEER);
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [points, setPoints] = useState<CommunityPoint[]>([]);
  const [pointNote, setPointNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingVolunteer, setSavingVolunteer] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [addingPoint, setAddingPoint] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [backendReady, setBackendReady] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [vol, prefs] = await Promise.all([getVolunteerPreferences(), getNotificationPreferences()]);
      setVolunteer(vol || DEFAULT_VOLUNTEER);
      setNotifications(prefs || DEFAULT_NOTIFICATIONS);
      if (position) setPoints(await getCommunityPoints(position.latitude, position.longitude, 5000));
      setBackendReady(true);
    } catch {
      setBackendReady(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [position?.latitude, position?.longitude]);

  const openSource = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Kaynak açılamadı', 'Daha sonra tekrar dene.'));

  const saveVolunteer = async () => {
    setSavingVolunteer(true);
    try {
      const { updated_at: _ignore, ...payload } = volunteer;
      setVolunteer(await saveVolunteerPreferences(payload));
      setBackendReady(true);
      Alert.alert('Gönüllü profilin kaydedildi', 'Yardım çağrıları geliştikçe uygun gönüllüler bu becerilere göre eşleştirilebilecek.');
    } catch (error) {
      setBackendReady(false);
      Alert.alert('Kaydedilemedi', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally { setSavingVolunteer(false); }
  };

  const enablePush = async () => {
    setEnablingPush(true);
    try {
      const result = await enableSmartNotifications(position);
      if (!result.enabled) {
        Alert.alert('Bildirim izni verilmedi', 'Akıllı bildirimleri daha sonra cihaz ayarlarından veya bu ekrandan etkinleştirebilirsin.');
        return;
      }
      setPushEnabled(true);
      Alert.alert('Bildirimler hazır 🐾', 'Yakındaki çağrılar tercih ettiğin filtrelere uyduğunda cihazına bildirim gönderilebilecek.');
    } catch (error) {
      Alert.alert('Bildirimler etkinleştirilemedi', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally { setEnablingPush(false); }
  };

  const saveAlerts = async () => {
    setSavingNotifications(true);
    try {
      const { updated_at: _ignore, ...payload } = notifications;
      setNotifications(await saveNotificationPreferences(payload));
      setBackendReady(true);
      Alert.alert('Bildirim tercihlerin kaydedildi', 'Yakınlık ve aciliyet filtresi hesabına kaydedildi.');
    } catch (error) {
      setBackendReady(false);
      Alert.alert('Kaydedilemedi', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally { setSavingNotifications(false); }
  };

  const addPoint = (pointType: CommunityPoint['point_type']) => {
    if (!position) return Alert.alert('Konum gerekli', 'Mama veya su noktası eklemek için önce konum izni ver.');
    Alert.alert(
      'Topluluk noktası ekle',
      `Bulunduğun konuma “${pointLabel(pointType)}” noktası eklensin mi? Bu, kişisel canlı konumun değil gönüllülerin ziyaret edebileceği ortak bir noktadır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ekle',
          onPress: async () => {
            setAddingPoint(true);
            try {
              await addCommunityPoint({ pointType, latitude: position.latitude, longitude: position.longitude, note: pointNote.trim() || null });
              setPointNote('');
              setPoints(await getCommunityPoints(position.latitude, position.longitude, 5000));
              setBackendReady(true);
            } catch (error) {
              setBackendReady(false);
              Alert.alert('Nokta eklenemedi', error instanceof Error ? error.message : 'Tekrar dene.');
            } finally { setAddingPoint(false); }
          },
        },
      ],
    );
  };

  const refreshPoint = async (id: string) => {
    try {
      await refreshCommunityPoint(id);
      if (position) setPoints(await getCommunityPoints(position.latitude, position.longitude, 5000));
    } catch (error) {
      Alert.alert('Güncellenemedi', error instanceof Error ? error.message : 'Tekrar dene.');
    }
  };

  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
    <LinearGradient colors={[COLORS.coralSoft, COLORS.butter, COLORS.mint]} style={styles.hero}>
      <View style={styles.heroBubbleOne} /><View style={styles.heroBubbleTwo} />
      <View style={styles.heroPaw}><Ionicons name="paw" size={30} color="#fff" /></View>
      <Text style={styles.heroEyebrow}>CAN REHBERİ & TOPLULUK</Text>
      <Text style={styles.heroTitle}>Biraz bilgi,{String.fromCharCode(10)}biraz dayanışma. 🐾</Text>
      <Text style={styles.heroText}>Sadece çağrı görmek değil; doğru bilgiyi paylaşmak, gönüllüleri buluşturmak ve mahallendeki canlara düzenli destek olmak için.</Text>
      <View style={styles.heroStats}><View><Text style={styles.heroStatNumber}>{reportCount}</Text><Text style={styles.heroStatLabel}>yakın çağrı</Text></View><View style={styles.heroDivider} /><View><Text style={styles.heroStatNumber}>{points.length}</Text><Text style={styles.heroStatLabel}>mama/su noktası</Text></View></View>
    </LinearGradient>

    {!backendReady && <View style={styles.backendNotice}><Ionicons name="cloud-offline-outline" size={20} color={COLORS.danger} /><Text style={styles.backendNoticeText}>Can Bilgileri kullanılabilir. Topluluk kayıtları için yeni backend migrasyonu henüz etkin değil veya oturum doğrulaması tamamlanmadı.</Text></View>}

    <SectionTitle icon="bulb-outline" title="Bugünün Can Bilgisi" subtitle="Kısa, kaynaklı ve gerçekten işine yarayacak bilgiler" />
    <View style={styles.tipCard}>
      <View style={styles.tipTop}><View style={styles.tipAnimal}><Text style={styles.tipAnimalText}>{daily.animal}</Text></View><View style={styles.tipCategory}><Text style={styles.tipCategoryText}>{daily.category}</Text></View></View>
      <Text style={styles.tipTitle}>{daily.title}</Text>
      <Text style={styles.tipBody}>{daily.body}</Text>
      <View style={styles.tipAction}><Ionicons name="sparkles" size={18} color={COLORS.coral} /><Text style={styles.tipActionText}>{daily.action}</Text></View>
      <Pressable onPress={() => openSource(daily.sourceUrl)} style={styles.sourceButton}><Text style={styles.sourceButtonText}>Kaynak: {daily.sourceLabel}</Text><Ionicons name="open-outline" size={14} color={COLORS.forest} /></Pressable>
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tipRail}>
      {ANIMAL_TIPS.filter(x => x.id !== daily.id).slice(0, 6).map(tip => <Pressable key={tip.id} onPress={() => Alert.alert(tip.title, `${tip.body}\n\nNe yapmalı? ${tip.action}`, [{ text: 'Kapat' }, { text: 'Kaynağı aç', onPress: () => openSource(tip.sourceUrl) }])} style={styles.smallTip}>
        <View style={[styles.smallTipIcon, { backgroundColor: tip.category === 'Acil' ? COLORS.coralSoft : tip.category === 'Davranış' ? COLORS.lilac : COLORS.sky }]}><Ionicons name={tip.animal === 'Kedi' ? 'paw' : tip.animal === 'Köpek' ? 'heart' : 'leaf'} size={19} color={COLORS.forest} /></View>
        <Text style={styles.smallTipMeta}>{tip.animal} • {tip.category}</Text><Text numberOfLines={3} style={styles.smallTipTitle}>{tip.title}</Text>
      </Pressable>)}
    </ScrollView>

    <SectionTitle icon="medkit-outline" title="İlk 10 dakika" subtitle="Yaralı veya korkmuş bir can gördüğünde güvenli başlangıç" />
    <View style={styles.firstAidCard}>
      {[
        ['1', 'Önce çevre güvenliği', 'Trafik, kalabalık veya saldırı riski varsa kendini ve hayvanı daha büyük tehlikeye sokma.'],
        ['2', 'Beden dilini oku', 'Korkmuş hayvanın kaçış alanını kapatma; ani temas ve zorla yakalamadan kaçın.'],
        ['3', 'Konumu ve durumu kaydet', 'Güvenli mesafeden fotoğraf, yaklaşık konum ve görülen belirtileri not et.'],
        ['4', 'Profesyonel destek çağır', 'Acil durumda veteriner/yerel yetkili desteğini geciktirme; bilinmeyen ilaç veya yiyecek verme.'],
      ].map(([n, title, text]) => <View key={n} style={styles.aidRow}><View style={styles.aidNumber}><Text style={styles.aidNumberText}>{n}</Text></View><View style={{ flex: 1 }}><Text style={styles.aidTitle}>{title}</Text><Text style={styles.aidText}>{text}</Text></View></View>)}
      <Text style={styles.disclaimer}>Bu bölüm veteriner tanısı veya tedavisinin yerine geçmez.</Text>
    </View>

    <SectionTitle icon="people-outline" title="Gönüllü rozetlerin" subtitle="Neye yardımcı olabileceğini seç; gerektiğinde doğru kişi bulunsun" />
    <View style={styles.grid}>
      {VOLUNTEER_ITEMS.map(item => <ToggleCard key={item.key} icon={item.icon} label={item.label} active={Boolean(volunteer[item.key])} onPress={() => setVolunteer(v => ({ ...v, [item.key]: !v[item.key] }))} />)}
    </View>
    <Pressable onPress={saveVolunteer} disabled={savingVolunteer} style={styles.saveButton}>{savingVolunteer ? <ActivityIndicator color="#fff" /> : <><Ionicons name="heart" size={18} color="#fff" /><Text style={styles.saveButtonText}>Gönüllü profilini kaydet</Text></>}</Pressable>

    <SectionTitle icon="notifications-outline" title="Akıllı bildirim tercihleri" subtitle="Sadece ilgilenebileceğin çağrılar öne çıksın" />
    <View style={styles.settingsCard}>
      <Text style={styles.settingLabel}>Yakınlık yarıçapı</Text>
      <View style={styles.radiusRow}>{[1000, 3000, 5000, 10000].map(m => <Pressable key={m} onPress={() => setNotifications(v => ({ ...v, radius_m: m }))} style={[styles.radiusPill, notifications.radius_m === m && styles.radiusPillActive]}><Text style={[styles.radiusText, notifications.radius_m === m && styles.radiusTextActive]}>{m < 1000 ? m + ' m' : m / 1000 + ' km'}</Text></Pressable>)}</View>
      <ToggleCard active={notifications.urgent_only} icon="alert-circle-outline" label="Yalnızca yüksek öncelikli çağrılar" onPress={() => setNotifications(v => ({ ...v, urgent_only: !v.urgent_only }))} />
      <View style={styles.speciesRow}><Pressable onPress={() => setNotifications(v => ({ ...v, cats: !v.cats }))} style={[styles.speciesPill, notifications.cats && styles.speciesPillActive]}><Ionicons name="paw" size={17} color={notifications.cats ? '#fff' : COLORS.forest} /><Text style={[styles.speciesText, notifications.cats && { color: '#fff' }]}>Kedi</Text></Pressable><Pressable onPress={() => setNotifications(v => ({ ...v, dogs: !v.dogs }))} style={[styles.speciesPill, notifications.dogs && styles.speciesPillActive]}><Ionicons name="heart" size={17} color={notifications.dogs ? '#fff' : COLORS.forest} /><Text style={[styles.speciesText, notifications.dogs && { color: '#fff' }]}>Köpek</Text></Pressable></View>
      <Pressable onPress={saveAlerts} disabled={savingNotifications} style={styles.secondarySave}>{savingNotifications ? <ActivityIndicator color={COLORS.forest} /> : <Text style={styles.secondarySaveText}>Tercihleri kaydet</Text>}</Pressable>
      <Pressable onPress={enablePush} disabled={enablingPush || pushEnabled} style={[styles.pushButton, pushEnabled && styles.pushButtonDone]}>{enablingPush ? <ActivityIndicator color="#fff" /> : <><Ionicons name={pushEnabled ? "checkmark-circle" : "notifications"} size={18} color="#fff" /><Text style={styles.pushButtonText}>{pushEnabled ? 'Bildirimler etkin' : 'Cihaz bildirimlerini etkinleştir'}</Text></>}</Pressable>
    </View>

    <SectionTitle icon="water-outline" title="Mama & su noktaları" subtitle={position ? ([position.district, position.city].filter(Boolean).join(' • ') || 'Yakınındaki ortak noktalar') : 'Konum açıldığında yakındaki noktalar görünür'} />
    <View style={styles.pointCreate}>
      <TextInput value={pointNote} onChangeText={setPointNote} placeholder="İsteğe bağlı not: park girişi, mavi kap yanı..." placeholderTextColor="#93A098" maxLength={160} style={styles.pointInput} />
      <View style={styles.pointButtons}>
        {([['food', 'fast-food-outline', 'Mama'], ['water', 'water-outline', 'Su'], ['food_water', 'paw-outline', 'İkisi']] as const).map(([type, icon, label]) => <Pressable key={type} disabled={addingPoint} onPress={() => addPoint(type)} style={styles.pointButton}><Ionicons name={icon} size={18} color={COLORS.forest} /><Text style={styles.pointButtonText}>{label}</Text></Pressable>)}
      </View>
    </View>
    {loading ? <ActivityIndicator style={{ marginVertical: 22 }} color={COLORS.coral} /> : points.length ? points.map(point => <View key={point.id} style={styles.pointCard}><View style={styles.pointIcon}><Ionicons name={pointIcon(point.point_type)} size={21} color={COLORS.forest} /></View><View style={{ flex: 1 }}><Text style={styles.pointTitle}>{pointLabel(point.point_type)} noktası • {niceDistance(point.distance_m)}</Text><Text style={styles.pointText}>{point.note || 'Topluluk tarafından işaretlenen ortak destek noktası'}</Text></View><Pressable onPress={() => refreshPoint(point.id)} style={styles.refreshButton}><Ionicons name="refresh" size={17} color={COLORS.success} /><Text style={styles.refreshText}>Taze</Text></Pressable></View>) : <View style={styles.empty}><Ionicons name="leaf-outline" size={27} color={COLORS.forest} /><Text style={styles.emptyTitle}>Yakında işaretli nokta yok</Text><Text style={styles.emptyText}>İlk güvenilir mama veya su noktasını sen ekleyebilirsin.</Text></View>}

    <View style={styles.footerCard}><Ionicons name="shield-checkmark" size={23} color={COLORS.forest} /><View style={{ flex: 1 }}><Text style={styles.footerTitle}>Güvenli paylaşım</Text><Text style={styles.footerText}>Yardım çağrılarında yaklaşık konum seçeneğiyle hassas noktalar herkese birebir gösterilmeyecek. Mükerrer çağrılar da aynı bölgede ve kısa zaman aralığında tespit edilerek kullanıcı uyarılacak.</Text></View></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 42, backgroundColor: COLORS.cream },
  hero: { borderRadius: 30, padding: 23, overflow: 'hidden', borderWidth: 1, borderColor: '#F6DDCF' },
  heroBubbleOne: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -55, top: -70, backgroundColor: 'rgba(255,255,255,.35)' },
  heroBubbleTwo: { position: 'absolute', width: 110, height: 110, borderRadius: 55, left: -38, bottom: -55, backgroundColor: 'rgba(255,255,255,.28)' },
  heroPaw: { width: 54, height: 54, borderRadius: 20, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  heroEyebrow: { fontSize: 10, letterSpacing: 1.4, fontWeight: '900', color: COLORS.coral },
  heroTitle: { fontSize: 30, lineHeight: 35, fontWeight: '900', color: COLORS.forestDark, letterSpacing: -.8, marginTop: 7 },
  heroText: { color: '#5D716A', fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: '95%' },
  heroStats: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroStatNumber: { fontSize: 23, fontWeight: '900', color: COLORS.forest },
  heroStatLabel: { fontSize: 9, color: COLORS.muted, fontWeight: '700' },
  heroDivider: { width: 1, height: 32, backgroundColor: '#DCCFC1' },
  backendNotice: { marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: '#FFF0ED', flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  backendNoticeText: { flex: 1, fontSize: 10, lineHeight: 15, color: '#8B5149' },
  sectionTitleRow: { flexDirection: 'row', gap: 11, alignItems: 'center', marginTop: 28, marginBottom: 12 },
  sectionIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: COLORS.coralSoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: COLORS.forestDark },
  sectionSub: { fontSize: 10, lineHeight: 15, color: COLORS.muted, marginTop: 2 },
  tipCard: { backgroundColor: COLORS.paper, borderRadius: RADII.lg, padding: 18, borderWidth: 1, borderColor: COLORS.line },
  tipTop: { flexDirection: 'row', gap: 7 },
  tipAnimal: { backgroundColor: COLORS.sage, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tipAnimalText: { fontSize: 9, fontWeight: '900', color: COLORS.forest },
  tipCategory: { backgroundColor: COLORS.coralSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tipCategoryText: { fontSize: 9, fontWeight: '900', color: COLORS.coral },
  tipTitle: { fontSize: 20, lineHeight: 25, fontWeight: '900', color: COLORS.forestDark, marginTop: 13 },
  tipBody: { fontSize: 12, lineHeight: 19, color: '#64736D', marginTop: 8 },
  tipAction: { marginTop: 13, padding: 12, borderRadius: 15, backgroundColor: COLORS.cream, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  tipActionText: { flex: 1, fontSize: 10, lineHeight: 16, color: COLORS.forest, fontWeight: '700' },
  sourceButton: { marginTop: 12, flexDirection: 'row', gap: 5, alignItems: 'center' },
  sourceButtonText: { color: COLORS.forest, fontWeight: '800', fontSize: 9, textDecorationLine: 'underline' },
  tipRail: { gap: 10, paddingVertical: 10, paddingRight: 10 },
  smallTip: { width: 170, minHeight: 145, backgroundColor: COLORS.paper, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, padding: 14 },
  smallTipIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  smallTipMeta: { marginTop: 10, color: COLORS.coral, fontSize: 8, fontWeight: '900' },
  smallTipTitle: { marginTop: 5, color: COLORS.forestDark, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  firstAidCard: { backgroundColor: COLORS.paper, borderRadius: 24, borderWidth: 1, borderColor: COLORS.line, padding: 16 },
  aidRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'flex-start' },
  aidNumber: { width: 30, height: 30, borderRadius: 12, backgroundColor: COLORS.butter, alignItems: 'center', justifyContent: 'center' },
  aidNumberText: { fontWeight: '900', color: COLORS.forest },
  aidTitle: { color: COLORS.forestDark, fontSize: 12, fontWeight: '900' },
  aidText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  disclaimer: { marginTop: 10, fontSize: 9, color: '#8B756A', fontStyle: 'italic' },
  grid: { gap: 8 },
  toggleCard: { minHeight: 55, backgroundColor: COLORS.paper, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleCardActive: { backgroundColor: COLORS.mint, borderColor: '#CDE4D8' },
  toggleIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: COLORS.sage, alignItems: 'center', justifyContent: 'center' },
  toggleIconActive: { backgroundColor: COLORS.forest },
  toggleLabel: { flex: 1, fontSize: 11, fontWeight: '800', color: COLORS.forest },
  toggleLabelActive: { color: COLORS.forestDark },
  saveButton: { marginTop: 10, height: 52, borderRadius: 17, backgroundColor: COLORS.coral, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  settingsCard: { backgroundColor: COLORS.paper, borderRadius: 24, borderWidth: 1, borderColor: COLORS.line, padding: 15, gap: 9 },
  settingLabel: { fontSize: 10, fontWeight: '900', color: COLORS.forest },
  radiusRow: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginBottom: 3 },
  radiusPill: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.cream },
  radiusPillActive: { backgroundColor: COLORS.forest, borderColor: COLORS.forest },
  radiusText: { fontSize: 10, fontWeight: '800', color: COLORS.forest },
  radiusTextActive: { color: '#fff' },
  speciesRow: { flexDirection: 'row', gap: 8 },
  speciesPill: { flex: 1, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', padding: 11, borderRadius: 15, backgroundColor: COLORS.cream, borderWidth: 1, borderColor: COLORS.line },
  speciesPillActive: { backgroundColor: COLORS.coral, borderColor: COLORS.coral },
  speciesText: { color: COLORS.forest, fontWeight: '900', fontSize: 11 },
  secondarySave: { minHeight: 44, marginTop: 4, borderRadius: 14, backgroundColor: COLORS.sage, alignItems: 'center', justifyContent: 'center' },
  secondarySaveText: { color: COLORS.forest, fontWeight: '900', fontSize: 11 },
  pushButton: { minHeight: 46, marginTop: 2, borderRadius: 14, backgroundColor: COLORS.coral, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  pushButtonDone: { backgroundColor: COLORS.success },
  pushButtonText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  pointCreate: { backgroundColor: COLORS.paper, borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, padding: 13, marginBottom: 10 },
  pointInput: { height: 48, borderRadius: 14, backgroundColor: COLORS.cream, paddingHorizontal: 12, color: COLORS.forest, fontSize: 11, borderWidth: 1, borderColor: COLORS.line },
  pointButtons: { flexDirection: 'row', gap: 7, marginTop: 9 },
  pointButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: COLORS.sage, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pointButtonText: { fontSize: 9, fontWeight: '900', color: COLORS.forest },
  pointCard: { backgroundColor: COLORS.paper, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: COLORS.line, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 },
  pointIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: COLORS.sky, alignItems: 'center', justifyContent: 'center' },
  pointTitle: { fontSize: 11, fontWeight: '900', color: COLORS.forestDark },
  pointText: { fontSize: 9, lineHeight: 14, color: COLORS.muted, marginTop: 2 },
  refreshButton: { alignItems: 'center', padding: 5 },
  refreshText: { fontSize: 8, fontWeight: '900', color: COLORS.success },
  empty: { alignItems: 'center', padding: 22, backgroundColor: COLORS.paper, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line },
  emptyTitle: { fontSize: 12, fontWeight: '900', color: COLORS.forest, marginTop: 7 },
  emptyText: { fontSize: 9, lineHeight: 14, color: COLORS.muted, textAlign: 'center', marginTop: 4 },
  footerCard: { marginTop: 24, backgroundColor: COLORS.sage, borderRadius: 22, padding: 15, flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  footerTitle: { fontSize: 12, fontWeight: '900', color: COLORS.forest },
  footerText: { fontSize: 9, lineHeight: 15, color: '#557068', marginTop: 3 },
});
