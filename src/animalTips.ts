export type AnimalTip = {
  id: string;
  animal: 'Kedi' | 'Köpek' | 'Genel';
  category: 'Acil' | 'Davranış' | 'Bakım' | 'Güvenlik';
  title: string;
  body: string;
  action: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const ANIMAL_TIPS: AnimalTip[] = [
  {
    id: 'cat-lily',
    animal: 'Kedi',
    category: 'Acil',
    title: 'Biraz zambak poleni bile acil olabilir',
    body: 'Gerçek zambak ve daylily türlerinde yaprak, çiçek, polen ve hatta vazo suyu kedilerde ciddi böbrek hasarına yol açabilir.',
    action: 'Temas veya yutma şüphesinde belirti beklemeden veterinerle iletişime geç.',
    sourceLabel: 'U.S. FDA',
    sourceUrl: 'https://www.fda.gov/animal-veterinary/animal-health-literacy/lovely-lilies-and-curious-cats-dangerous-combination',
  },
  {
    id: 'dog-xylitol',
    animal: 'Köpek',
    category: 'Acil',
    title: 'Şekersiz sakızdaki ksilitol köpekler için tehlikeli',
    body: 'Ksilitol; şekersiz sakız, bazı şekerlemeler, diş macunları ve başka ürünlerde bulunabilir. Köpeklerde hızlı ve ciddi kan şekeri düşüşüne neden olabilir.',
    action: 'Ürün etiketini kontrol et ve yutma şüphesinde acil veteriner desteği al.',
    sourceLabel: 'U.S. FDA',
    sourceUrl: 'https://www.fda.gov/animal-veterinary/animal-health-literacy/paws-xylitol-toxic-dogs',
  },
  {
    id: 'dog-tail',
    animal: 'Köpek',
    category: 'Davranış',
    title: 'Kuyruk sallamak her zaman “dostum” demek değildir',
    body: 'Kuyruk hareketi tek başına güvenli yaklaşma işareti değildir. Bedenin gerginliği, kulaklar, bakış, ağız ve hayvanın uzaklaşma isteği birlikte okunmalıdır.',
    action: 'Tanımadığın köpeğe yaklaşmadan önce bütün beden dilini izle ve kaçış alanı bırak.',
    sourceLabel: 'RSPCA',
    sourceUrl: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour/understanding',
  },
  {
    id: 'cat-pain',
    animal: 'Kedi',
    category: 'Bakım',
    title: 'Kediler ağrıyı çok sessiz gösterebilir',
    body: 'Daha az zıplama, merdivenden kaçınma, kum kabına girip çıkmakta zorlanma veya kendini daha az temizleme eklem ağrısının ince işaretleri olabilir.',
    action: 'Davranıştaki kalıcı değişiklikleri “yaşlandı” diye geçiştirmeden veteriner değerlendirmesi düşün.',
    sourceLabel: 'Cornell Feline Health Center',
    sourceUrl: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/your-cat-slowing-down',
  },
  {
    id: 'snack-bag',
    animal: 'Genel',
    category: 'Güvenlik',
    title: 'Boş cips ve atıştırmalık poşetleri boğulma riski taşır',
    body: 'İnce yiyecek poşetleri hayvanın başına geçtiğinde nefesle yüz ve burun çevresine yapışarak ciddi boğulma riski oluşturabilir.',
    action: 'Sokakta ve evde boş yiyecek poşetlerini kapalı çöp kutusuna at.',
    sourceLabel: 'U.S. FDA',
    sourceUrl: 'https://www.fda.gov/consumers/consumer-updates/keep-your-dogs-and-cats-safe-holiday-hazards',
  },
  {
    id: 'dog-warning',
    animal: 'Köpek',
    category: 'Davranış',
    title: 'Esneme ve dudak yalama bazen “rahat değilim” mesajıdır',
    body: 'Köpekler gerilim anında bakışı kaçırma, başını çevirme, dudak yalama, esneme ve uzaklaşma gibi sinyaller gösterebilir.',
    action: 'Bu işaretleri görürsen teması zorlamak yerine mesafeyi artır.',
    sourceLabel: 'RSPCA',
    sourceUrl: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour/aggression',
  },
  {
    id: 'chocolate',
    animal: 'Köpek',
    category: 'Acil',
    title: 'Pişirme çikolatası özellikle risklidir',
    body: 'Çikolata evcil hayvanlarda ciddi zehirlenmeye yol açabilir; şekersiz veya pişirme çikolatası toksik bileşenleri daha yoğun içerebilir.',
    action: 'Ne kadar yediğini tahmin etmeye çalışırken vakit kaybetmeden veterinerle iletişime geç.',
    sourceLabel: 'U.S. FDA',
    sourceUrl: 'https://www.fda.gov/consumers/consumer-updates/keep-your-dogs-and-cats-safe-holiday-hazards',
  },
  {
    id: 'hot-car', animal: 'Genel', category: 'Güvenlik',
    title: 'Park edilmiş araç dakikalar içinde tehlikeli olabilir',
    body: 'Ilık görünen havalarda bile kapalı araç içi hızla ısınabilir; aralık bırakılmış cam güvenli sıcaklığı garanti etmez.',
    action: 'Hayvanı kısa süre için bile park edilmiş araçta yalnız bırakma.',
    sourceLabel: 'RSPCA', sourceUrl: 'https://www.rspca.org.uk/adviceandwelfare/pets/general/hotweather',
  },
  {
    id: 'cat-string', animal: 'Kedi', category: 'Güvenlik',
    title: 'İp ve kurdele oyuncakları gözetimsiz bırakılmamalı',
    body: 'Yutulan ip, kurdele ve benzeri uzun nesneler sindirim sisteminde ciddi hasara yol açabilir.',
    action: 'Oyun bitince ipli oyuncakları kapalı bir yere kaldır; yutma şüphesinde çekmeye çalışma.',
    sourceLabel: 'Cornell Feline Health Center', sourceUrl: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center',
  },
  {
    id: 'dog-grapes', animal: 'Köpek', category: 'Acil',
    title: 'Üzüm ve kuru üzüm köpekler için güvenli değildir',
    body: 'Az miktar üzüm veya kuru üzüm bile bazı köpeklerde ciddi böbrek hasarıyla ilişkilendirilebilir.',
    action: 'Yutma şüphesinde belirti beklemeden veteriner desteği al.',
    sourceLabel: 'U.S. FDA', sourceUrl: 'https://www.fda.gov/animal-veterinary/animal-health-literacy/potentially-dangerous-items-your-pet',
  },
  {
    id: 'medicines', animal: 'Genel', category: 'Acil',
    title: 'İnsan ilaçları hayvanlara kendi kararınla verilmemeli',
    body: 'İnsanlarda kullanılan bazı ağrı kesiciler ve başka ilaçlar kedi ve köpekler için toksik olabilir.',
    action: 'İlaçları erişilemeyecek yerde tut; temas şüphesinde ambalajla birlikte veterineri ara.',
    sourceLabel: 'U.S. FDA', sourceUrl: 'https://www.fda.gov/animal-veterinary/animal-health-literacy/potentially-dangerous-items-your-pet',
  },
  {
    id: 'cat-hiding', animal: 'Kedi', category: 'Davranış',
    title: 'Saklanma davranışındaki ani artış önemli olabilir',
    body: 'Kediler korku, stres veya rahatsızlık yaşadığında daha fazla saklanabilir; ani ve kalıcı değişiklikler izlenmelidir.',
    action: 'Güvenli saklanma alanı sun ve iştah, tuvalet veya hareket değişikliği eşlik ediyorsa veteriner görüşü al.',
    sourceLabel: 'Cornell Feline Health Center', sourceUrl: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information',
  },
  {
    id: 'dog-space', animal: 'Köpek', category: 'Davranış',
    title: 'Tanımadığın köpeğin üstüne eğilmek tehdit gibi algılanabilir',
    body: 'Doğrudan yaklaşmak, uzun göz teması ve hayvanın başına uzanmak bazı köpeklerde baskı hissi yaratabilir.',
    action: 'Yandan dur, mesafe bırak ve köpeğin teması kendisinin başlatmasına izin ver.',
    sourceLabel: 'RSPCA', sourceUrl: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour/understanding',
  },
  {
    id: 'water-bowl', animal: 'Genel', category: 'Bakım',
    title: 'Ortak su kapları düzenli temizlenmeli',
    body: 'Açıkta duran su kaplarında kir, yosun ve biyofilm oluşabilir; yalnızca üzerine su eklemek yeterli değildir.',
    action: 'Kabı günlük kontrol et, suyu yenile ve yüzeyi güvenli biçimde temizle.',
    sourceLabel: 'RSPCA', sourceUrl: 'https://www.rspca.org.uk/adviceandwelfare/pets/general',
  },
];

export function tipOfTheDay(date = new Date()) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return ANIMAL_TIPS[day % ANIMAL_TIPS.length]!;
}

export function tipDeckForDay(date = new Date(), count = 6) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return Array.from({ length: Math.min(count, ANIMAL_TIPS.length - 1) }, (_, offset) => ANIMAL_TIPS[(day + offset + 1) % ANIMAL_TIPS.length]!);
}
