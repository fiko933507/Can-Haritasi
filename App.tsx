import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  acceptTerms,
  authClient,
  blockReportAuthor,
  createAnimalReport,
  DELETE_ACCOUNT_URL,
  ensureProfile,
  fetchNearbyReports,
  getDownloadUrl,
  getMyProfile,
  markHelp,
  NearbyReport,
  NEON_AUTH_URL,
  PRIVACY_URL,
  Profile,
  reportContent,
  requestMyAccountDeletion,
  TERMS_URL,
  TERMS_VERSION,
  uploadReportImage,
} from './src/backend';
import { CommunityHub } from './src/CommunityHub';
import { findPotentialDuplicates, getReportTimeline, PotentialDuplicate } from './src/communityApi';
import { dispatchSmartNotifications } from './src/notifications';
import { PlayfulHome } from './src/PlayfulHome';
import { NotificationCenter } from './src/NotificationCenter';

declare const require: (moduleName: string) => any;

type Tab = 'home' | 'map' | 'report' | 'community' | 'profile' | 'notifications';
type Need = 'Mama' | 'Su' | 'Veteriner' | 'Güvenli alan';
type AnimalType = 'Kedi' | 'Köpek' | 'Diğer';
type IconName = keyof typeof Ionicons.glyphMap & string;
type Position = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  city: string | null;
  district: string | null;
};
type PickedPhoto = { uri: string; mimeType: string | null; width: number | null; height: number | null };

// Can Haritası v1.5: moonlit rescue identity, fully separated from VELTRAI.
const GREEN = '#EAF8F1';
const MINT = '#17342C';
const CORAL = '#FF6258';
const CREAM = '#071612';
const SCREEN = Dimensions.get('window').width;
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const needIcon: Record<Need, IconName> = {
  Mama: 'fast-food',
  Su: 'water',
  Veteriner: 'medical',
  'Güvenli alan': 'home',
};

