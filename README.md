# RAER Special App

Kişisel uyku takip, alarm, hikaye/şarkı/not ve Jarvis sesli asistan uygulaması.

## 1. Hızlı test (Expo Go)

Kamera, sesli not ve temel her şeyi hemen telefonunda görebilirsin:

```bash
npm install
npx expo start
```

Terminalde çıkan QR kodu, telefonuna **Expo Go** uygulamasını (Play Store) indirip onunla okut.

> **Not:** "Jarvis" arka plan dinleme özelliği (Picovoice) Expo Go'da çalışmaz — native kod içerdiği için aşağıdaki APK adımlarını izlemen gerekir. Geri kalan her şey (uyku takibi, alarmlar, hikaye/şarkı/not, Jarvis sohbet ve kamera ile "bu ne?" özelliği) Expo Go'da tam çalışır.

## 2. Gemini API anahtarı (Jarvis için gerekli)

1. https://aistudio.google.com/apikey adresinden ücretsiz bir API anahtarı al.
2. Uygulamada **Ayarlar > Jarvis (Gemini API)** bölümüne yapıştır.

## 3. "Jarvis" arka plan dinleme (opsiyonel, APK gerektirir)

`assets/wakeword/README.md` dosyasındaki adımları izleyerek:
1. Picovoice hesabı aç, özel "Jarvis" kelimesini oluştur, Android için indir.
2. İndirdiğin dosyayı `assets/wakeword/jarvis_android.ppn` olarak (aynı isimle, üzerine yazarak) kaydet.
3. Picovoice Console'dan AccessKey'ini kopyala, Ayarlar'daki ilgili alana yapıştır ve "Arka planda Jarvis dinle" anahtarını aç.

## 4. Kurulabilir APK almak (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Komut bitince sana bir indirme linki verecek. O linkten `.apk` dosyasını telefonuna indirip kur (Play Store dışından kurulum için "bilinmeyen kaynaklara izin ver" demen gerekebilir).

Bu build alma işlemini SADECE sen, kendi ücretsiz Expo hesabınla çalıştırabilirsin.

## 5. Uygulama ikonunu değiştirmek

`assets/icon.jpg` dosyasının üzerine yeni görseli aynı isimle koy, sonra 4. adımdaki `eas build` komutunu tekrar çalıştır. (Ayarlar ekranındaki "Uygulama Görseli" sadece uygulama içindeki görseli değiştirir, telefonun ana ekranındaki gerçek ikon için yeniden build gerekir.)

## 6. Veriler nerede saklanıyor?

Uyku kayıtları, hikayeler, şarkı sözleri, notlar ve ruh hali kayıtları tamamen **cihazın yerel deposunda** tutulur, hiçbir sunucuya gönderilmez. Gemini API anahtarı ve Picovoice AccessKey de cihazın güvenli deposunda (`expo-secure-store`) şifreli tutulur. Ayarlar > Yedekleme'den tüm verileri `.txt` olarak dışa aktarabilirsin.
