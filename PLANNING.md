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

## Bilinen Sorunlar / Notlar (henüz düzeltilmedi)

- Kullanıcı bir bildirim aldığını bildirdi ama bu Jarvis mesajı değildi ve **bildirim sesi çalmadı, sessizce geldi**. Kaynağı belirsiz (uyanık kalma hatırlatma bildirimi mi, sistem bildirimi mi?) — ileride araştırılıp düzeltilecek.

## Genişletilebilirlik

Uygulama modüler bölüm (section) yapısında kurulacak — her özellik bağımsız bir ekran/modül olarak yazılacak. Kullanıcı ileride yeni bir bölüm isterse mevcut yapı bozulmadan eklenebilecek.

## Durum

- [x] Uygulama adı: RAER Special App
- [x] Uygulama ikonu eklendi (assets/icon.jpg — kullanıcının gönderdiği görsel)
- [x] Tüm ekranlar ve özellikler kodlandı (bkz. README.md), Android için Metro bundle testi başarılı
- [ ] Gemini API anahtarı (kullanıcı Ayarlar ekranından girecek)
- [ ] Picovoice AccessKey + özel "Jarvis" keyword dosyası (kullanıcı sağlayacak — bkz. assets/wakeword/README.md)
- [ ] APK'nın EAS Build ile derlenmesi (kullanıcı kendi Expo hesabıyla çalıştıracak — bkz. README.md adım 4)

Kurulum ve kullanım detayları için bkz. **README.md**.
