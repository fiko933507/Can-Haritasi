# Google Play Data Safety — Can Haritası nihai doldurma taslağı

Bu belge Play Console **Politika ve programlar → Uygulama içeriği → Veri güvenliği** formu için hazırlanmıştır. Son gönderimde Play Console'daki gerçek soru metinleri esas alınmalıdır.

## Genel cevaplar

- Uygulama kullanıcı verisi topluyor/iletiyor mu? **Evet**
- Veriler üçüncü taraflara "paylaşılıyor" mu? **Hayır** — Neon altyapısı uygulama adına çalışan hizmet sağlayıcıdır; reklam/veri broker paylaşımı yoktur.
- Veriler aktarım sırasında şifreleniyor mu? **Evet — HTTPS/TLS**
- Kullanıcı veri silme talebinde bulunabiliyor mu? **Evet — uygulama içi + harici web formu**
- Reklam SDK'sı var mı? **Hayır**
- Veriler reklam/marketing amacıyla kullanılıyor mu? **Hayır**

## Veri türleri için önerilen cevaplar

| Play veri türü | Toplanır | Paylaşılır | Zorunlu/isteğe bağlı | Amaç |
|---|---|---|---|---|
| Kişisel bilgiler → Ad | Evet | Hayır | Zorunlu | Hesap yönetimi; Uygulama işlevi |
| Kişisel bilgiler → E-posta adresi | Evet | Hayır | Zorunlu | Hesap yönetimi; Uygulama işlevi |
| Kişisel bilgiler → Kullanıcı kimlikleri | Evet | Hayır | Zorunlu | Hesap yönetimi; Uygulama işlevi |
| Konum → Yaklaşık konum | Evet | Hayır | Temel yakınlık işlevi için gerekli | Uygulama işlevi |
| Konum → Kesin konum | Evet | Hayır | Kullanıcı kesin konum izni verirse isteğe bağlı | Uygulama işlevi |
| Fotoğraflar ve videolar → Fotoğraflar | Evet | Hayır | İsteğe bağlı | Uygulama işlevi |
| Uygulama etkinliği → Diğer kullanıcı tarafından oluşturulan içerikler | Evet | Hayır | İsteğe bağlı | Uygulama işlevi |
| Uygulama etkinliği → Diğer eylemler | Evet | Hayır | İsteğe bağlı | Uygulama işlevi; Dolandırıcılığı önleme/güvenlik/uyumluluk |
| Cihaz veya diğer kimlikler | Evet | Hayır | Oturum/güvenlik için gerekli olabilir | Dolandırıcılığı önleme/güvenlik/uyumluluk; Hesap yönetimi |

## İşaretlenmemesi beklenen başlıklar

Mevcut uygulamada şu veri türleri için bilinçli bir toplama özelliği yoktur: telefon numarası, adres, kişiler, SMS/MMS, e-posta içeriği, finansal bilgiler, sağlık/fitness bilgileri, ses dosyaları, videolar, dosya/dokümanlar, takvim, web tarama geçmişi, yüklü uygulama listesi, reklam kimliğiyle reklam profili, satın alma geçmişi.

Ayrıca analiz/crash SDK'sı eklenmediği için **App interactions / Crash logs / Diagnostics** otomatik olarak işaretlenmemelidir. İleride Sentry, Firebase Analytics/Crashlytics veya benzeri SDK eklenirse form yeniden güncellenmelidir.

## Konum açıklaması

Telefonun mevcut konumu yakındaki çağrıları sorgulamak için sunucuya iletilir. **Kişisel canlı konum diğer kullanıcılara yayınlanmaz.** Yardım çağrısı oluşturulduğunda olay konumu veritabanına kalıcı kaydedilir ve çağrının haritada gösterilmesinde kullanılır.

## Fotoğraf

Kamera/galeri erişimi kullanıcı eylemiyle gerçekleşir. Fotoğraf eklemek isteğe bağlıdır. Yüklenen fotoğraflar özel object storage'da saklanır ve kısa süreli imzalı URL ile görüntülenir.

## Hesap silme URL'si

`https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/delete-account`

## Resmi Google referansı

https://support.google.com/googleplay/android-developer/answer/10787469
