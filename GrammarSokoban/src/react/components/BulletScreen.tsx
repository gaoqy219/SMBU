import React, { useEffect, useState, useRef } from 'react';

interface Bullet {
  id: number;
  text: string;
  top: number;
  delay: number;
  speed: number;
}

interface Props {
  sentences: string[];
}

export function BulletScreen({ sentences }: Props) {
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!sentences.length) return;
    const interval = setInterval(() => {
      const text = sentences[Math.floor(Math.random() * sentences.length)];
      const top = Math.random() * 80 + 10; // 10-90%
      const speed = 8 + Math.random() * 6; // seconds
      setBullets(prev => {
        const next = [...prev, { id: idRef.current++, text, top, delay: 0, speed }];
        // Keep at most 15 bullets
        return next.slice(-15);
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [sentences]);

  return (
    <div style={{ position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:1,pointerEvents:'none',overflow:'hidden' }}>
      {bullets.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          top: `${b.top}%`,
          left: '100%',
          whiteSpace: 'nowrap',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#4A4A4A',
          background: 'rgba(255,255,255,0.85)',
          padding: '6px 16px',
          borderRadius: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          animation: `bullet-scroll ${b.speed}s linear forwards`,
        }}>
          {b.text}
        </div>
      ))}
      <style>{`
        @keyframes bullet-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100vw - 200px)); }
        }
      `}</style>
    </div>
  );
}