const needColor: Record<Need, string> = {
  Mama: '#FFF0D6',
  Su: '#DDF5F0',
  Veteriner: '#FFE1DC',
  'Güvenli alan': '#EEE3FF',
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

async function readCurrentPosition(): Promise<Position> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Yakındaki çağrıları göstermek için konum izni gerekiyor.');
  const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  let city: string | null = null;
  let district: string | null = null;
  try {
    const [address] = await Location.reverseGeocodeAsync({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    });
    city = address?.city || address?.region || null;
    district = address?.district || address?.subregion || address?.name || null;
  } catch {
    // Coordinates are enough to publish a report even if reverse geocoding is unavailable.
  }
  return {
    latitude: current.coords.latitude,
    longitude: current.coords.longitude,
    accuracy: current.coords.accuracy,
    city,
    district,
  };
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 8 || (mode === 'register' && (!name.trim() || !accepted))) {
      Alert.alert('Eksik bilgi', mode === 'register' ? 'Ad, geçerli e-posta, en az 8 karakterlik şifre ve şartlar onayı gerekiyor.' : 'Geçerli e-posta ve en az 8 karakterlik şifre gir.');
      return;
    }
    setBusy(true);
    try {
      const result = mode === 'register'
        ? await authClient.signUp.email({ email: normalizedEmail, password, name: name.trim() })
        : await authClient.signIn.email({ email: normalizedEmail, password });
      if (result.error) throw new Error(result.error.message || 'Giriş yapılamadı.');
      if (mode === 'register') { try { await acceptTerms(TERMS_VERSION); } catch { /* AppInner will request acceptance again if persistence fails. */ } }
    } catch (error) {
      Alert.alert('Oturum açılamadı', error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  };

  return <KeyboardAvoidingView style={styles.authOuter} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <SafeAreaView style={styles.authSafe}>
      <View style={styles.authBrand}>
        <View style={styles.authLogo}><Ionicons name="paw" size={30} color="#fff" /></View>
        <Text style={styles.authTitle}>Can Haritası<Text style={{ color: CORAL }}>.</Text></Text>
        <Text style={styles.authSubtitle}>Yakındaki bir canı görünür kıl. Yardımı doğru kişiye ulaştır.</Text>
      </View>
      <View style={styles.authCard}>
        <View style={styles.authTabs}>
          <Pressable onPress={() => setMode('login')} style={[styles.authTab, mode === 'login' && styles.authTabActive]}><Text style={[styles.authTabText, mode === 'login' && styles.authTabTextActive]}>Giriş</Text></Pressable>
          <Pressable onPress={() => setMode('register')} style={[styles.authTab, mode === 'register' && styles.authTabActive]}><Text style={[styles.authTabText, mode === 'register' && styles.authTabTextActive]}>Kayıt ol</Text></Pressable>
        </View>
        {mode === 'register' && <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Adın" placeholderTextColor="#8C9591" autoCapitalize="words" />}
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="E-posta" placeholderTextColor="#8C9591" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Şifre (en az 8 karakter)" placeholderTextColor="#8C9591" secureTextEntry autoCapitalize="none" />
        {mode === 'register' && <View style={styles.termsBox}><Pressable onPress={() => setAccepted(v => !v)} style={styles.checkRow}><Ionicons name={accepted ? 'checkbox' : 'square-outline'} size={22} color={accepted ? GREEN : '#7B847F'} /><Text style={styles.checkText}>Kullanım Şartları ve Topluluk Kuralları'nı kabul ediyorum.</Text></Pressable><View style={styles.legalLinks}><Pressable onPress={() => Linking.openURL(TERMS_URL)}><Text style={styles.legalLink}>Şartları oku</Text></Pressable><Text style={styles.legalDot}>•</Text><Pressable onPress={() => Linking.openURL(PRIVACY_URL)}><Text style={styles.legalLink}>Gizlilik Politikası</Text></Pressable></View></View>}
        <Pressable disabled={busy} onPress={submit} style={[styles.authButton, busy && { opacity: .65 }]}>{busy ? <ActivityIndicator color="#fff" /> : <><Text style={styles.authButtonText}>{mode === 'login' ? 'Giriş yap' : 'Hesabımı oluştur'}</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}</Pressable>
        <View style={styles.privacyRow}><Ionicons name="shield-checkmark" size={17} color={GREEN} /><Text style={styles.privacyText}>Canlı konumun yayınlanmaz. Yalnızca oluşturduğun yardım çağrısının konumu kaydedilir.</Text></View>
      </View>
    </SafeAreaView>
  </KeyboardAvoidingView>;
}

function IconButton({ name, onPress }: { name: IconName; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={styles.iconButton}><Ionicons name={name} size={21} color={GREEN} /></Pressable>;
}

function Header({ place, initial }: { place: string; initial: string }) {
  return <View style={styles.header}>
    <View><Text style={styles.eyebrow}>{place.toLocaleUpperCase('tr-TR')}</Text><Text style={styles.logo}>Can Haritası<Text style={{ color: CORAL }}>.</Text></Text></View>
    <View style={styles.headerActions}><IconButton name="notifications-outline" /><View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View></View>
  </View>;
}

function Pill({ text, active, onPress }: { text: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}><Text style={[styles.pillText, active && { color: '#fff' }]}>{text}</Text></Pressable>;
}

function ReportCard({ report, onHelp, onModerated }: { report: NearbyReport; onHelp: (id: string) => Promise<void>; onModerated?: () => Promise<void> }) {
  const [helped, setHelped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [timelineBusy, setTimelineBusy] = useState(false);
  const need = (['Mama', 'Su', 'Veteriner', 'Güvenli alan'].includes(report.condition) ? report.condition : 'Veteriner') as Need;

  useEffect(() => {
    let active = true;
    setImageUrl(null);
    if (!report.image_key) return () => { active = false; };
    getDownloadUrl(report.image_key)
      .then(result => { if (active) setImageUrl(result.downloadUrl); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [report.image_key]);

  const help = async () => {
    if (helped || busy) return;
    setBusy(true);
    try { await onHelp(report.id); setHelped(true); }
    catch (error) { Alert.alert('Destek kaydedilemedi', error instanceof Error ? error.message : 'Tekrar dene.'); }
    finally { setBusy(false); }
  };

  const reportAbuse = () => Alert.alert('Çağrıyı bildir', 'Bu çağrının Topluluk Kuralları’na aykırı, yanıltıcı veya uygunsuz olduğunu düşünüyor musun?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Bildir', style: 'destructive', onPress: async () => { try { await reportContent(report.id); Alert.alert('Teşekkürler', 'Bildirimin inceleme kuyruğuna alındı.'); } catch (error) { Alert.alert('Bildirim gönderilemedi', error instanceof Error ? error.message : 'Tekrar dene.'); } } }]);

  const openTimeline = async () => {
    if (timelineBusy) return;
    setTimelineBusy(true);
    try {
      const events = await getReportTimeline(report.id);
      const labels: Record<string, string> = {
        reported: 'Çağrı oluşturuldu',
        help_on_the_way: 'Bir gönüllü yola çıktı',
        in_progress: 'Destek sürüyor',
        resolved: 'Çözüldü',
      };
      const body = events.length
        ? events.map((event, index) => `${index + 1}. ${labels[event.event_type] || event.event_type} • ${relativeTime(event.created_at)}${event.note ? `\n${event.note}` : ''}`).join('\n\n')
        : 'Bu vaka için henüz zaman çizelgesi kaydı yok.';
      Alert.alert('Vaka geçmişi', body);
    } catch (error) {
      Alert.alert('Vaka geçmişi alınamadı', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally { setTimelineBusy(false); }
  };

  const blockAuthor = () => Alert.alert('Kullanıcıyı engelle', 'Bu kullanıcının çağrılarını artık görmek istemediğine emin misin?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Engelle', style: 'destructive', onPress: async () => { try { await blockReportAuthor(report.id); await onModerated?.(); Alert.alert('Engellendi', 'Bu kullanıcının çağrıları artık listenden gizlenecek.'); } catch (error) { Alert.alert('Engellenemedi', error instanceof Error ? error.message : 'Tekrar dene.'); } } }]);
  return <View style={styles.caseCard}>
    <View style={[styles.caseImage, { backgroundColor: needColor[need] }]}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.casePhoto} /> : <Ionicons name={needIcon[need]} size={34} color={GREEN} />}
      <View style={styles.verified}><Ionicons name="checkmark" size={11} color="#fff" /></View>
    </View>
    <View style={styles.caseBody}>
      <View style={styles.caseTop}><Text style={styles.caseName}>{report.animal_type}</Text><Text style={styles.distance}>{humanDistance(report.distance_m)}</Text></View>
      <Text numberOfLines={2} style={styles.caseType}>{report.title || report.description || report.condition} · <Text style={{ color: CORAL }}>{report.condition}</Text></Text>
      <View style={styles.urgencyRow}>{Array.from({ length: 5 }).map((_, i) => <View key={i} style={[styles.urgencyDot, i < report.urgency && { backgroundColor: CORAL }]} />)}</View>
      <View style={styles.statusRow}><View style={[styles.statusDot, report.status === 'in_progress' && styles.statusDotActive]} /><Text style={styles.statusText}>{report.status === 'in_progress' ? 'Destek sürüyor' : 'Yeni çağrı'}</Text></View>
      <View style={styles.moderationRow}><Pressable onPress={openTimeline}><Text style={styles.moderationText}>{timelineBusy ? 'Yükleniyor…' : 'Vaka geçmişi'}</Text></Pressable><Text style={styles.moderationSep}>•</Text><Pressable onPress={reportAbuse}><Text style={styles.moderationText}>Bildir</Text></Pressable><Text style={styles.moderationSep}>•</Text><Pressable onPress={blockAuthor}><Text style={styles.moderationText}>Engelle</Text></Pressable></View>
      <View style={styles.caseBottom}><Text style={styles.time}>{relativeTime(report.created_at)}</Text><Pressable onPress={help} style={[styles.miniButton, helped && styles.miniButtonDone]}>{busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.miniButtonText, helped && { color: GREEN }]}>{helped ? 'Yoldayım ✓' : 'Destek ol'}</Text>}</Pressable></View>
    </View>
  </View>;
}
function EmptyNearby({ refresh, loading }: { refresh: () => void; loading: boolean }) {
  return <View style={styles.emptyCard}><Ionicons name="paw-outline" size={34} color={GREEN} /><Text style={styles.emptyTitle}>Yakınında açık çağrı görünmüyor</Text><Text style={styles.emptyText}>Konumunu yenileyebilir veya ihtiyaç gören ilk kişi sen olabilirsin.</Text><Pressable onPress={refresh} style={styles.outlineButton}>{loading ? <ActivityIndicator color={GREEN} /> : <Text style={styles.outlineButtonText}>Konumu yenile</Text>}</Pressable></View>;
}

function Home({ reports, loading, position, refresh, goReport, userName, onHelp, onModerated }: {
  reports: NearbyReport[]; loading: boolean; position: Position | null; refresh: () => void; goReport: () => void; userName: string; onHelp: (id: string) => Promise<void>; onModerated: () => Promise<void>;
}) {
  const [filter, setFilter] = useState('Yakınımda');
  const filtered = useMemo(() => reports.filter(r => filter === 'Yakınımda' || (filter === 'Acil' ? r.urgency >= 4 : r.condition === filter)), [reports, filter]);
  const place = [position?.district, position?.city].filter(Boolean).join(' • ') || 'Konum bekleniyor';
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
    <Header place={place} initial={(userName || 'C').slice(0, 1).toUpperCase()} />
    <LinearGradient colors={[GREEN, '#143A5B', '#205E87']} style={styles.hero}>
      <View style={styles.heroGlow} />
      <View style={styles.heroPawBubble}><Ionicons name="paw" size={24} color="rgba(255,255,255,.9)" /></View>
      <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>CAN HARİTASI • SAHA AĞI</Text></View>
      <Text style={styles.heroTitle}>{loading ? 'Yakındaki canları\narıyoruz…' : `${reports.length} canın sana\nyakınında desteğe ihtiyacı var.`}</Text>
      <Text style={styles.heroBody}>Konum yalnızca yakın çağrıları bulmak için kullanılır. Yardım çağrısı oluşturmadıkça paylaşılmaz.</Text>
      <Pressable style={styles.heroButton} onPress={goReport}><Text style={styles.heroButtonText}>Yardım çağrısı oluştur</Text><Ionicons name="arrow-forward" size={18} color={GREEN} /></Pressable>
    </LinearGradient>
    <View style={styles.statsRow}>
      <View style={styles.stat}><Text style={styles.statValue}>{reports.length}</Text><Text style={styles.statLabel}>Yakındaki açık çağrı</Text></View><View style={styles.statDivider} />
      <View style={styles.stat}><Text style={styles.statValue}>{reports.filter(r => r.urgency >= 4).length}</Text><Text style={styles.statLabel}>Yüksek öncelik</Text></View><View style={styles.statDivider} />
      <Pressable style={styles.stat} onPress={refresh}><Ionicons name="locate" size={20} color={GREEN} /><Text style={styles.statLabel}>Konumu yenile</Text></Pressable>
    </View>
    <View style={styles.sectionHead}><View><Text style={styles.sectionTitle}>Yakındaki çağrılar</Text><Text style={styles.sectionSub}>Gerçek veritabanından, mesafeye göre</Text></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{['Yakınımda', 'Acil', 'Mama', 'Veteriner'].map(x => <Pill key={x} text={x} active={filter === x} onPress={() => setFilter(x)} />)}</ScrollView>
    {loading && reports.length === 0 ? <ActivityIndicator style={{ marginVertical: 40 }} color={GREEN} /> : filtered.length ? filtered.map(r => <ReportCard key={r.id} report={r} onHelp={onHelp} onModerated={onModerated} />) : <EmptyNearby refresh={refresh} loading={loading} />}
    <View style={styles.trustCard}><View style={styles.trustIcon}><Ionicons name="shield-checkmark" size={24} color={GREEN} /></View><View style={{ flex: 1 }}><Text style={styles.trustTitle}>Gizlilik önce gelir</Text><Text style={styles.trustText}>Kişisel canlı konum yayınlanmaz; kayıtlar kullanıcı oturumu ve veritabanı erişim kurallarıyla korunur.</Text></View></View>
  </ScrollView>;
}

function MapScreen({ reports, position, onHelp, onModerated }: { reports: NearbyReport[]; position: Position | null; onHelp: (id: string) => Promise<void>; onModerated: () => Promise<void> }) {
  const { Map: MapLibreMap, Camera, Marker } = require('@maplibre/maplibre-react-native') as typeof import('@maplibre/maplibre-react-native');
  const [selected, setSelected] = useState(0);
  const active = reports[selected] || reports[0];
  const place = [position?.district, position?.city].filter(Boolean).join(', ') || 'Konum bekleniyor';
  const center: [number, number] = active
    ? [active.longitude, active.latitude]
    : position
      ? [position.longitude, position.latitude]
      : [28.9784, 41.0082];

  return <View style={{ flex: 1, backgroundColor: '#E7E4DC' }}>
    <SafeAreaView edges={['top']} style={styles.mapSafe}><View style={styles.mapHeader}><IconButton name="search" /><View style={styles.locationPill}><Ionicons name="location" size={16} color={CORAL} /><Text numberOfLines={1} style={styles.locationText}>{place}</Text></View><IconButton name="options-outline" /></View></SafeAreaView>
    <View style={styles.realMapWrap}>
      <MapLibreMap style={styles.realMap} mapStyle={MAP_STYLE} attribution logo>
        <Camera center={center} zoom={active ? 14 : 13} duration={600} easing="ease" />
        {position && <Marker id="me" lngLat={[position.longitude, position.latitude]} anchor="center"><View style={styles.youMarkerReal}><View style={styles.youCore} /></View></Marker>}
        {reports.slice(0, 60).map((item, i) => {
          const need = (item.condition in needIcon ? item.condition : 'Veteriner') as Need;
          const isActive = selected === i;
          return <Marker key={item.id} id={item.id} lngLat={[item.longitude, item.latitude]} anchor="bottom" onPress={() => setSelected(i)}>
            <View style={[styles.mapPin, isActive && styles.mapPinActive]}><Ionicons name={needIcon[need]} size={18} color={isActive ? '#fff' : GREEN} /></View>
          </Marker>;
        })}
      </MapLibreMap>
      {!position && reports.length === 0 && <View style={styles.mapLoadingOverlay}><ActivityIndicator color={GREEN} /><Text style={styles.mapLoadingText}>Konum ve çağrılar yükleniyor…</Text></View>}
    </View>
    <View style={styles.mapSheet}><View style={styles.handle} /><Text style={styles.mapCount}>Yakınında {reports.length} aktif çağrı</Text>{active ? <ReportCard report={active} onHelp={onHelp} onModerated={onModerated} /> : <Text style={styles.emptyText}>Henüz gösterilecek çağrı yok.</Text>}</View>
  </View>;
}
function ReportScreen({ defaultPosition, onPublished }: { defaultPosition: Position | null; onPublished: () => Promise<void> }) {
  const needs: Need[] = ['Mama', 'Su', 'Veteriner', 'Güvenli alan'];
  const animals: AnimalType[] = ['Kedi', 'Köpek', 'Diğer'];
  const [step, setStep] = useState(1);
  const [need, setNeed] = useState<Need>('Veteriner');
  const [animalType, setAnimalType] = useState<AnimalType>('Kedi');
  const [note, setNote] = useState('');
  const [position, setPosition] = useState<Position | null>(defaultPosition);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [locationVisibility, setLocationVisibility] = useState<'approximate' | 'exact'>('approximate');
  const [duplicate, setDuplicate] = useState<PotentialDuplicate | null>(null);

  const chooseLocation = async () => {
    try { setBusy(true); setPosition(await readCurrentPosition()); }
    catch (error) { Alert.alert('Konum alınamadı', error instanceof Error ? error.message : 'Tekrar dene.'); }
    finally { setBusy(false); }
  };

  const pickPhoto = async (camera: boolean) => {
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Fotoğraf çekmek için kamera izni gerekiyor.');
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error('Fotoğraf seçmek için galeri izni gerekiyor.');
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: .75, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .75, allowsEditing: false });
      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        setPhoto({ uri: a.uri, mimeType: a.mimeType || null, width: a.width || null, height: a.height || null });
      }
    } catch (error) { Alert.alert('Fotoğraf eklenemedi', error instanceof Error ? error.message : 'Tekrar dene.'); }
  };

  const publish = async () => {
    if (!position) { Alert.alert('Konum gerekli', 'Çağrıyı yayınlamadan önce olay konumunu al.'); setStep(2); return; }
    if (!note.trim()) { Alert.alert('Kısa not gerekli', 'Hayvanın durumunu en az birkaç kelimeyle anlat.'); setStep(1); return; }
    setBusy(true);
    try {
      const report = await createAnimalReport({ animalType, need, note: note.trim(), latitude: position.latitude, longitude: position.longitude, accuracyM: position.accuracy, city: position.city, district: position.district, locationVisibility });
      if (photo) {
        try { await uploadReportImage({ reportId: report.id, ...photo }); }
        catch (error) { Alert.alert('Çağrı yayınlandı, fotoğraf bekliyor', error instanceof Error ? error.message : 'Fotoğraf daha sonra tekrar yüklenebilir.'); }
      }
      setSent(true);
      await dispatchSmartNotifications(report.id);
      await onPublished();
    } catch (error) {
      Alert.alert('Çağrı yayınlanamadı', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally { setBusy(false); }
  };

  if (sent) return <View style={styles.successWrap}><View style={styles.successCircle}><Ionicons name="checkmark" size={48} color="#fff" /></View><Text style={styles.successTitle}>Çağrı yayınlandı</Text><Text style={styles.successText}>Kayıt gerçek Can Haritası veritabanına işlendi ve yakınlık sorgularında görünmeye hazır.</Text><Pressable style={styles.primaryButton} onPress={() => { setSent(false); setStep(1); setNote(''); setPhoto(null); }}><Text style={styles.primaryButtonText}>Yeni çağrı oluştur</Text></Pressable></View>;

  return <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
    <View style={styles.formHeader}><Text style={styles.formTitle}>Bir can için{`\n`}yardım iste.</Text><Text style={styles.formSub}>Bilgiler gerçek veritabanına kaydedilecek.</Text></View>
    <View style={styles.steps}>{[1, 2, 3].map(s => <View key={s} style={[styles.step, s <= step && styles.stepActive]} />)}</View>
    {step === 1 && <>
      <Text style={styles.fieldLabel}>HANGİ CAN?</Text><View style={styles.chipRow}>{animals.map(a => <Pill key={a} text={a} active={animalType === a} onPress={() => setAnimalType(a)} />)}</View>
      <Text style={styles.fieldLabel}>NEYE İHTİYACI VAR?</Text><View style={styles.needGrid}>{needs.map(n => <Pressable key={n} onPress={() => setNeed(n)} style={[styles.needCard, need === n && styles.needCardActive]}><Ionicons name={needIcon[n]} size={27} color={need === n ? '#fff' : GREEN} /><Text style={[styles.needText, need === n && { color: '#fff' }]}>{n}</Text></Pressable>)}</View>
      <Text style={styles.fieldLabel}>KISA BİR NOT</Text><TextInput value={note} onChangeText={setNote} multiline maxLength={2000} placeholder="Örn. Arka patisine basamıyor, sakin görünüyor..." placeholderTextColor="#8D948F" style={styles.textarea} />
    </>}
    {step === 2 && <>
      <Text style={styles.fieldLabel}>OLAY KONUMU</Text><Pressable onPress={chooseLocation} style={styles.locationCard}><View style={styles.locationMap}>{busy ? <ActivityIndicator color={CORAL} /> : <Ionicons name="location" size={34} color={CORAL} />}</View><View style={{ flex: 1 }}><Text style={styles.locationTitle}>{position ? 'Konum hazır' : 'Konumu al'}</Text><Text style={styles.locationSub}>{position ? ([position.district, position.city].filter(Boolean).join(', ') || `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`) : 'Telefonun mevcut konumunu olay noktası olarak kullan'}</Text></View><Ionicons name="locate" size={22} color={GREEN} /></Pressable>
      <Text style={styles.fieldLabel}>KONUM GİZLİLİĞİ</Text>
      <View style={styles.privacyChoiceRow}>
        <Pressable onPress={() => setLocationVisibility('approximate')} style={[styles.privacyChoice, locationVisibility === 'approximate' && styles.privacyChoiceActive]}><Ionicons name="shield-checkmark-outline" size={20} color={locationVisibility === 'approximate' ? '#fff' : GREEN} /><View style={{ flex: 1 }}><Text style={[styles.privacyChoiceTitle, locationVisibility === 'approximate' && { color: '#fff' }]}>Yaklaşık göster</Text><Text style={[styles.privacyChoiceText, locationVisibility === 'approximate' && { color: '#E7F2ED' }]}>Haritada yaklaşık 100 m hassasiyet. Önerilen.</Text></View></Pressable>
        <Pressable onPress={() => setLocationVisibility('exact')} style={[styles.privacyChoice, locationVisibility === 'exact' && styles.privacyChoiceActive]}><Ionicons name="navigate-outline" size={20} color={locationVisibility === 'exact' ? '#fff' : GREEN} /><View style={{ flex: 1 }}><Text style={[styles.privacyChoiceTitle, locationVisibility === 'exact' && { color: '#fff' }]}>Tam konum</Text><Text style={[styles.privacyChoiceText, locationVisibility === 'exact' && { color: '#E7F2ED' }]}>Yalnızca gerçekten gerekliyse seç.</Text></View></Pressable>
      </View>
      <Text style={styles.fieldLabel}>FOTOĞRAF</Text>{photo ? <View style={styles.photoPreviewWrap}><Image source={{ uri: photo.uri }} style={styles.photoPreview} /><Pressable onPress={() => setPhoto(null)} style={styles.removePhoto}><Ionicons name="close" size={20} color="#fff" /></Pressable></View> : <View style={styles.photoActions}><Pressable onPress={() => pickPhoto(true)} style={styles.photoAction}><Ionicons name="camera" size={26} color={GREEN} /><Text style={styles.photoTitle}>Fotoğraf çek</Text></Pressable><Pressable onPress={() => pickPhoto(false)} style={styles.photoAction}><Ionicons name="images" size={26} color={GREEN} /><Text style={styles.photoTitle}>Galeriden seç</Text></Pressable></View>}
      <Text style={styles.photoSub}>Fotoğraf private depoya yüklenir; genel bir dosya adresi olarak yayınlanmaz.</Text>
    </>}
    {step === 3 && <View style={styles.reviewCard}><Text style={styles.reviewTitle}>Çağrıyı kontrol et</Text><InfoRow icon="paw" label="Can" value={animalType} /><InfoRow icon={needIcon[need]} label="İhtiyaç" value={need} /><InfoRow icon="location" label="Konum" value={position ? ([position.district, position.city].filter(Boolean).join(', ') || 'Koordinat alındı') : 'Eksik'} /><InfoRow icon="shield-checkmark" label="Haritada görünüm" value={locationVisibility === 'approximate' ? 'Yaklaşık konum' : 'Tam konum'} /><InfoRow icon="camera" label="Fotoğraf" value={photo ? 'Eklendi' : 'Eklenmedi'} />{duplicate && <View style={styles.duplicateWarning}><Ionicons name="copy-outline" size={20} color="#A7622D" /><View style={{ flex: 1 }}><Text style={styles.duplicateTitle}>Benzer bir çağrı olabilir</Text><Text style={styles.duplicateText}>{Math.round(duplicate.distance_m)} m yakınında kısa süre önce “{duplicate.title || duplicate.condition}” kaydı açılmış. Aynı hayvansa yeni kayıt yerine mevcut çağrıya destek olmayı düşün.</Text></View></View>}<View style={styles.safetyNote}><Ionicons name="shield-checkmark" size={20} color={GREEN} /><Text style={styles.safetyNoteText}>Kişisel canlı konumun değil, yalnızca bu çağrı için seçtiğin olay konumu kaydedilir. Yayınlayarak içeriğin doğru olduğunu ve Topluluk Kuralları'na uygun olduğunu onaylarsın.</Text></View></View>}
    {step < 3 ? <Pressable style={styles.primaryButton} onPress={async () => { if (step === 1 && !note.trim()) return Alert.alert('Kısa not gerekli', 'Durumu birkaç kelimeyle anlat.'); if (step === 2 && position) { try { const matches = await findPotentialDuplicates({ animalType, latitude: position.latitude, longitude: position.longitude }); setDuplicate(matches[0] || null); } catch { setDuplicate(null); } } setStep(step + 1); }}><Text style={styles.primaryButtonText}>Devam et</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></Pressable> : <Pressable disabled={busy} style={[styles.primaryButton, busy && { opacity: .6 }]} onPress={publish}>{busy ? <ActivityIndicator color="#fff" /> : <><Text style={styles.primaryButtonText}>Çağrıyı yayınla</Text><Ionicons name="paper-plane" size={18} color="#fff" /></>}</Pressable>}
    {step > 1 && !busy && <Pressable onPress={() => setStep(step - 1)}><Text style={styles.backText}>Geri dön</Text></Pressable>}
  </ScrollView>;
}

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <View style={styles.infoRow}><Ionicons name={icon} size={21} color={CORAL} /><View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>;
}

function Impact({ reports }: { reports: NearbyReport[] }) {
  return <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.pageTitle}>Etkin</Text><Text style={styles.pageSub}>Topluluk etkisini gerçek veriler büyüdükçe burada göstereceğiz.</Text><LinearGradient colors={[CORAL, '#E98B68']} style={styles.impactHero}><Text style={styles.impactEyebrow}>ŞU AN GÖREBİLDİĞİN</Text><Text style={styles.impactNumber}>{reports.length}</Text><Text style={styles.impactLabel}>yakın aktif çağrı</Text><View style={styles.impactLine} /><Text style={styles.impactQuote}>“Küçük bir yardım, bir can için bütün gün demek olabilir.”</Text></LinearGradient><View style={styles.trustCard}><Ionicons name="server" size={26} color={GREEN} /><View style={{ flex: 1 }}><Text style={styles.trustTitle}>Demo sayaçları kaldırıldı</Text><Text style={styles.trustText}>Bu ekran artık uydurma başarı rakamları göstermiyor. İstatistikler gerçek kayıtlar oluştukça üretilecek.</Text></View></View></ScrollView>;
}

