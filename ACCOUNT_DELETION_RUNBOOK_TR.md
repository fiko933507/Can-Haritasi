# Can Haritası — Hesap silme operasyonu

Kullanıcı silme talebi iki kaynaktan gelir:

- uygulama RPC: `request_my_account_deletion`
- web RPC: `request_account_deletion_by_email`

Talepler `public.account_deletion_requests` tablosunda `pending` durumuyla izlenir.

## İşlem sırası

1. Bekleyen talebin `auth_user_id` değerini doğrula.
2. Kullanıcının `profiles.id` değerini bul.
3. Kullanıcının oluşturduğu raporlara bağlı `report_images.storage_key` değerlerini **silmeden önce** listele.
4. İlgili storage nesnelerini `can-haritasi-media` bucket'ından sil.
5. Kullanıcıya bağlı uygulama verilerini sil: yorumlar, destek eylemleri, sighting/favorite/bildirim/engelleme kayıtları; ardından kullanıcının raporları ve profili.
6. Neon Auth dizinindeki kullanıcıyı aynı `auth_user_id` ile sil. Auth `account` ve `session` kayıtları CASCADE ile temizlenir.
7. Silme talebini `completed` olarak işaretle ve mümkün olan en kısa sürede talep içindeki e-posta/reason gibi kişisel alanları temizle veya operasyon politikasına göre kaydı sil.

## Hizmet seviyesi

Silme talebini mümkün olan en kısa sürede, **en geç 30 gün içinde** işle.

## Güvenlik

Web formu bir e-posta adresinin sistemde kayıtlı olup olmadığını kullanıcıya açıklamaz. Üretimde yalnızca gerçekten mevcut hesaplar için silme kuyruğu kaydı oluşturulur.
