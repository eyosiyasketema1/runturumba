import React from 'react';
import { Image } from 'react-native';

interface TurumbaLogoProps {
  height?: number;
}

export function TurumbaLogo({ height = 48 }: TurumbaLogoProps) {
  // Asset 11.png is 3115x1025, aspect ratio ~3.04
  const aspectRatio = 3115 / 1025;
  const width = height * aspectRatio;

  return (
    <Image
      source={require('@/assets/images/Asset 11.png')}
      style={{ width, height }}
      resizeMode="contain"
    />
  );
}
