# Can Haritası — gerçek backend sürümü 1.1

Sokak hayvanları için konum tabanlı yardımlaşma uygulaması. Bu paket demo veriden çıkarılmış ve ayrı bir **Can Haritası Neon** projesine bağlanmıştır. **Safe Sentinel Pro ile hiçbir veritabanı, anahtar veya proje paylaşmaz.**

## Canlı altyapı

- Expo SDK 57 + React Native 0.86
- Neon Auth: e-posta/şifre oturumu
- Neon Data API + PostgreSQL + PostGIS
- Row Level Security (RLS) ve yalnızca kontrollü RPC erişimi
- Neon Object Storage: `can-haritasi-media` private bucket
- Neon Function: fotoğraflar için 10 dakikalık imzalı upload/download URL'leri
- MapLibre Native + OpenFreeMap: gerçek, etkileşimli harita; API anahtarı gerekmez

## Gerçek çalışan akış

1. Kullanıcı kayıt olur veya giriş yapar.
2. Oturum SecureStore içinde saklanır.
3. Kullanıcı konum izni verirse 10 km çevredeki açık çağrılar PostGIS ile sorgulanır.
4. Yeni çağrı; hayvan türü, ihtiyaç, not ve olay koordinatıyla Neon'a yazılır.
5. Fotoğraf seçilirse APK'ya hiçbir S3 sırrı konmadan private bucket'a süreli imzalı URL ile yüklenir.
6. Çağrılar gerçek haritada koordinatlarında görünür.
7. `Destek ol` işlemi giriş yapan kullanıcının kimliğiyle kaydedilir; başka kullanıcı kimliği taklit edilemez.

## Kurulum (Windows)

PowerShell'de proje klasöründe:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\KURULUM.ps1
```

veya elle:

```powershell
npm install
npx expo install --check
npm run typecheck
npx expo run:android
```

### Önemli: Expo Go değil

Gerçek harita için MapLibre Native kullanıldığı için bu sürüm **Expo Go içinde çalışmaz**. MapLibre resmi Expo kurulumu native development/release build gerektirir. İlk Android derlemesini `npx expo run:android` ile oluşturun. Bundan sonra Metro için `npx expo start --dev-client --clear` kullanılabilir.

## Güvenlik

Mobil pakette Neon yönetici bağlantı dizesi, veritabanı parolası, Neon API anahtarı veya S3 secret key yoktur. Uygulamada yalnızca public Auth/Data API/Function endpoint'leri bulunur. Veritabanı tablolarında RLS açıktır; doğrudan tablo yazma yetkisi uygulama kullanıcılarından kaldırılmıştır. Yazmalar `ensure_profile`, `create_animal_report`, `mark_help`, `add_report_image` gibi sunucu kontrollü RPC'lerden geçer.

Private görseller yalnızca oturum doğrulamasından sonra kısa süreli imzalı URL ile okunur/yazılır.

## Harita sağlayıcısı

Map stili: `https://tiles.openfreemap.org/styles/liberty`. OpenFreeMap public instance'ı ücretsiz ve API anahtarsızdır; MapLibre ile gerekli harita atfı gösterilir. Ürün büyüdüğünde SLA ihtiyacı doğarsa kendi tile altyapımıza veya ticari sağlayıcıya geçebiliriz.

## Henüz tamamlanmayan üretim maddeleri

Bu paket gerçek backend ve gerçek harita temelini kurar; mağazaya genel kullanıma açmadan önce push bildirimleri, moderasyon yönetim ekranı, hesap silme/veri dışa aktarma, gizlilik/şartlar sayfaları, crash reporting ve gerçek cihaz uçtan uca testleri tamamlanmalıdır. Google OAuth şimdilik kapalıdır; ilk akış e-posta/şifre ile çalışacak şekilde hazırlanmıştır.

## Proje kimliği

Can Haritası Neon project id: `silent-waterfall-37853270`  
Branch: `main` (`br-dry-boat-ayf159cc`)  
Database: `canharitasi`

Bunlar gizli değildir; gizli erişim bilgileri bu repoya eklenmemiştir.

## v1.2 Play Store adayı

Bu paket Google Play politika hazırlıklarıyla güncellenmiştir. Yayın öncesi `PLAY_STORE_RELEASE_CHECKLIST_TR.md`, `DATA_SAFETY_TR.md`, `ACCOUNT_DELETION_RUNBOOK_TR.md` ve `MODERATION_RUNBOOK_TR.md` belgelerini takip edin.

Yasal sayfalar:
- Gizlilik: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/privacy
- Şartlar: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/terms
- Topluluk standartları: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/community-standards
- Çocuk güvenliği: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/child-safety
- Veri güvenliği özeti: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/data-safety
- Hesap silme: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/delete-account
- İletişim: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/support

## v1.3 — Can Rehberi & Topluluk

v1.3, Can Haritası'nı yalnızca çağrı haritası olmaktan çıkarıp mahalle odaklı bir sokak hayvanı dayanışma ağına dönüştürür.

- Daha sıcak ve sevimli hayvan-dostu arayüz
- Kaynaklı Can Bilgisi kartları ve güvenli ilk 10 dakika rehberi
- Gönüllü beceri profili
- Mama / su topluluk noktaları
- Vaka zaman çizelgesi
- Yaklaşık / tam olay konumu görünürlüğü
- Mükerrer çağrı uyarısı
- Opt-in akıllı push bildirimleri ve kişiselleştirilebilir filtreler

Backend değişiklikleri `database/COMMUNITY_FEATURES_V1_3.sql` dosyasındadır ve production'a uygulanmadan önce ayrı Neon preview branch üzerinde test edilir.
