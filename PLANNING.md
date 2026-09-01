# Kişisel Uygulama — Planlama Notları

> Bu dosya, uygulama geliştirilmeden önce Claude ile yapılan planlama görüşmesinin yedeğidir. Kod yazımına başlarken referans olarak kullanılacaktır.

## Genel Bilgiler

- **Platform:** Android (kullanıcı Android telefon kullanıyor)
- **Teknoloji kararı:** Expo (React Native) — Expo Go üzerinden QR kod ile telefonda anında test edilecek. Gerekirse ileride .apk olarak paketlenebilir.
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
- Kullanıcının göndereceği dosyaya göre kendine özgü karakter/bilgi tabanı
- Sohbet ekranı
- Uyku istatistiklerine erişip yorum/tavsiye verebilir
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

## Önerilen Ek Özellikler (onay bekliyor)

- Ruh hali (mood) takibi — uyku kalitesiyle ilişkilendirme
- Streak / hedef sistemi — düzenli yatma saatini teşvik
- Gece modu (koyu tema)
- Dışa aktarma/yedekleme (PDF/txt) — hikaye/şarkı/notlar için ekstra güvence
- Arama + etiketleme (hikaye/şarkı/not bölümlerinde)
- Sesli not alma
- Jarvis'ten akıllı alarm/yatma saati önerisi
- Gizlilik kilidi (PIN/biyometrik)
- Özel alarm sesi (kullanıcının kendi ses kaydı/müziği)

## Bekleyen Kararlar

- [ ] Önerilen ek özelliklerden hangileri dahil edilecek?
- [ ] Uygulama ikonu (kullanıcı gönderecek)
- [ ] Jarvis dosyası (kullanıcı gönderecek) — entegre edilene kadar placeholder bir bölüm olarak bırakılacak
