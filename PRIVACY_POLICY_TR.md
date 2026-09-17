# Can Haritası — Gizlilik Politikası

**Yürürlük tarihi:** 13 Eylül 2026  
**Sürüm:** 1.1

Can Haritası, yakındaki sokak hayvanı yardım çağrılarını görünür kılmak ve gönüllülerin koordinasyonunu kolaylaştırmak için tasarlanmıştır. Bu politika, Can Haritası uygulamasının kullanıcı ve cihaz verilerini nasıl işlediğini açıklar.

## Veri sorumlusu / geliştirici ve iletişim

Uygulamanın yayıncısı **Can Haritası geliştiricisidir**. Gizlilik, erişim, düzeltme ve veri işleme soruları için Google Play mağaza sayfasında yayınlanan **Geliştirici iletişim e-posta adresi** kullanılabilir. Hesap ve veri silme talepleri ayrıca aşağıdaki herkese açık silme formundan gönderilebilir.

> Play Console'a yüklemeden önce mağaza sayfasındaki destek/geliştirici e-posta adresinin doğrulanmış ve aktif olduğundan emin olun.

## İşlenen veriler

- **Hesap bilgileri:** ad, e-posta adresi, kullanıcı/hesap kimliği ve kimlik doğrulama/oturum bilgileri.
- **Konum:** uygulama açıkken yakındaki çağrıları bulmak için cihazın yaklaşık veya kesin konumu işlenir. Kişisel canlı konum diğer kullanıcılara yayınlanmaz. Kullanıcı bir yardım çağrısı oluşturduğunda seçilen olay konumu çağrının parçası olarak saklanır ve haritada gösterilir.
- **Kullanıcı içeriği:** yardım çağrısı bilgileri ve notları, hayvan türü ve ihtiyaç bilgisi, kullanıcının seçtiği/yüklediği fotoğraflar.
- **Uygulama eylemleri:** destek olma/yoldayım eylemleri, içerik bildirimleri ve kullanıcı engelleme kayıtları.
- **Güvenlik ve oturum verileri:** kimlik doğrulama ve altyapı hizmetleri güvenlik/kötüye kullanım önleme amacıyla IP adresi, kullanıcı aracısı, oturum zamanları ve ilişkili teknik tanımlayıcıları işleyebilir.

## Kullanım amaçları

Veriler; hesap oluşturmak ve güvenli oturum sağlamak, yakındaki çağrıları göstermek, yardım çağrısı ve fotoğraf yayınlamak, destek eylemlerini kaydetmek, topluluk güvenliği ve içerik moderasyonu sağlamak, kötüye kullanımı önlemek, hesap taleplerini yerine getirmek ve hizmeti işletmek için kullanılır.

## Paylaşım ve hizmet sağlayıcılar

Can Haritası kullanıcı verilerini reklam amacıyla satmaz ve reklam ağına aktarmaz. Uygulama adına veri işleyen altyapı hizmet sağlayıcıları olarak **Neon/Lakebase Postgres, Neon Auth, Neon Object Storage ve Neon Functions** kullanılır. Bu hizmetler verileri Can Haritası adına hizmeti çalıştırmak, güvenliğini sağlamak ve saklamak için işler. Yasal zorunluluk halinde yetkili makamlara yalnızca geçerli hukuki süreç kapsamında veri sağlanabilir.

## Güvenlik

Uygulama ile backend arasındaki veri aktarımı HTTPS/TLS üzerinden gerçekleştirilir. Kullanıcı fotoğrafları özel object storage alanında tutulur ve uygulama bunları kısa süreli imzalı bağlantılarla yükler/görüntüler. Oturum bilgileri cihazda güvenli depolama mekanizmasıyla saklanır.

## Saklama ve silme

Veriler hizmetin çalışması, güvenliği ve kullanıcı hesabının devamı için gerekli olduğu sürece saklanır. Hesap silme talebi işlendiğinde hesaba bağlı profil, çağrı, fotoğraf ve uygulama etkileşimleri silinir. Yasal veya güvenlik yükümlülükleri nedeniyle tutulması zorunlu kayıtlar yalnızca gerekli süre boyunca tutulur. Silme taleplerinin en geç 30 gün içinde sonuçlandırılması hedeflenir.

## Hesap ve veri silme

Kullanıcılar iki yoldan silme talebi gönderebilir:

1. Uygulama içinde **Profil → Hesabımı ve verilerimi sil**.
2. Herkese açık web formu:  
   `https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/delete-account`

Hesap silme yalnızca hesabı devre dışı bırakmak anlamına gelmez; hesaba bağlı kişisel verilerin kalıcı olarak silinmesi hedeflenir.

## Çocukların gizliliği

Can Haritası çocuklara yönelik değildir. Google Play hedef kitlesi **18 yaş ve üzeri** olarak beyan edilmelidir. Uygulama çocuklara yönelik pazarlanmamalıdır.

## Politika bağlantısı

`https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech/privacy`

## v1.3 Topluluk özellikleri

Can Haritası'nın topluluk özellikleri etkinleştirildiğinde aşağıdaki ek veriler işlenebilir:

- **Gönüllü becerileri:** Kullanıcının kendi isteğiyle seçtiği araçla taşıma, taşıma çantası/kafesi, geçici yuva, veterinere götürme ve mama-su desteği seçenekleri.
- **Bildirim tercihleri:** Kullanıcının seçtiği yakınlık yarıçapı, aciliyet filtresi ve hayvan türü tercihleri.
- **Mama / su noktaları:** Kullanıcının bilinçli olarak ortak topluluk noktası olarak eklediği konum, nokta türü ve isteğe bağlı kısa not. Bu kayıt kişisel canlı konum takibi değildir.
- **Vaka geçmişi:** Yardım çağrısının oluşturulması ve gönüllü yardım eylemleri gibi topluluk olaylarının zaman bilgisi.
- **Konum gizliliği:** Yardım çağrısı oluştururken kullanıcı yaklaşık veya tam konum görünürlüğünü seçebilir. Yaklaşık görünürlükte diğer kullanıcılara koordinatlar azaltılmış hassasiyetle gösterilir.

Bu veriler uygulama işlevselliği, güvenli gönüllü eşleştirmesi, yakın çağrı filtreleme ve topluluk koordinasyonu amacıyla kullanılır. Reklam hedefleme veya veri satışı amacıyla kullanılmaz.
