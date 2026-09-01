import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const attempt = await hashPin(pin);
  return attempt === hash;
}

export async function isBiometricAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'RAER Special App kilidini aç',
    cancelLabel: 'Vazgeç',
  });
  return result.success;
}
