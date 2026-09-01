import React, { useEffect, useState } from 'react';
import { Screen, Title, Subtitle, Field, PrimaryButton, BodyText } from '../../components/ui';
import { verifyPin, isBiometricAvailable, authenticateWithBiometrics } from '../../services/lockService';
import { useAppTheme } from '../../theme/ThemeContext';

export default function LockGateScreen({
  pinHash,
  biometricEnabled,
  onUnlock,
}: {
  pinHash: string;
  biometricEnabled: boolean;
  onUnlock: () => void;
}) {
  const { theme } = useAppTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (biometricEnabled) {
      isBiometricAvailable().then((available) => {
        if (available) {
          authenticateWithBiometrics().then((ok) => {
            if (ok) onUnlock();
          });
        }
      });
    }
  }, [biometricEnabled]);

  async function handleUnlock() {
    const ok = await verifyPin(pin, pinHash);
    if (ok) {
      onUnlock();
    } else {
      setError('Yanlış PIN, efendim.');
      setPin('');
    }
  }

  return (
    <Screen>
      <Title>🔒 RAER Special App</Title>
      <Subtitle>Devam etmek için PIN'ini gir.</Subtitle>
      <Field label="PIN" value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" />
      {error ? <BodyText style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</BodyText> : null}
      <PrimaryButton title="Kilidi aç" onPress={handleUnlock} />
      {biometricEnabled ? (
        <PrimaryButton
          title="Parmak izi / yüz tanıma"
          variant="outline"
          onPress={async () => {
            const ok = await authenticateWithBiometrics();
            if (ok) onUnlock();
          }}
        />
      ) : null}
    </Screen>
  );
}