function ProfileScreen({ user, reportCount }: { user: { name?: string | null; email?: string | null }; reportCount: number }) {
  const [deleting, setDeleting] = useState(false);
  const logout = async () => { try { await authClient.signOut(); } catch (error) { Alert.alert('Çıkış yapılamadı', error instanceof Error ? error.message : 'Tekrar dene.'); } };
  const name = user.name || 'Can Haritası gönüllüsü';
  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Bağlantı açılamadı', 'Daha sonra tekrar dene.'));
  const requestDeletion = () => Alert.alert('Hesabımı ve verilerimi sil', 'Hesabın, profilin, oluşturduğun çağrılar ve hesaba bağlı veriler için silme talebi oluşturulacak. Bu işlem geri alınamaz.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Silme talebi oluştur', style: 'destructive', onPress: async () => {
      setDeleting(true);
      try {
        await requestMyAccountDeletion();
        Alert.alert('Talebin alındı', 'Hesap silme talebin kaydedildi. Talebin en geç 30 gün içinde işlenecek.', [{ text: 'Tamam', onPress: logout }]);
      } catch (error) {
        Alert.alert('Talep oluşturulamadı', error instanceof Error ? error.message : 'Tekrar dene.');
      } finally { setDeleting(false); }
    } },
  ]);
  return <ScrollView contentContainerStyle={styles.scroll}>
    <View style={styles.profileTop}><View style={styles.bigAvatar}><Text style={styles.bigAvatarText}>{name.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.profileName}>{name}</Text><Text style={styles.profileEmail}>{user.email}</Text><View style={styles.verifiedRow}><Ionicons name="shield-checkmark" size={15} color="#398765" /><Text style={styles.verifiedText}>Neon Auth ile güvenli oturum</Text></View></View>
    <View style={styles.levelCard}><Text style={styles.levelSmall}>GERÇEK HESAP</Text><Text style={styles.levelTitle}>Topluluk üyesi</Text><Text style={styles.levelNumber}>{reportCount}</Text><Text style={styles.levelHint}>Bu cihazdan görünen yakın çağrı sayısı</Text></View>
    <View style={styles.menuRow}><Ionicons name="lock-closed-outline" size={20} color={GREEN} /><Text style={styles.menuText}>Oturum cihazda şifreli saklanır</Text></View>
    <View style={styles.menuRow}><Ionicons name="location-outline" size={20} color={GREEN} /><Text style={styles.menuText}>Canlı konum paylaşımı yok</Text></View>
    <Pressable onPress={() => open(PRIVACY_URL)} style={styles.menuRow}><Ionicons name="shield-checkmark-outline" size={20} color={GREEN} /><Text style={styles.menuText}>Gizlilik Politikası</Text><Ionicons name="open-outline" size={17} color="#78817D" /></Pressable>
    <Pressable onPress={() => open(TERMS_URL)} style={styles.menuRow}><Ionicons name="document-text-outline" size={20} color={GREEN} /><Text style={styles.menuText}>Kullanım Şartları ve Topluluk Kuralları</Text><Ionicons name="open-outline" size={17} color="#78817D" /></Pressable>
    <Pressable onPress={() => open(DELETE_ACCOUNT_URL)} style={styles.menuRow}><Ionicons name="globe-outline" size={20} color={GREEN} /><Text style={styles.menuText}>Web'den hesap silme talebi</Text><Ionicons name="open-outline" size={17} color="#78817D" /></Pressable>
    <Pressable disabled={deleting} onPress={requestDeletion} style={styles.menuRow}><Ionicons name="trash-outline" size={20} color={CORAL} /><Text style={[styles.menuText, { color: CORAL }]}>{deleting ? 'Talep oluşturuluyor…' : 'Hesabımı ve verilerimi sil'}</Text></Pressable>
    <Pressable onPress={logout} style={[styles.menuRow, { marginTop: 10 }]}><Ionicons name="log-out-outline" size={20} color={CORAL} /><Text style={[styles.menuText, { color: CORAL }]}>Çıkış yap</Text></Pressable>
  </ScrollView>;
}

