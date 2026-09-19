# Can Haritası v1.4.1 — Google Play yayın kontrol listesi

## Kod / backend

- [x] Expo SDK 57 / React Native 0.86.3
- [x] Android package: `com.fiel.canharitasi`
- [x] Android target SDK, Expo 57 build zincirinde API 36
- [x] Neon Auth + Data API + private media storage
- [x] Gerçek konum ve harita
- [x] Gerçek çağrı oluşturma ve fotoğraf yükleme
- [x] Kullanıcı şart onayı akışı
- [x] UGC bildir / engelle kullanıcı arayüzü
- [x] Hesap silme talebi — uygulama içi
- [x] Hesap silme talebi — harici web sayfası
- [x] Gizlilik, Kullanım Şartları, Topluluk Standartları ve Çocuk Güvenliği — uygulama içinden erişilebilir
- [x] Çocuk güvenliği için ayrı bildirim nedeni ve öncelikli moderasyon kaydı
- [x] Herkese açık çocuk güvenliği standartları ve iletişim adresi
- [x] EAS production profili `app-bundle`
- [x] 1024×1024 uygulama ikonu
- [x] 1024×500 feature graphic
- [x] Ana Neon branch'ine v1.2 Play Store politika migrasyonu uygulandı
- [x] Ana Neon branch'ine v1.3 topluluk migrasyonu uygulandı
- [x] Production `notify` Function deploy edildi
- [x] Production `legal` Function v1.3 veri kullanımıyla güncellendi
- [x] Web hesap silme e-posta doğrulaması production'da test edildi

## Zorunlu son cihaz testi

- [ ] Yeni hesap oluştur
- [ ] Şartlar kabulünü doğrula
- [ ] Giriş/çıkış
- [ ] Konum izni reddet → düzgün hata
- [ ] Konum izni ver → yakın çağrılar
- [ ] Harita ve pinler
- [ ] Çağrı oluştur
- [ ] Kameradan fotoğraf
- [ ] Galeriden fotoğraf
- [ ] Destek ol
- [ ] Bildir
- [ ] Engelle → içerik listeden kaybolmalı
- [ ] Uygulama içi hesap silme talebi
- [ ] Web hesap silme formu
- [ ] Gizlilik/Şartlar/Topluluk/Çocuk Güvenliği bağlantıları
- [ ] Bildir → Çocuk güvenliği → abuse_reports kaydı
- [ ] Soğuk açılış ve yeniden giriş
- [ ] Akıllı bildirim opt-in testi
- [ ] Mama / su noktası ekle-yenile testi
- [ ] Yaklaşık / tam konum görünürlüğü testi
- [ ] Mükerrer çağrı uyarısı testi
- [ ] Vaka geçmişi testi

## Play Console

- [ ] Privacy Policy URL gir
- [ ] Data Safety formunu `DATA_SAFETY_TR.md` ile doldur
- [ ] Çocuk Güvenliği: standart URL + fiko3568@gmail.com + iki onay
- [ ] Reklam kimliği: Hayır
- [ ] UGC bildirme/engelleme/moderasyon mekanizmalarını doğrula
- [ ] App access: giriş gerekiyorsa inceleme hesabı sağla
- [ ] Ads: **No**
- [ ] Target audience: **18 and over**
- [ ] Content rating formunu gerçek özelliklere göre doldur (UGC + konum + kullanıcı etkileşimi)
- [ ] Category: Lifestyle
- [ ] Store listing metinlerini gir
- [ ] Gerçek telefondan en az 2 mağaza ekran görüntüsü al
- [ ] Feature graphic yükle
- [ ] Uygulama ikonu kontrol et
- [ ] Geliştirici destek e-postasını Play Console'da doğrula
- [ ] Production AAB yükle
- [ ] Önce Internal testing track'te kurulum + smoke test
- [ ] Pre-launch report hatalarını incele
- [ ] Ardından Production rollout

## Release üretimi

EAS kotası uygunsa:

```powershell
cd C:\CH
npx eas-cli@latest build --platform android --profile production
```

Yerel AAB için (Windows, Android toolchain kurulu):

```powershell
cd C:\CH
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat bundleRelease
```

> Yerel `bundleRelease` için release signing yapılandırmasının production keystore ile eşleşmesi gerekir. EAS tarafında daha önce oluşturulan remote Android keystore tercih edilir.
