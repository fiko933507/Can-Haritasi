# Can Haritası — Play Store adayı v1.2

Sokak hayvanları için konum tabanlı yardımlaşma uygulaması. Uygulama ayrı bir **Can Haritası Neon** projesine bağlıdır; Safe Sentinel Pro ile veritabanı, anahtar veya proje paylaşmaz.

## Altyapı

- Expo SDK 57 + React Native 0.86
- Neon Auth: e-posta/şifre
- Neon Data API + PostgreSQL + PostGIS
- Row Level Security (RLS) + kontrollü RPC erişimi
- Neon Object Storage: `can-haritasi-media`
- Neon Functions: medya ve yasal sayfalar
- MapLibre Native + OpenFreeMap

## v1.2 Play Store politika katmanı

Production backend üzerinde şart kabulü, içerik bildirme, kullanıcı engelleme, uygulama içi hesap silme talebi, web hesap silme talebi ve `nearby_reports_v3` etkinleştirilmiştir.

Yasal sayfalar:
- Gizlilik: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/privacy
- Şartlar: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/terms
- Hesap silme: https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/delete-account

## Kurulum (Windows)

```powershell
npm install
npx expo install --check
npm run typecheck
npx expo prebuild --platform android
```

MapLibre Native nedeniyle Expo Go kullanılmaz. Android test/release build gerekir.

## Güvenlik

Repoda veritabanı parolası, Neon API anahtarı, S3 secret key veya yönetici bağlantı dizesi tutulmaz. Mobil uygulama yalnızca public Auth/Data API/Function endpoint'lerini içerir.

## Proje kimliği

- Neon project: `silent-waterfall-37853270`
- Main branch: `br-dry-boat-ayf159cc`
- Database: `canharitasi`

## Yayın belgeleri

Google Play hazırlıkları için şu dosyaları takip edin:
- `PLAY_CONSOLE_FORM_CEVAPLARI_TR.md`
- `PLAY_STORE_RELEASE_CHECKLIST_TR.md`
- `DATA_SAFETY_TR.md`
- `PRIVACY_POLICY_TR.md`
- `TERMS_OF_USE_TR.md`
- `ACCOUNT_DELETION_RUNBOOK_TR.md`
- `MODERATION_RUNBOOK_TR.md`
