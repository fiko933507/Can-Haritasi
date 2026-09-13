# Can Haritası — İçerik moderasyonu runbook

## Uygulama içi önlemler

- Her çağrıda **Bildir** butonu bulunur.
- Her çağrıda **Engelle** butonu bulunur.
- Engellenen kullanıcının çağrıları `nearby_reports_v3` sorgusunda iki yönlü olarak gizlenir.
- Yayın öncesi güncel Topluluk Kuralları kabulü zorunludur.
- Çağrı yayınlayan kullanıcı, içeriğin doğru ve kurallara uygun olduğunu yayın ekranında görür.

## Moderasyon kuyruğu

Bildirimler `public.abuse_reports` tablosuna `pending` durumuyla gelir.

Önerilen günlük işlem:

1. `pending` bildirimleri en eskiden yeniye incele.
2. İlgili çağrı metni/fotoğrafı ve bildirim nedenini kontrol et.
3. Açık ihlal varsa `animal_reports.is_public=false` veya uygun moderasyon durumuna geçir.
4. Tekrarlanan/ağır ihlalde Neon Auth kullanıcısını kısıtla/banla.
5. `abuse_reports.status` alanını `resolved` veya ekipte kullanılan karşılıkla güncelle; kısa işlem notu tut.
6. Acil hayvan güvenliği/kanuna aykırı içerikte gerektiğinde yerel yasal sürece göre hareket et.

## Öncelikli ihlaller

- Hayvana zarar verme / şiddet teşviki
- Çocuk güvenliği riski
- Tehdit / taciz / kişisel veri ifşası
- Dolandırıcılık / sahte yardım çağrısı
- Aşırı grafik veya cinsel içerik
