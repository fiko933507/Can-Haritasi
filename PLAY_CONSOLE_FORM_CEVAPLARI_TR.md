# Can Haritası — Play Console form cevapları

**Paket:** com.fiel.canharitasi  
**Sürüm:** 1.4.1  
**Hedef:** Google Play Android üretim yayını

Bu dosya Play Console ekranlarında hangi alanın nasıl doldurulacağını tek tek gösterir.

## 1. Ana mağaza girişi

- **Uygulama adı:** `Can Haritası`
- **Kısa açıklama:** `Sokak hayvanları için yakındaki yardım çağrılarını gör, oluştur ve destek ol.`
- **Tam açıklama:** `STORE_LISTING_TR.md` içindeki metni kullan.
- **Kategori:** `Yaşam Tarzı / Lifestyle`
- **Uygulama mı oyun mu?:** `Uygulama`
- **Ücretli mi?:** Mevcut sürüm ücretsiz yayınlanacaksa `Ücretsiz`.

### Görseller

- **Play Store ikonu:** `store-assets/app-icon-512.png`
- **Feature graphic:** `store-assets/feature-graphic-1024x500.png`
- **Telefon ekran görüntüleri:** Gerçek çalışan uygulamadan **en az 2** adet zorunlu. Tavsiye: 4 adet 1080×1920 portre.
  1. Ana sayfa / yakın çağrılar
  2. Harita ve gerçek pinler
  3. Yardım çağrısı oluşturma
  4. Profil / gizlilik ve hesap silme

Sahte/mock ekran görüntüsü kullanma; yayınlanan build'in gerçek UI'sını göster.

## 2. Gizlilik Politikası

Play Console → **Politika ve programlar → Uygulama içeriği → Gizlilik Politikası**

URL:
`https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/privacy`

Aynı bağlantı uygulama içinde Profil ve kayıt ekranında bulunur.

## 3. Reklamlar

Play Console → **Uygulama içeriği → Reklamlar**

Cevap: **Hayır, uygulamam reklam içermez.**

Mevcut pakette reklam SDK'sı yoktur.

## 4. Uygulama erişimi / App access

Uygulamanın ana işlevleri oturum açmayı gerektirdiğinden:

Cevap: **Uygulamamın tümü veya bazı işlevleri kısıtlıdır.**

Google inceleme ekibine özel, sürekli çalışan bir test hesabı ver:

- **Kullanıcı adı / e-posta:** `[PLAY_REVIEW_TEST_EMAIL]`
- **Şifre:** `[PLAY_REVIEW_TEST_PASSWORD]`

**Diğer talimatlar** alanına yapıştır:

> Can Haritası e-posta ve şifre ile giriş gerektirir. Verilen test hesabında iki faktörlü doğrulama, OTP, davet kodu veya ek onay yoktur. Giriş yaptıktan sonra ana sayfa, harita, yardım çağrısı oluşturma, fotoğraf ekleme, Destek ol/Yoldayım, Bildir, Engelle, Gizlilik Politikası ve hesap silme seçenekleri test edilebilir. Konum ve kamera izinleri yalnızca ilgili özellik kullanılırken istenir.

**Göndermeden önce:** Bu test hesabıyla temiz bir cihazda giriş yap ve şifrenin çalıştığını doğrula. İnceleme sonuçlanana kadar hesabı silme/değiştirme.

## 5. Hedef kitle ve içerik

Play Console → **Uygulama içeriği → Hedef kitle ve içerik**

- **Hedef yaş:** `18 yaş ve üzeri`
- Çocukları hedefleyen yaş gruplarını seçme.
- Mağaza görsellerinde ve açıklamalarda çocuklara yönelik pazarlama kullanma.
- Play Console 18 yaş altını kısıtlama seçeneği gösterirse hedefleme kararımızla uyumlu olacak şekilde etkinleştirilebilir.

## 6. İçerik derecelendirmesi / IARC

Anketi gerçek özelliklere göre doldur:

- Kullanıcı tarafından oluşturulan içerik / UGC: **Evet**
- Kullanıcılar çevrimiçi içerik yayınlayabilir: **Evet**
- Uygulama içi bildirme: **Evet**
- Kullanıcı engelleme: **Evet**
- Kumar/bahis: **Hayır**
- Cinsel içerik: **Hayır**
- Kontrollü madde satışı: **Hayır**

Uyarı: Kullanıcılar yaralı sokak hayvanı fotoğrafı yükleyebildiği için anket gerçekçi yaralanma/rahatsız edici görsel sorarsa otomatik olarak "Hayır" deme; yayınlanan içerik ve moderasyon kurallarına göre doğru cevap ver.

## 7. Veri Güvenliği / Data safety

Play Console → **Uygulama içeriği → Veri güvenliği**

Genel:

- Veri toplanıyor: **Evet**
- Veri paylaşılıyor: **Hayır** (Neon, Can Haritası adına hizmet sağlayıcı olarak kullanılıyor)
- Aktarım sırasında şifreleme: **Evet**
- Kullanıcı hesap/veri silme talebinde bulunabilir: **Evet**

Hesap silme web URL'si:
`https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/delete-account`

Veri türlerini `DATA_SAFETY_TR.md` dosyasındaki tabloya göre doldur.

## 8. Hesap silme

Uygulama içinde yol:
**Profil → Hesabımı ve verilerimi sil**

Harici web kaynağı:
`https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/delete-account`

Google Play'e yalnızca hesabı dondurduğumuzu söyleme; politika gereği ilişkili verilerin silinmesi gerekir.

