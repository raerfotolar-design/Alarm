# Kişisel Uygulama — Planlama Notları

> Bu dosya, uygulama geliştirilmeden önce Claude ile yapılan planlama görüşmesinin yedeğidir. Kod yazımına başlarken referans olarak kullanılacaktır.

## Genel Bilgiler

- **Platform:** Android (kullanıcı Android telefon kullanıyor)
- **Teknoloji kararı:** Expo (React Native) — geliştirme sırasında Expo Go üzerinden QR kod ile telefonda anında test edilecek.
- **Dağıtım kararı:** Uygulama sadece Expo Go'da kalmayacak, kurulabilir bir **.apk** dosyası olarak EAS Build ile derlenecek. Build komutunu kullanıcı kendi (ücretsiz) Expo hesabıyla çalıştıracak, Claude tüm kodu ve yapılandırmayı (`eas.json`/`app.json`) hazırlayacak.
- **Depolama:** Tüm kullanıcı verileri (uyku kayıtları, hikayeler, şarkı sözleri, notlar) **yerel depolama** (local storage / cihaz üzerinde) olacak. Buluta gönderilmeyecek.
- **Gelecekte gönderilecek dosyalar:**
  - Uygulama ikonu (kullanıcı gönderecek)
  - Jarvis dosyası — kişiye özel yapay zeka tanımı/karakteri (kullanıcı gönderecek)

## 1. Uyku Takip Sistemi (2 Mod)

### Mod A — Uyku Modu
- Manuel giriş: "Uyudum" / "Uyandım" butonları
- Her kayıt: tarih + gün + süre olarak yerel depolamaya kaydedilir
- Geçmiş kayıtlar liste/takvim halinde görüntülenir
- İstatistikler: ortalama uyku süresi, en uzun/en kısa gece, haftalık/aylık düzen grafiği
- Jarvis bu verilere bakarak tavsiye/yorum üretir (örn. düzensizlik tespiti, öneri)

### Mod B — Uyanık Kalma Modu
- Kullanıcı hedef saat belirler (örn. "22:00'a kadar uyanık kalmalıyım")
- **Motivasyon/hatırlatma bildirimleri:** neden uyanık kalınması gerektiğini hatırlatan kişisel mesajlar
- **Etkileşimli görevler:** ara sıra küçük bir görev/soru çıkar; cevaplanmazsa uyarı/alarm devam eder (gerçekten uyanık olduğunu doğrulamak için)
- Geri sayım ekranı (hedef saate kalan süre)

## 2. Jarvis — Kişisel Yapay Zeka
- **Karar:** Ayrı bir dosya/uygulama gönderilmeyecek — Jarvis doğrudan uygulama içinde kodlanacak.
- **Motor:** Gemini API (kullanıcı kendi API anahtarını Ayarlar ekranından girecek, güvenli şekilde cihazda saklanacak).
- **Kişilik:** Kullanıcıya "günaydın efendim" tarzı hitap eder, ara sıra espri yapar, samimi ama işini bilen bir asistan tonu.
- Sohbet ekranı
- Uyku istatistiklerine erişip yorum/tavsiye verebilir
- **Görev yürütme:** Uygulama içi işlemleri kendisi yapabilir (örn. "bu gece 5 saat uyudum" dersen uyku kaydını kendisi girer, "yarın için 8'e alarm kur" dersen alarmı kendisi kurar) — basit fonksiyon çağırma (function calling) ile.
- Hikaye/şarkı/not bölümleriyle etkileşebilir (fikir üretme, geliştirme vb.)

## 3. Hikaye Yazma Bölümü
- Metin editörü
- Başlıkla kaydetme, yerel depolama
- Geçmiş hikayeler listesi

## 4. Şarkı Yazma Bölümü
- Söz yazma alanı
- İsimle kaydetme, **yerel depolamada kalıcı** (silinmeyecek şekilde)

## 5. Notlar Bölümü
- Serbest not alma, yerel depolama

## 6. Alarm Sistemi
- Klasik alarm kurma
- Uyanık kalma modundaki hatırlatma/alarmlarla bağlantılı çalışabilir

## 7. Jarvis Sesli Asistan (Siri Tarzı)

- **Uyandırma kelimesi:** "Jarvis" — telefon kilitliyken/arka plandayken bile dinler.
- **Motor:** Picovoice Porcupine (native wake-word engine, düşük pil tüketimi, arka planda foreground service ile çalışır — Android bunun için kalıcı bir bildirim göstermeyi zorunlu kılar).
- **Kurulum gereksinimleri (kullanıcı sağlayacak):** Ücretsiz Picovoice hesabı + özel "Jarvis" keyword dosyası (.ppn), AccessKey.
- **Görsel anlama:** Kamera ile fotoğraf çekip Gemini'nin görsel (multimodal) API'sine gönderme — "bu ne?" gibi sorulara cevap verir.
- **Sesli komutlar:** "kamerayı aç", "uyku kaydımı gir", "alarm kur" gibi komutları anlayıp ilgili uygulama içi eylemi tetikler.
- **Not:** Bu özellik Expo Go ile test edilemez (native modül) — EAS Build ile gerçek APK derlenmesi gerekir.