function TermsGate({ onAccepted }: { onAccepted: (profile: Profile) => void }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!checked) return Alert.alert('Onay gerekli', 'Devam etmek için Kullanım Şartları ve Topluluk Kuralları’nı kabul et.');
    setBusy(true);
    try { onAccepted(await acceptTerms(TERMS_VERSION)); }
    catch (error) { Alert.alert('Onay kaydedilemedi', error instanceof Error ? error.message : 'Tekrar dene.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.termsGate}><ScrollView contentContainerStyle={styles.termsGateContent}><View style={styles.authLogo}><Ionicons name="paw" size={30} color="#fff" /></View><Text style={styles.termsGateTitle}>Topluluğu güvenli tutalım.</Text><Text style={styles.termsGateBody}>Can Haritası’nda yardım çağrısı yayınlamadan veya diğer kullanıcıların içerikleriyle etkileşmeden önce güncel Kullanım Şartları ve Topluluk Kuralları’nı kabul etmen gerekiyor.</Text><View style={styles.termsNotice}><Text style={styles.termsNoticeText}>Yanlış çağrı, spam, taciz, kişisel veri ifşası, hayvana zarar verme ve uygunsuz içerik yasaktır. Uygunsuz çağrıları bildirebilir ve kullanıcıları engelleyebilirsin.</Text></View><View style={styles.legalLinks}><Pressable onPress={() => Linking.openURL(TERMS_URL)}><Text style={styles.legalLink}>Kullanım Şartları</Text></Pressable><Text style={styles.legalDot}>•</Text><Pressable onPress={() => Linking.openURL(PRIVACY_URL)}><Text style={styles.legalLink}>Gizlilik Politikası</Text></Pressable></View><Pressable onPress={() => setChecked(v => !v)} style={styles.checkRow}><Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={checked ? GREEN : '#7B847F'} /><Text style={styles.checkText}>Okudum ve kabul ediyorum.</Text></Pressable><Pressable disabled={busy} onPress={submit} style={[styles.authButton, busy && { opacity: .65 }]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.authButtonText}>Kabul et ve devam et</Text>}</Pressable></ScrollView></SafeAreaView>;
}

function BottomNav({ active, setActive }: { active: Tab; setActive: (t: Tab) => void }) {
  const items: { key: Tab; icon: IconName; label: string }[] = [{ key: 'home', icon: 'home', label: 'Ana Sayfa' }, { key: 'map', icon: 'map', label: 'Harita' }, { key: 'report', icon: 'add', label: '' }, { key: 'community', icon: 'heart', label: 'Topluluk' }, { key: 'profile', icon: 'person', label: 'Profil' }];
  return <SafeAreaView edges={['bottom']} style={styles.navSafe}><View style={styles.nav}>{items.map(item => <Pressable key={item.key} style={styles.navItem} onPress={() => setActive(item.key)}>{item.key === 'report' ? <View style={styles.addButton}><Ionicons name="add" size={28} color="#fff" /></View> : <><Ionicons name={active === item.key ? item.icon : (`${item.icon}-outline` as keyof typeof Ionicons.glyphMap)} size={21} color={active === item.key ? CORAL : '#8B7770'} /><Text style={[styles.navLabel, active === item.key && { color: CORAL }]}>{item.label}</Text></>}</Pressable>)}</View></SafeAreaView>;
}


class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { error: message };
  }

  componentDidCatch(error: unknown) {
    console.error('Can Haritası startup/render error', error);
  }

  render() {
    if (this.state.error) {
      return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8EF', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#49342D', fontSize: 24, fontWeight: '900', marginBottom: 12 }}>Can Haritası açılamadı</Text>
        <Text style={{ color: '#91AEA3', fontSize: 14, lineHeight: 21, marginBottom: 16 }}>Başlangıçta bir uygulama hatası yakalandı. Aşağıdaki metni bize gönder.</Text>
        <Text selectable style={{ color: '#7A2E22', fontSize: 12, lineHeight: 18 }}>{this.state.error}</Text>
      </SafeAreaView>;
    }
    return this.props.children;
  }
}