## 9. Finansal özellikler

Play Console → **Uygulama içeriği → Finansal özellikler**

Cevap: **Uygulamam herhangi bir finansal özellik sunmuyor.**

## 10. Sağlık uygulamaları beyanı

Play Console → **Uygulama içeriği → Sağlık uygulamaları**

Cevap: **Uygulamam herhangi bir sağlık özelliği sunmuyor.**

Can Haritası sokak hayvanı yardım koordinasyonudur; insan sağlık verisi/Health Connect/fitness takibi yapmaz. "Veteriner" yardım kategorisi uygulamayı insan sağlık uygulaması yapmaz.

## 11. Devlet uygulaması beyanı

Resmi devlet kurumu uygulaması değildir. Form gösterildiğinde buna uygun şekilde **Hayır** seç.

## 12. Haber uygulaması / diğer zorunlu deklarasyonlar

Play Console formunda Haber uygulaması, finans, sağlık veya benzeri zorunlu beyan kartları görünürse ve uygulama bu özelliği sunmuyorsa açıkça **Hayır / sunmuyor** seçeneğini işaretle. Boş bırakma.

## 13. İzinler

Mevcut Android izinleri:

- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`
- `CAMERA`

Arka plan konum izni, SMS, arama kaydı, kişi listesi veya reklam kimliği izni kullanılmıyor. Kısıtlı izin beyanı isteyen ek özellik eklenmemeli.

## 14. Teknik yayın kontrolü

- Package: `com.fiel.canharitasi`
- Production dosyası: **AAB**
- `eas.json` production profili `app-bundle` üretir.
- Yeni uygulama için hedef API: **Android 16 / API 36 veya üstü**.
- Yayından önce Play Console **Pre-launch report** sonuçlarını kontrol et.
- Crash / ANR / boş-beyaz ekran olmadan gerçek telefonda tüm kritik akışı test et.

## 15. Yeni kişisel Play Console hesabıysa

Kişisel geliştirici hesabı **13 Kasım 2023'ten sonra oluşturulduysa**, üretime erişmeden önce kapalı testte en az **12 test kullanıcısının 14 gün boyunca kesintisiz opt-in** kalması gerekir. Production erişim başvurusunda test geri bildirimini ve yaptığın düzeltmeleri özetle.

## 16. Gönderimden önce elle tamamlanacak iki kritik alan

1. **Play Store geliştirici/destek e-postası:** doğrulanmış, çalışan adres olmalı; gizlilik soruları için de bu kanal kullanılacak.
2. **Google inceleme test hesabı:** yukarıdaki `[PLAY_REVIEW_TEST_EMAIL]` ve `[PLAY_REVIEW_TEST_PASSWORD]` yerlerine gerçekten çalışan hesap bilgileri girilmeli.

Bu ikisi gerçek hesap bilgisi gerektirdiği için kaynak pakette sabitlenmemiştir.


## 17. Reklam kimliği

Play Console → **Uygulama içeriği → Reklam kimliği**

- **Uygulamanız reklam kimliği kullanıyor mu?: Hayır**
- Mevcut bağımlılıklarda reklam/AdMob SDK'sı yoktur.
- `com.google.android.gms.permission.AD_ID` izni eklenmemelidir.
- Reklam kimliği sürüm uyarısını kaldırmak için sonuçların anlaşıldığını belirten onay kutusu işaretlenebilir.

## 18. Çocuk Güvenliği Standartları

Bu bölüm, uygulama sosyal/topluluk özellikleri nedeniyle gösterildiğinde şu şekilde doldurulur:

- **Güvenlik standartları URL'si:**  
  `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/child-safety`
- **İletişim e-postası:** `fiko3568@gmail.com`
- **Uygulama içi bildirim mekanizması:** Evet — her çağrıda **Bildir → Çocuk güvenliği**.
- **Yasalara uyum ve yetkili mercilere bildirim:** Evet — yayınlanan standartlar ve moderasyon runbook'u kapsamında.

Göndermeden önce canlı URL'nin oturum açmadan açıldığını, uygulamadaki Bildir seçeneğinin çalıştığını ve bildirimin `abuse_reports` tablosuna `cocuk_guvenligi_csae` nedeniyle kaydedildiğini doğrula.

## 19. Kullanıcı tarafından oluşturulan içerik (UGC)

Can Haritası kullanıcıların çağrı metni, fotoğraf ve topluluk bilgisi yayınlamasına izin verir.

- Kullanıcılar kayıt sırasında Kullanım Şartları ve Topluluk Kuralları'nı kabul eder.
- Yasaklanan içerikler herkese açık topluluk standartlarında açıklanır.
- Her çağrıda **Bildir** ve **Engelle** bulunur.
- Bildirimler moderasyon kuyruğuna kaydedilir.
- İçerik kaldırma, hesap kısıtlama/kapatma ve gerekli hukuki bildirim süreçleri vardır.

Topluluk standartları URL'si:  
`https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/community-standards`

## 20. Yasal merkez URL'leri

| Alan | URL |
|---|---|
| Gizlilik Politikası | `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/privacy` |
| Kullanım Şartları | `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/terms` |
| Topluluk Standartları | `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/community-standards` |
| Çocuk Güvenliği | `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/child-safety` |
| Veri Güvenliği Özeti | `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/data-safety` |
| Hesap ve Veri Silme | `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/delete-account` |
| Yasal/Güvenlik İletişimi | `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/support` |
