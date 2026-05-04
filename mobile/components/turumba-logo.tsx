import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface TurumbaLogoProps {
  size?: number;
}

export function TurumbaLogo({ size = 40 }: TurumbaLogoProps) {
  return (
    <Image
      source={require('@/assets/images/turumba-icon.png')}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="contain"
    />
  );
}
