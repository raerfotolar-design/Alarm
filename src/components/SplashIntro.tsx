import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

export function SplashIntro({ onFinish }: { onFinish: () => void }) {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: theme.colors.background, opacity }]}
    >
      <Animated.Image
        source={require('../../assets/icon.jpg')}
        style={[styles.logo, { transform: [{ scale }], shadowColor: theme.colors.glow }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
});
