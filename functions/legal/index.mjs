const API = 'https://ep-red-lake-ayk3kz85.apirest.c-5.us-east-2.aws.neon.tech/canharitasi/rest/v1';
const CONTACT = 'fiko3568@gmail.com';
const UPDATED = '19 Eylül 2026';

const style = `<style>
:root{color-scheme:light}*{box-sizing:border-box}body{font:16px/1.62 system-ui,-apple-system,Segoe UI,sans-serif;max-width:860px;margin:0 auto;padding:32px 18px;color:#17342c;background:#f5f2ea}main{background:#fff;padding:clamp(22px,5vw,46px);border-radius:22px;box-shadow:0 8px 32px #17342c14}nav{display:flex;gap:10px 16px;flex-wrap:wrap;padding:12px 0 20px;border-bottom:1px solid #dfe7e2}a{color:#a74232;font-weight:650}h1{font-size:clamp(28px,5vw,42px);line-height:1.15}h2{margin-top:30px;font-size:22px}li{margin:8px 0}.notice{padding:16px;border-radius:14px;background:#fff3e6;border-left:5px solid #e8a84e}.danger{background:#fff0f0;border-left-color:#c84545}.muted{color:#607069}input,textarea{width:100%;padding:12px;margin:6px 0 12px;border:1px solid #aebdb5;border-radius:10px;font:inherit}button{padding:12px 18px;background:#17342c;color:#fff;border:0;border-radius:10px;font-weight:700}footer{margin-top:32px;padding-top:18px;border-top:1px solid #dfe7e2;color:#607069;font-size:14px}</style>`;

const nav = `<nav aria-label="Yasal sayfalar">
<a href="/privacy">Gizlilik</a><a href="/terms">Kullanım şartları</a><a href="/community-standards">Topluluk standartları</a><a href="/child-safety">Çocuk güvenliği</a><a href="/data-safety">Veri güvenliği</a><a href="/delete-account">Hesap silme</a><a href="/support">İletişim</a>
</nav>`;