function AppInner() {
  const { data: session, isPending } = authClient.useSession();
  const [active, setActive] = useState<Tab>('home');
  const [reports, setReports] = useState<NearbyReport[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const current = await readCurrentPosition();
      setPosition(current);
      await ensureProfile(session.user.name, current.city, current.district);
      setReports(await fetchNearbyReports(current.latitude, current.longitude, 10000));
    } catch (error) {
      Alert.alert('Yakındaki çağrılar alınamadı', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally { setLoading(false); }
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) { setProfile(undefined); return; }
    let mounted = true;
    setProfile(undefined);
    const loadProfile = async () => {
      const delays = [0, 450, 1000, 1800] as const;
      let lastError: unknown = null;
      for (const delay of delays) {
        if (!mounted) return;
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        try {
          await ensureProfile(session.user.name);
          const value = await getMyProfile();
          if (mounted) setProfile(value);
          return;
        } catch (error) {
          lastError = error;
          const message = error instanceof Error ? error.message : String(error);
          if (!/authentication required|unauthorized|not authenticated|session|jwt|token/i.test(message)) break;
        }
      }
      if (mounted) {
        setProfile(null);
        Alert.alert('Profil alınamadı', lastError instanceof Error ? lastError.message : 'Tekrar dene.');
      }
    };
    loadProfile().catch(() => undefined);
    return () => { mounted = false; };
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user || !profile?.terms_accepted_at || profile.terms_version !== TERMS_VERSION) return;
    refresh().catch(() => undefined);
  }, [session?.user, profile?.terms_accepted_at, profile?.terms_version, refresh]);

  if (isPending) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={GREEN} /><Text style={styles.loadingText}>Güvenli oturum kontrol ediliyor…</Text></View>;
  if (!session?.user) return <AuthScreen />;
  if (profile === undefined) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={GREEN} /><Text style={styles.loadingText}>Profil ve topluluk kuralları kontrol ediliyor…</Text></View>;
  if (!profile?.terms_accepted_at || profile.terms_version !== TERMS_VERSION) return <TermsGate onAccepted={setProfile} />;

  const help = async (reportId: string) => { await markHelp(reportId); };
  const refreshAfterPublish = async () => { if (position) setReports(await fetchNearbyReports(position.latitude, position.longitude, 10000)); };
  const userName = session.user.name || session.user.email || 'Can';
  return <View style={styles.app}>
    <StatusBar style="dark" />
    <SafeAreaView edges={active === 'map' ? [] : ['top']} style={styles.content}>
      {active === 'home' && <PlayfulHome reports={reports} loading={loading} position={position} refresh={refresh} goReport={() => setActive('report')} userName={userName} onHelp={help} onModerated={refreshAfterPublish} onNotifications={() => setActive('notifications')} unreadCount={reports.length} />}
      {active === 'map' && <MapScreen reports={reports} position={position} onHelp={help} onModerated={refreshAfterPublish} />}
      {active === 'report' && <ReportScreen defaultPosition={position} onPublished={refreshAfterPublish} />}
      {active === 'community' && <CommunityHub position={position} reportCount={reports.length} />}
      {active === 'profile' && <ProfileScreen user={session.user} reportCount={reports.length} />}
      {active === 'notifications' && <NotificationCenter reports={reports} position={position} onBack={() => setActive('home')} onOpenMap={() => setActive('map')} onPreferences={() => setActive('community')} />}
    </SafeAreaView>
    {active !== 'notifications' && <BottomNav active={active} setActive={setActive} />}
  </View>;
}

