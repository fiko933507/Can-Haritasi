# Can Haritası live backend

Bu dosya canlı altyapının gizli olmayan envanteridir.

- Neon project: `can-haritasi` / `silent-waterfall-37853270`
- Branch: `main` / `br-dry-boat-ayf159cc`
- Database: `canharitasi`
- Region: `aws-us-east-2`
- Private bucket: `can-haritasi-media`
- Function: `media`

## Uygulama tabloları

`profiles`, `animal_reports`, `report_images`, `sightings`, `help_actions`, `comments`, `favorites`, `abuse_reports`.

Tüm uygulama tablolarında RLS açıktır. `anonymous` ve `authenticated` rollerinden doğrudan tablo erişimi kaldırılmıştır. Mobil uygulama yalnızca `authenticated` rolüne verilmiş SECURITY DEFINER RPC'leri çağırır.

Aktif mobil RPC'ler:

- `ensure_profile`
- `my_profile`
- `create_animal_report`
- `nearby_reports_v2`
- `my_reports`
- `mark_help`
- `add_report_image`

Konum alanları PostGIS `geography(Point,4326)` olarak tutulur ve spatial index kullanır.