const shell = (title, body) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>${title} · Can Haritası</title>${style}</head><body><main><p>🐾 <strong>Can Haritası</strong></p>${nav}<h1>${title}</h1>${body}<footer>Yayıncı: Can Haritası geliştiricisi · İletişim: <a href="mailto:${CONTACT}">${CONTACT}</a><br>Son güncelleme: ${UPDATED}</footer></main></body></html>`;

const privacy = shell('Gizlilik Politikası', `
<p>Bu politika, <strong>Can Haritası</strong> mobil uygulamasının kişisel verileri nasıl işlediğini açıklar. Uygulama, sokak hayvanları için konum tabanlı yardım çağrıları ve gönüllü koordinasyonu sağlar.</p>
<h2>Veri sorumlusu ve iletişim</h2>
<p>Veri sorumlusu/yayıncı, Google Play mağaza girişinde gösterilen Can Haritası geliştiricisidir. Gizlilik ve veri hakları talepleri için <a href="mailto:${CONTACT}">${CONTACT}</a> adresine başvurabilirsiniz.</p>
<h2>İşlenen veriler</h2>
<ul>
<li>Ad, e-posta, kullanıcı kimliği ve güvenli oturum bilgileri.</li>
<li>Uygulama açıkken yakın çağrıları bulmak için yaklaşık veya kesin cihaz konumu; kullanıcı çağrı oluşturduğunda olay konumu.</li>
<li>Yardım çağrısı metni, hayvan/ ihtiyaç bilgisi, isteğe bağlı fotoğraf ve kullanıcı tarafından oluşturulan diğer içerikler.</li>
<li>Destek eylemleri, bildirim tercihleri, gönüllü becerileri, mama-su noktaları ve vaka geçmişi.</li>
<li>İçerik bildirimleri, engelleme kayıtları ve güvenlik/kötüye kullanım önleme verileri.</li>
<li>İsteğe bağlı bildirimler etkinse Expo push tokenı, cihaz platformu ve eşleştirme için azaltılmış hassasiyette yaklaşık konum.</li>
<li>Altyapının güvenliği için IP adresi, kullanıcı aracısı, oturum zamanı ve teknik günlükler.</li>
</ul>
<h2>Amaçlar ve hukuki dayanak</h2>
<p>Veriler; hesabı ve oturumu yönetmek, yakın çağrıları göstermek, içerik/fotoğraf yayınlamak, gönüllü eşleştirmesi yapmak, bildirim göndermek, hizmet güvenliğini ve moderasyonu sağlamak, kötüye kullanımı önlemek, kullanıcı taleplerini yerine getirmek ve hukuki yükümlülüklere uymak için işlenir.</p>
<h2>Paylaşım ve hizmet sağlayıcılar</h2>
<p>Veriler reklam amacıyla satılmaz ve reklam ağına aktarılmaz. Neon/Lakebase Postgres, Neon Auth, Neon Object Storage, Neon Functions, Expo bildirim altyapısı ve harita katmanı sağlayıcıları hizmeti Can Haritası adına çalıştırmak için kullanılabilir. Geçerli hukuki zorunlulukta yetkili mercilerle gerekli veriler paylaşılabilir.</p>
<h2>Konum ve fotoğraflar</h2>
<p>Kişisel canlı konum diğer kullanıcılara yayınlanmaz. Yakındaki çağrı sorgusunda konum sunucuya iletilebilir. Kullanıcı, oluşturduğu olay kaydı için yaklaşık veya tam görünürlük seçebilir. Fotoğraf ekleme isteğe bağlıdır; fotoğraflar özel depoda tutulur ve süreli bağlantılarla görüntülenir.</p>
<h2>Saklama, güvenlik ve kullanıcı hakları</h2>
<p>Aktarım HTTPS/TLS ile korunur; oturum verileri cihazın güvenli depolama alanında tutulur. Veriler hizmet, güvenlik ve hukuki yükümlülük için gerekli süre boyunca saklanır. Erişim, düzeltme ve silme talepleri iletişim adresine gönderilebilir.</p>
<p>Hesap ve ilişkili veriler uygulama içinden veya <a href="/delete-account">hesap silme sayfasından</a> silme talebine konu edilebilir. Hedef işlem süresi en fazla 30 gündür; hukuken tutulması zorunlu güvenlik kayıtları yalnızca gereken süre saklanır.</p>
<h2>Çocukların gizliliği</h2>
<p>Can Haritası çocuklara yönelik değildir ve mağazada 18 yaş ve üzeri kitleye sunulur. Bununla birlikte çocuk güvenliğiyle ilgili her bildirim öncelikli ele alınır. Ayrıntılar için <a href="/child-safety">Çocuk Güvenliği Standartları</a> sayfasını inceleyin.</p>
`);

const terms = shell('Kullanım Şartları', `
<p>Can Haritası sokak hayvanlarına yardım koordinasyonu içindir. Hesap oluşturan veya içerik yayınlayan kullanıcılar bu şartları ve <a href="/community-standards">Topluluk Standartları</a>'nı kabul eder.</p>
<h2>Hesap ve uygun kullanım</h2>
<ul><li>Bilgiler doğru ve güncel olmalı; hesap güvenliği korunmalıdır.</li><li>Yalnızca gerçek yardım ihtiyacı ve ilgili olay konumu paylaşılmalıdır.</li><li>Başkasının kişisel verisi, özel adresi veya izinsiz görüntüsü yayımlanmamalıdır.</li></ul>
<h2>Yasaklanan kullanım</h2>
<p>Sahte çağrı, spam, dolandırıcılık, taciz, nefret, tehdit, kişisel veri ifşası, yasa dışı içerik, hayvan istismarı, cinsel içerik, çocukları tehlikeye atan davranış, CSAM/CSAE, telif veya diğer hak ihlali yasaktır.</p>
<h2>Kullanıcı içeriği ve moderasyon</h2>
<p>Kullanıcı içerikten sorumludur. Can Haritası bildirilen veya tespit edilen içeriği inceleyebilir; görünürlüğünü kaldırabilir, silebilir, hesabı sınırlandırabilir veya kapatabilir ve hukuken gerekli durumlarda yetkili mercilere bildirebilir. Her çağrıda Bildir ve Engelle seçenekleri bulunur.</p>
<h2>Hizmetin sınırları</h2>
<p>Can Haritası veterinerlik, kolluk, resmi kurtarma veya garantili acil durum hizmeti değildir. Can Bilgisi içerikleri genel bilgilendirmedir ve profesyonel veteriner tavsiyesinin yerine geçmez.</p>
<h2>Hesap sonlandırma ve değişiklikler</h2>
<p>Kullanıcı hesabının silinmesini isteyebilir. Ağır veya tekrarlanan ihlallerde erişim sınırlandırılabilir. Önemli şart değişikliklerinde yeni sürüm yayınlanır ve gerektiğinde uygulama içinde yeniden onay istenir.</p>
<p><strong>Şart sürümü:</strong> 2026-09-13</p>
`);

const community = shell('Topluluk ve İçerik Standartları', `
<p>Bu standartlar Can Haritası'ndaki yardım çağrıları, fotoğraflar, profil bilgileri, gönüllü becerileri, mama-su noktaları ve diğer kullanıcı içeriklerinin tamamında geçerlidir.</p>
<h2>İzin verilen kullanım</h2>
<ul><li>Gerçek ve doğrulanabilir sokak hayvanı yardım ihtiyaçları.</li><li>Yardımı kolaylaştıran, saygılı ve konuyla ilgili bilgiler.</li><li>Kurtarma için gerekli, ölçülü ve mahremiyete saygılı fotoğraflar.</li></ul>
<h2>Yasak içerik ve davranış</h2>
<ul><li>Yanıltıcı veya uydurma çağrı, spam, dolandırıcılık ve ticari reklam.</li><li>Tehdit, taciz, zorbalık, nefret söylemi veya ayrımcılık.</li><li>Kişisel veri, özel adres, kimlik belgesi veya izinsiz görüntü paylaşımı.</li><li>Hayvana zarar verme, şiddeti teşvik etme veya istismarı normalleştirme.</li><li>Cinsel/müstehcen içerik, CSAE veya CSAM dahil çocukları istismar eden ya da tehlikeye atan her türlü içerik.</li><li>Kurtarma amacı için gerekli olmayan aşırı grafik görüntüler.</li><li>Telif, marka, gizlilik veya başka kişilerin haklarını ihlal eden içerik.</li></ul>
<h2>Bildir, engelle ve yaptırımlar</h2>
<p>Her yardım çağrısındaki <strong>Bildir</strong> seçeneğiyle normal ihlal veya çocuk güvenliği nedeni seçilebilir. <strong>Engelle</strong> seçeneği ilgili kullanıcının içeriklerini gizler. Bildirimler moderasyon kuyruğunda incelenir; içerik kaldırma, hesap kısıtlama/kapatma ve gerekli hukuki bildirim uygulanabilir.</p>
<p class="notice">Şüpheli yasa dışı materyali indirmeyin, kaydetmeyin veya yeniden paylaşmayın. Uygulama içindeki Çocuk güvenliği seçeneğini kullanın.</p>
`);

const childSafety = shell('Çocuk Güvenliği Standartları', `
<p><strong>Can Haritası, çocuğun cinsel istismarı ve çocuk istismarına (CSAE) ve çocukların cinsel istismarı nitelikli materyale (CSAM) karşı sıfır tolerans uygular.</strong> Bu standartlar uygulamanın yayıncısı Can Haritası geliştiricisi adına dünya genelinde herkese açık olarak yayınlanmıştır.</p>
<h2>Kesin olarak yasaklananlar</h2>
<ul><li>CSAM'nin oluşturulması, yüklenmesi, saklanması, bağlantısının paylaşılması, talep edilmesi veya dağıtılması.</li><li>Çocuklara yönelik cinsel amaçlı iletişim, grooming, şantaj, tehdit, insan ticareti veya istismar girişimi.</li><li>Çocuğu cinselleştiren, tehlikeye atan veya istismarı kolaylaştıran içerik ve davranış.</li></ul>
<h2>Uygulama içinden bildirim</h2>
<p>Bir yardım çağrısında <strong>Bildir → Çocuk güvenliği</strong> yolunu kullanın. Bu bildirimler <strong>cocuk_guvenligi_csae</strong> nedeni ile öncelikli moderasyon kuyruğuna kaydedilir. Genel bir endişe için Profil → Çocuk güvenliği ve bildirim bağlantısını veya <a href="mailto:${CONTACT}?subject=Can%20Haritas%C4%B1%20%C3%87ocuk%20G%C3%BCvenli%C4%9Fi%20Bildirimi">${CONTACT}</a> adresini kullanabilirsiniz.</p>
<p class="notice danger"><strong>Şüpheli yasa dışı materyali indirmeyin, ekran görüntüsü almayın, kaydetmeyin veya yeniden paylaşmayın.</strong> Acil tehlike varsa bulunduğunuz yerdeki kolluk/acil yardım birimine doğrudan başvurun.</p>
<h2>İnceleme ve yaptırım</h2>
<p>Can Haritası bildirilen içeriği öncelikli inceler; ihlal içeriğini kaldırır veya erişimi keser, ilgili hesabı sınırlandırabilir ya da kapatabilir, delillerin hukuka uygun biçimde korunmasını sağlar ve geçerli yasa gerektiriyorsa yetkili ulusal/bölgesel mercilere rapor verir. İyi niyetli bildirim yapan kullanıcıya karşı misilleme yapılmaz.</p>
<h2>İletişim kişisi</h2>
<p>CSAM önleme uygulamaları ve Google Play Çocuk Güvenliği Standartları uyumu hakkında bilgi vermekle görevli iletişim adresi: <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
`);

const dataSafety = shell('Veri Güvenliği Özeti', `
<p>Bu sayfa, Can Haritası'nın Google Play Veri Güvenliği beyanının kullanıcıya yönelik özetidir.</p>
<ul><li>Veri aktarımı HTTPS/TLS ile şifrelenir.</li><li>Reklam gösterilmez; reklam kimliği kullanılmaz ve veriler reklam amacıyla satılmaz.</li><li>Ad, e-posta ve kullanıcı kimliği hesap yönetimi için işlenir.</li><li>Yaklaşık/kesin konum yakın çağrılar ve kullanıcının oluşturduğu olay kaydı için işlenir.</li><li>Fotoğraf ve kullanıcı içerikleri yalnızca kullanıcı ilgili özelliği kullandığında işlenir.</li><li>Bildirim, engelleme ve moderasyon kayıtları güvenlik ve politika uygulaması için işlenir.</li><li>İsteğe bağlı bildirimlerde push tokenı ve azaltılmış hassasiyette konum kullanılabilir.</li><li>Kullanıcılar uygulama içinden veya web üzerinden hesap ve veri silme talebinde bulunabilir.</li></ul>
<p>Detaylar için <a href="/privacy">Gizlilik Politikası</a>'nı okuyun.</p>
`);

const support = shell('Yasal ve Güvenlik İletişimi', `
<p>Gizlilik, hesap silme, topluluk güvenliği, telif/hak ihlali veya çocuk güvenliği konularında <a href="mailto:${CONTACT}">${CONTACT}</a> adresine ulaşabilirsiniz.</p>
<ul><li><strong>Çocuk güvenliği:</strong> Konuya “Can Haritası Çocuk Güvenliği Bildirimi” yazın. Yasa dışı materyali e-postaya eklemeyin.</li><li><strong>Gizlilik/veri hakkı:</strong> Hesabınızda kullandığınız e-postadan başvurun.</li><li><strong>İçerik bildirimi:</strong> Mümkünse uygulama içindeki Bildir düğmesini kullanın; çağrı kimliği otomatik kaydedilir.</li></ul>
`);

const form = (message = '') => shell('Hesap ve Verileri Silme', `
<p>Hesabınızı ve hesaba bağlı profil, çağrı, fotoğraf, destek eylemi ve uygulama etkileşimlerini silmek için kayıtlı e-posta adresinizle talep gönderin. Güvenlik için adresin sistemde kayıtlı olup olmadığını açıklamayız.</p>
${message ? `<p class="notice"><strong>${message}</strong></p>` : ''}
<form method="post"><label for="email">E-posta</label><input id="email" name="email" type="email" required maxlength="254"><label for="reason">İsteğe bağlı not</label><textarea id="reason" name="reason" maxlength="1000"></textarea><button type="submit">Silme talebi gönder</button></form>
<p>Talep mümkün olan en kısa sürede ve en geç 30 gün içinde işlenir. Hukuki/güvenlik zorunluluğu bulunan sınırlı kayıtlar yalnızca gerekli süre boyunca tutulabilir.</p>
`);

const html = (body, status = 200) => new Response(body, {
  status,
  headers: {
    'content-type': 'text/html;charset=utf-8',
    'cache-control': 'public, max-age=300',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    'referrer-policy': 'no-referrer',
  },
});

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (request.method === 'GET') {
      if (path === '/' || path === '/privacy') return html(privacy);
      if (path === '/terms') return html(terms);
      if (path === '/community-standards') return html(community);
      if (path === '/child-safety') return html(childSafety);
      if (path === '/data-safety') return html(dataSafety);
      if (path === '/support') return html(support);
      if (path === '/delete-account') return html(form());
      if (path === '/health') return Response.json({ ok: true, updated: '2026-09-19' });
    }

    if (path === '/delete-account' && request.method === 'POST') {
      const data = await request.formData();
      const email = String(data.get('email') || '').trim().toLowerCase();
      const reason = String(data.get('reason') || '').slice(0, 1000);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return html(form('Geçerli bir e-posta adresi girin.'), 400);

      const result = await fetch(API + '/rpc/request_account_deletion_by_email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ p_email: email, p_reason: reason || null }),
      });
      return html(form(result.ok
        ? 'Talebiniz alındı.'
        : 'Talep şu anda kaydedilemedi; lütfen daha sonra tekrar deneyin.'), result.ok ? 200 : 503);
    }

    return new Response('Not found', { status: 404 });
  },
};
