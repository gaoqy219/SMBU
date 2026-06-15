import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface Props {
  url: string;
  size?: number;
}

export function QRCode({ url, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: { dark: '#4A4A4A', light: '#FFFFFF' },
      });
    }
  }, [url, size]);

  return <canvas ref={canvasRef} style={{ borderRadius: '8px' }} />;
}