## Ek Özellikler (ONAYLANDI — hepsi dahil edilecek)

- Ruh hali (mood) takibi — uyku kalitesiyle ilişkilendirme
- Streak / hedef sistemi — düzenli yatma saatini teşvik
- Gece modu (koyu tema)
- Dışa aktarma/yedekleme (PDF/txt) — hikaye/şarkı/notlar için ekstra güvence
- Arama + etiketleme (hikaye/şarkı/not bölümlerinde)
- Sesli not alma
- Jarvis'ten akıllı alarm/yatma saati önerisi
- Gizlilik kilidi (PIN/biyometrik)
- Özel alarm sesi (kullanıcının kendi ses kaydı/müziği)

## 8. Yeniden Tasarım (v2 — henüz uygulanmadı, plan aşamasında)

- **Genel tema:** Daha derin/karanlık bir tema, kullanıcının göndereceği logo/renklere göre kişiselleştirilecek.
- **Navigasyon:** Alt sekme çubuğu yerine **solda dikey bir menü** (ikon + isim listesi).
- **Uyku bölümü:** Uyku Modu ve Uyanık Kalma Modu artık görsel olarak birbirinden tamamen farklı temalarda olacak (Uyku Modu: sakin gece/ay paleti; Uyanık Kalma Modu: enerjik kırmızı/turuncu paleti).
- **Yeni bölüm — Hobi:** Alt sekmeler: Filmler / Diziler / Animeler / Çizgi Roman-Manga. Her kayıt: başlık, kapak görseli, durum (izlemek istiyorum/izliyorum/izledim), puan, not.
  - Jarvis, başlık girilince kapak görselini otomatik bulacak: filmler/diziler için TMDb API, anime/manga için AniList API (ikisi de ücretsiz, kullanıcı kendi anahtarını/erişimini Ayarlar'a girecek).
  - **Onaylanan ek:** Kitap takibi de Hobi bölümüne eklenecek.
  - **Onaylanan ek:** Dizi/anime için sezon/bölüm takibi ("kaçıncı bölümde kaldım").
- **Şarkı bölümü — Kafiye Yardımcısı:** Söz editöründe bir Jarvis ikonu; yazılan/seçilen kelimeyle kafiyeli kelime önerileri sunacak.
- **Yeni bölüm — "For My Love":** Sevgiliyle ilgili özel notlar + ortak fotoğraf galerisi (yerel, güvenli).
  - **Onaylanan ek:** Özel gün hatırlatıcıları (yıldönümü/doğum günü) için otomatik bildirim.
- **Onaylanan ek:** Sol menüdeki bölüm sırası kullanıcı tarafından sürüklenerek özelleştirilebilecek.
- **Onaylanan ek:** Açılışta kısa bir intro/logo animasyonu.
- **Yeni bölüm — "Ninni":** Kullanıcının kendi ninni ses dosyasını (Files'tan) yükleyip tek dokunuşla çalabileceği ayrı bir bölüm. Bitince otomatik döngü, uyku zamanlayıcı (X dakika sonra otomatik durur), YouTube linki kaydedip kısayolla açma. Jarvis'e "ninnimi çal" dediğinde de bu bölümü tetikleyebilmesi (fonksiyon çağırma ile).
- **Tasarım referansı alındı:** Kullanıcı koyu/neon (camgöbeği-mavi parlayan kenarlıklı) kart tabanlı bir arayüz örneği gönderdi — genel his/yön olarak kullanılacak, kesin renk/logo kullanıcı gönderince netleşecek.

### 8b. İkinci Öneri Turu (ONAYLANDI — widget hariç hepsi eklenecek)

**Uyku & Sağlık**
- Uyku öncesi rutin checklist'i (ilaç, ışık, telefon vb.)
- Kabus/rüya günlüğü — Jarvis yorumlayabilir
- Kafein/ekran süresi takibi, uyku kalitesiyle ilişkilendirme
- Haftalık uyku raporu — her Pazar Jarvis'ten otomatik özet + tavsiye

**Jarvis**
- Günlük brifing (hava durumu + o günkü alarm/hatırlatma özeti)
- "Jarvis modu" kişilik ayarı (resmi/samimi/esprili)
- Hafıza notları — "bunu unutma" dediklerini uzun süreli hatırlaması
- Günlük motivasyon sözü

**Hobi/Medya**
- İzleme istatistikleri (aylık film/bölüm sayısı, en çok seçilen tür)
- Puanlama + top 10 listesi
- "Ne izlesem?" önerisi (geçmiş beğenilere göre)

**Yaratıcılık**
- Hikaye/şarkı için "devam ettir" (Jarvis'e yazdığın yeri verip devamını yazdırma)
- Kelime/karakter sayacı (canlı)
- Versiyon geçmişi (eski hale geri dönebilme)

**For My Love**
- Anı takvimi + geri sayım (ilk buluşma, yıldönümü vb.)
- Ortak "bucket list"
- Sürpriz hatırlatıcı (kişisel alarm)

**Alarm/Bildirim**
- Kademeli alarm (önce hafif titreşim, sonra sesi artan)
- Bulmaca çözerek alarm kapatma

**Genel/Sistem**
- Uygulama içi genel arama (not/hikaye/şarkı/hobi hepsinde birden)
- Kullanım istatistiği / basit "profil" ekranı

**Hariç tutulan:** Ana ekran widget'ı (native ek efor gerektiriyor, şimdilik yok).

## Bilinen Sorunlar / Notlar

- [x] **Düzeltildi (kod):** Bildirimler sessiz geliyor / alarm çalmadan geçiyordu. Sebebi muhtemelen Android bildirim kanallarının değişmez (immutable) olması — eski APK kurulumlarında oluşan kanal, üzerine kurulan yeni APK'larda da aynı (sessiz/düşük öncelikli) ayarlarla kalıyordu. Kanal ID'leri değiştirildi (`raer-alarms-v2`, `raer-reminders-v2`) ve bildirimlere `priority: MAX` eklendi — bu, Android'in yeni ayarlarla temiz bir kanal oluşturmasını zorlar.
  - **Kullanıcının test etmesi gereken:** Yeni APK'yı kurduktan sonra hâlâ sessiz/çalmıyor ise, telefonun pil optimizasyonu/arka plan kısıtlaması bu uygulamayı kısıtlıyor olabilir (özellikle Xiaomi/Samsung/OnePlus gibi telefonlarda yaygın) — Ayarlar > Uygulamalar > RAER Special App > Pil > "Kısıtlama yok" yapılmalı, ayrıca telefonun rahatsız etmeyin (DND) modu kapalı olmalı.
- **Bilinmiyor / gelecek iş:** Şu anki alarm, tek seferlik bir bildirim sesi çalıyor — gerçek bir "çalar saat" gibi sürekli çalıp ekranı kilitli halde bile açan bir deneyim değil. Kullanıcı hâlâ yetersiz bulursa, bunun için native bir alarm mekanizması (tam ekran uyarı + döngüsel ses) ayrı bir iş olarak ele alınmalı.

## Genişletilebilirlik

Uygulama modüler bölüm (section) yapısında kurulacak — her özellik bağımsız bir ekran/modül olarak yazılacak. Kullanıcı ileride yeni bir bölüm isterse mevcut yapı bozulmadan eklenebilecek.

## Durum

- [x] Uygulama adı: RAER Special App
- [x] Uygulama ikonu eklendi (assets/icon.jpg — kullanıcının gönderdiği görsel)
- [x] v1 tüm ekranlar (bkz. README.md), Android için Metro bundle testi başarılı
- [ ] Gemini API anahtarı (kullanıcı Ayarlar ekranından girecek)
- [ ] Picovoice AccessKey + özel "Jarvis" keyword dosyası (kullanıcı sağlayacak — bkz. assets/wakeword/README.md)
- [ ] APK'nın EAS Build ile derlenmesi (kullanıcı kendi Expo hesabıyla çalıştıracak — bkz. README.md adım 4)

### v2 (redesign + genişletme) — kodlanan kısım

- [x] Koyu neon tema (varsayılan), Ayarlar'dan açık temaya geçilebiliyor
- [x] Uyku Modu / Uyanık Kalma Modu için ayrı renk vurguları (AccentScope)
- [x] Sol ikon şeridi navigasyonu (alt sekme çubuğu kaldırıldı)
- [x] Açılış logo animasyonu
- [x] **Hobi** bölümü: Filmler/Diziler/Animeler/Manga/Kitaplar, durum/puan/ilerleme, TMDb+AniList+Open Library ile otomatik kapak bulma, Jarvis'ten `add_media_item`/`list_media_by_status`
- [x] **For My Love** bölümü: anılar+fotoğraf galerisi, özel gün geri sayımı+bildirimi, bucket list — girişte ayrı PIN/biyometrik kilit (global kilitten bağımsız, her seferinde soruyor)
- [x] **Ninni** bölümü: dosyadan çalma, döngü, uyku zamanlayıcısı, YouTube linki, Jarvis'ten `play_lullaby`/`stop_lullaby`
- [x] Jarvis: ton ayarı (samimi/resmi/esprili), `remember_fact`/`recall_facts` hafıza, Şarkı editöründe kafiye bulucu + "devam ettir", kelime/karakter sayacı

### v2 — henüz kodlanmadı (sıradaki)

- [ ] Uyku öncesi rutin checklist'i, rüya günlüğü, kafein/ekran süresi takibi, haftalık Jarvis raporu
- [ ] Jarvis günlük brifing + günlük motivasyon sözü (otomatik/zamanlanmış)
- [ ] Hikaye/şarkı versiyon geçmişi
- [ ] İzleme istatistikleri, top-10, "ne izlesem" önerisi (Hobi verisinden türetilecek, henüz ayrı bir ekran yok)
- [ ] Alarm: kademeli ses artışı + bulmaca ile kapatma (foreground-only olarak planlandı)
- [ ] Uygulama içi genel arama (tüm bölümlerde)
- [ ] Kullanım istatistiği/profil ekranı

Kurulum ve kullanım detayları için bkz. **README.md**.
