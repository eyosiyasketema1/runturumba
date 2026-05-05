import React from 'react';
import { Image } from 'react-native';

interface TurumbaLogoProps {
  height?: number;
}

export function TurumbaLogo({ height = 48 }: TurumbaLogoProps) {
  // Asset 11 1.png is 6230x2050, aspect ratio ~3.04
  const aspectRatio = 6230 / 2050;
  const width = height * aspectRatio;

  return (
    <Image
      source={require('@/assets/images/logo-dark.png')}
      style={{ width, height }}
      resizeMode="contain"
    />
  );
}
