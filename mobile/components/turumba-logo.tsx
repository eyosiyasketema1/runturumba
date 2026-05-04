import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface TurumbaLogoProps {
  size?: number;
}

export function TurumbaLogo({ size = 40 }: TurumbaLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 960 960">
      <Circle cx="480" cy="480" r="480" fill="#2563eb" />
      <Path
        d="M160 580 C250 590, 380 560, 460 420 C500 350, 540 280, 600 260 C660 240, 700 280, 710 340 C720 400, 700 460, 660 480 C620 500, 580 480, 570 440 C560 400, 580 360, 610 350"
        stroke="#fff"
        strokeWidth="38"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M140 640 C300 650, 500 620, 700 560"
        stroke="#fff"
        strokeWidth="32"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