export default function App() { return <SafeAreaProvider><AppErrorBoundary><AppInner /></AppErrorBoundary></SafeAreaProvider>; }

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: CREAM }, content: { flex: 1, backgroundColor: CREAM }, loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CREAM, gap: 14 }, loadingText: { color: GREEN, fontWeight: '700' },
  authOuter: { flex: 1, backgroundColor: '#071612' }, authSafe: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' }, authBrand: { alignItems: 'center', marginBottom: 28 }, authLogo: { width: 68, height: 68, borderRadius: 25, backgroundColor: '#FF914D', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, authTitle: { fontSize: 36, fontWeight: '900', color: GREEN, letterSpacing: -1 }, authSubtitle: { color: '#91AEA3', textAlign: 'center', lineHeight: 20, marginTop: 8, maxWidth: 310 }, authCard: { backgroundColor: '#0E211C', borderRadius: 48, padding: 22, borderWidth: 1, borderColor: '#29483E' }, authTabs: { flexDirection: 'row', padding: 4, backgroundColor: '#17342C', borderRadius: 18, marginBottom: 16 }, authTab: { flex: 1, paddingVertical: 10, borderRadius: 15, alignItems: 'center' }, authTabActive: { backgroundColor: '#0E211C' }, authTabText: { fontWeight: '800', color: '#91AEA3' }, authTabTextActive: { color: GREEN }, input: { backgroundColor: '#102A24', borderWidth: 1, borderColor: '#29483E', borderRadius: 18, paddingHorizontal: 15, height: 52, marginBottom: 10, color: GREEN, fontSize: 14 }, authButton: { height: 56, backgroundColor: CORAL, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 4 }, authButtonText: { color: '#fff', fontWeight: '900', fontSize: 14 }, privacyRow: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-start' }, privacyText: { flex: 1, fontSize: 10, lineHeight: 15, color: '#91AEA3' },
  scroll: { padding: 18, paddingBottom: 30 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, eyebrow: { fontSize: 9, letterSpacing: 1.4, color: '#91AEA3', fontWeight: '800', maxWidth: 220 }, logo: { fontSize: 24, fontWeight: '900', letterSpacing: -.8, color: GREEN }, headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' }, iconButton: { width: 42, height: 42, borderRadius: 24, backgroundColor: '#0E211C', alignItems: 'center', justifyContent: 'center' }, avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: GREEN, fontWeight: '900' },
  hero: { borderRadius: 18, padding: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#244C6C', shadowColor: GREEN, shadowOpacity: .14, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } }, heroPawBubble: { position: 'absolute', right: 20, bottom: 18, width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(47,107,255,.34)', alignItems: 'center', justifyContent: 'center' }, heroGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)', backgroundColor: 'rgba(255,255,255,.025)', right: -52, top: -72, transform: [{ rotate: '18deg' }] }, live: { flexDirection: 'row', alignItems: 'center', gap: 7 }, liveDot: { width: 7, height: 7, borderRadius: 2, backgroundColor: '#FFB547' }, liveText: { fontSize: 10, color: '#CFE2F6', fontWeight: '800', letterSpacing: 1.4 }, heroTitle: { fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -1.1, color: '#fff', marginTop: 16 }, heroBody: { fontSize: 13, lineHeight: 20, color: '#C7D8E8', marginTop: 12, maxWidth: '94%' }, heroButton: { alignSelf: 'flex-start', marginTop: 21, backgroundColor: '#0E211C', borderRadius: 9, paddingVertical: 13, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }, heroButtonText: { color: GREEN, fontWeight: '800', fontSize: 13 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8, marginTop: 14, backgroundColor: '#0E211C', borderWidth: 1, borderColor: '#29483E', borderRadius: 14 }, stat: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40 }, statValue: { fontSize: 18, fontWeight: '900', color: GREEN }, statLabel: { fontSize: 9, lineHeight: 13, textAlign: 'center', color: '#91AEA3', marginTop: 3 }, statDivider: { width: 1, height: 34, backgroundColor: '#F0DED2' }, sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }, sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -.4, color: GREEN }, sectionSub: { fontSize: 12, color: '#91AEA3', marginTop: 3 }, filters: { gap: 8, paddingVertical: 15 }, pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, backgroundColor: '#0E211C', borderWidth: 1, borderColor: '#29483E' }, pillActive: { backgroundColor: CORAL, borderColor: CORAL }, pillText: { fontSize: 12, fontWeight: '700', color: GREEN }, chipRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  caseCard: { backgroundColor: '#0E211C', borderRadius: 14, padding: 12, marginBottom: 12, flexDirection: 'row', borderWidth: 1, borderColor: '#29483E', shadowColor: GREEN, shadowOpacity: .04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, caseImage: { width: 82, minHeight: 104, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, casePhoto: { width: '100%', height: '100%', position: 'absolute' }, verified: { position: 'absolute', bottom: 7, right: 7, width: 18, height: 18, borderRadius: 9, backgroundColor: '#4BA67E', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }, caseBody: { flex: 1, paddingLeft: 13, paddingVertical: 2 }, caseTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, caseName: { fontSize: 16, fontWeight: '900', color: GREEN }, distance: { fontSize: 10, color: '#6E7974', fontWeight: '700' }, caseType: { fontSize: 11, lineHeight: 16, color: '#77807B', marginTop: 3 }, urgencyRow: { flexDirection: 'row', gap: 4, marginTop: 10 }, urgencyDot: { width: 18, height: 4, borderRadius: 2, backgroundColor: '#E4EAF0' }, caseBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }, time: { fontSize: 10, color: '#949B97' }, miniButton: { minWidth: 74, minHeight: 30, backgroundColor: GREEN, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, miniButtonDone: { backgroundColor: MINT }, miniButtonText: { fontSize: 10, fontWeight: '800', color: '#fff' }, emptyCard: { backgroundColor: '#0E211C', borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#29483E' }, emptyTitle: { color: GREEN, fontWeight: '900', fontSize: 16, marginTop: 10 }, emptyText: { color: '#7A837F', textAlign: 'center', lineHeight: 18, fontSize: 12, marginTop: 6 }, outlineButton: { borderWidth: 1, borderColor: GREEN, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 18, marginTop: 14, minWidth: 120, alignItems: 'center' }, outlineButtonText: { color: GREEN, fontWeight: '800' }, trustCard: { marginTop: 8, backgroundColor: '#E8F0FF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#CADAF1' }, trustIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#0E211C', alignItems: 'center', justifyContent: 'center' }, trustTitle: { fontSize: 13, fontWeight: '900', color: GREEN }, trustText: { fontSize: 10, lineHeight: 15, color: '#5F7286', marginTop: 3 },
  navSafe: { backgroundColor: '#0E211C', borderTopWidth: 1, borderTopColor: '#F0DED2' }, nav: { height: 67, flexDirection: 'row', alignItems: 'center' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { fontSize: 9, fontWeight: '700', color: '#91AEA3' }, addButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: CORAL, alignItems: 'center', justifyContent: 'center', marginTop: -25, shadowColor: CORAL, shadowOpacity: .32, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  mapSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }, mapHeader: { paddingHorizontal: 18, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }, locationPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, borderRadius: 10, backgroundColor: '#0E211C', maxWidth: SCREEN - 130 }, locationText: { fontSize: 12, fontWeight: '800', color: GREEN }, realMapWrap: { flex: 1, overflow: 'hidden' }, realMap: { flex: 1 }, mapPin: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0E211C', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: .18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, mapPinActive: { backgroundColor: CORAL, transform: [{ scale: 1.12 }] }, youMarkerReal: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(43,118,242,.24)', alignItems: 'center', justifyContent: 'center' }, youCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2B76F2', borderWidth: 2, borderColor: '#fff' }, mapLoadingOverlay: { position: 'absolute', left: 18, right: 18, top: '45%', backgroundColor: 'rgba(255,255,255,.94)', borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }, mapLoadingText: { fontSize: 11, fontWeight: '700', color: GREEN }, mapSheet: { backgroundColor: CREAM, padding: 15, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#C7C7C1', alignSelf: 'center', marginBottom: 10 }, mapCount: { fontSize: 15, fontWeight: '900', color: GREEN, marginBottom: 10 },
  formScroll: { padding: 22, paddingBottom: 36 }, formHeader: { marginTop: 10 }, formTitle: { fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1.1, color: GREEN }, formSub: { fontSize: 13, color: '#91AEA3', marginTop: 8 }, steps: { flexDirection: 'row', gap: 7, marginVertical: 27 }, step: { height: 5, flex: 1, borderRadius: 3, backgroundColor: '#F0DED2' }, stepActive: { backgroundColor: CORAL }, fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: '#68736E', marginBottom: 10, marginTop: 5 }, needGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 23 }, needCard: { width: '48%', height: 92, borderRadius: 34, backgroundColor: '#0E211C', borderWidth: 1, borderColor: '#29483E', padding: 15, justifyContent: 'space-between' }, needCardActive: { backgroundColor: GREEN, borderColor: GREEN }, needText: { fontSize: 13, fontWeight: '900', color: GREEN }, textarea: { height: 120, backgroundColor: '#0E211C', borderRadius: 18, padding: 15, fontSize: 13, lineHeight: 19, color: GREEN, textAlignVertical: 'top', borderWidth: 1, borderColor: '#29483E' }, primaryButton: { marginTop: 24, minHeight: 55, minWidth: 210, borderRadius: 17, backgroundColor: CORAL, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 18 }, primaryButtonText: { fontSize: 14, fontWeight: '900', color: '#fff' }, backText: { textAlign: 'center', padding: 15, color: GREEN, fontWeight: '700' }, locationCard: { backgroundColor: '#0E211C', borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 25 }, locationMap: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#E7E4DC', alignItems: 'center', justifyContent: 'center' }, locationTitle: { fontSize: 13, fontWeight: '900', color: GREEN }, locationSub: { fontSize: 11, lineHeight: 15, color: '#91AEA3', marginTop: 3 }, photoActions: { flexDirection: 'row', gap: 10 }, photoAction: { flex: 1, height: 120, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#AEB7B2', alignItems: 'center', justifyContent: 'center', padding: 14 }, photoTitle: { fontSize: 13, fontWeight: '900', color: GREEN, marginTop: 8 }, photoSub: { fontSize: 10, lineHeight: 15, textAlign: 'center', color: '#91AEA3', marginTop: 8 }, photoPreviewWrap: { height: 210, borderRadius: 20, overflow: 'hidden' }, photoPreview: { width: '100%', height: '100%' }, removePhoto: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,.65)', alignItems: 'center', justifyContent: 'center' }, reviewCard: { backgroundColor: '#0E211C', borderRadius: 40, padding: 20 }, reviewTitle: { fontSize: 20, fontWeight: '900', color: GREEN, marginBottom: 14 }, infoRow: { flexDirection: 'row', gap: 13, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0DED2' }, infoLabel: { fontSize: 10, color: '#848C88' }, infoValue: { fontSize: 13, fontWeight: '800', color: GREEN, marginTop: 2 }, safetyNote: { backgroundColor: MINT, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, marginTop: 15 }, safetyNoteText: { flex: 1, fontSize: 10, lineHeight: 15, color: '#526B63' }, successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36 }, successCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#49A27B', alignItems: 'center', justifyContent: 'center' }, successTitle: { fontSize: 28, fontWeight: '900', color: GREEN, marginTop: 25 }, successText: { fontSize: 13, lineHeight: 20, textAlign: 'center', color: '#91AEA3', marginTop: 10 },
  pageTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -1, color: GREEN }, pageSub: { fontSize: 13, color: '#91AEA3', marginTop: 4, marginBottom: 20 }, impactHero: { borderRadius: 26, padding: 22, alignItems: 'center' }, impactEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#FFE5DD' }, impactNumber: { fontSize: 60, fontWeight: '900', color: '#fff', marginTop: 6 }, impactLabel: { fontSize: 14, fontWeight: '800', color: '#fff' }, impactLine: { height: 1, width: '90%', backgroundColor: 'rgba(255,255,255,.3)', marginVertical: 17 }, impactQuote: { fontSize: 12, fontStyle: 'italic', color: '#FFF0EB', textAlign: 'center' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C9D0CC' }, statusDotActive: { backgroundColor: '#55A47D' }, statusText: { fontSize: 9, fontWeight: '800', color: '#6F7D76' }, privacyChoiceRow: { gap: 8, marginBottom: 22 }, privacyChoice: { minHeight: 70, borderRadius: 18, borderWidth: 1, borderColor: '#29483E', backgroundColor: '#0E211C', padding: 13, flexDirection: 'row', gap: 10, alignItems: 'center' }, privacyChoiceActive: { backgroundColor: GREEN, borderColor: GREEN }, privacyChoiceTitle: { color: GREEN, fontSize: 12, fontWeight: '900' }, privacyChoiceText: { color: '#91AEA3', fontSize: 9, lineHeight: 14, marginTop: 2 }, duplicateWarning: { marginTop: 14, borderRadius: 15, padding: 12, backgroundColor: '#FFF1D9', flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, duplicateTitle: { color: '#8C5529', fontWeight: '900', fontSize: 11 }, duplicateText: { color: '#8B684C', fontSize: 9, lineHeight: 14, marginTop: 3 },
  termsBox: { marginTop: 2, marginBottom: 12, backgroundColor: '#F4F7F5', borderRadius: 14, padding: 12 }, checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, checkText: { flex: 1, color: GREEN, fontSize: 11, lineHeight: 17, fontWeight: '700' }, legalLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 9, flexWrap: 'wrap' }, legalLink: { color: CORAL, fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' }, legalDot: { color: '#89928E' }, moderationRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 }, moderationText: { color: '#7D8581', fontSize: 9, fontWeight: '800', textDecorationLine: 'underline' }, moderationSep: { color: '#B4BAB7', fontSize: 9 }, termsGate: { flex: 1, backgroundColor: CREAM }, termsGateContent: { flexGrow: 1, padding: 28, justifyContent: 'center', maxWidth: 620, width: '100%', alignSelf: 'center' }, termsGateTitle: { color: GREEN, fontSize: 31, lineHeight: 36, fontWeight: '900', marginTop: 22 }, termsGateBody: { color: '#65716C', fontSize: 13, lineHeight: 20, marginTop: 12 }, termsNotice: { backgroundColor: MINT, padding: 15, borderRadius: 16, marginTop: 18 }, termsNoticeText: { color: '#4E685F', fontSize: 11, lineHeight: 17 },
  profileTop: { alignItems: 'center', paddingVertical: 10 }, bigAvatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' }, bigAvatarText: { fontSize: 30, fontWeight: '900', color: GREEN }, profileName: { fontSize: 23, fontWeight: '900', color: GREEN, marginTop: 12 }, profileEmail: { fontSize: 11, color: '#7E8783', marginTop: 3 }, verifiedRow: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 7 }, verifiedText: { fontSize: 10, fontWeight: '700', color: '#398765' }, levelCard: { backgroundColor: GREEN, borderRadius: 42, padding: 19, marginVertical: 18 }, levelSmall: { fontSize: 9, letterSpacing: 1.2, fontWeight: '800', color: '#BFD2CC' }, levelTitle: { fontSize: 19, fontWeight: '900', color: '#fff', marginTop: 4 }, levelNumber: { position: 'absolute', right: 20, top: 17, fontSize: 32, fontWeight: '900', color: '#fff' }, levelHint: { fontSize: 9, color: '#BFD2CC', marginTop: 12 }, menuRow: { backgroundColor: '#0E211C', padding: 16, borderRadius: 32, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }, menuText: { flex: 1, fontSize: 13, fontWeight: '700', color: GREEN },
});

