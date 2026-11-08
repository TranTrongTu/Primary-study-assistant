import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../../components/theme/ThemeWrapper';

export const MagicCursor = ({ isActive }) => {
  const canvasRef = useRef(null);
  const { isNight } = useTheme();

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (x, y) => {
      // Màu vàng/cam lửa phép thuật hoặc tím mộng mơ
      const hue = isNight ? 260 + Math.random() * 40 : 40 + Math.random() * 20;
      const color = `hsla(${hue}, 100%, 65%, 0.8)`;
      
      return { 
        x, 
        y, 
        size: Math.random() * 5 + 3, // Hạt to hơn chút
        speedX: (Math.random() - 0.5) * 1.5, // Lắc nhẹ sang 2 bên
        speedY: Math.random() * -3 - 1,      // LOGIC MỚI: Luôn bay ngược lên trên (Tàn lửa)
        life: 1, 
        color 
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY; // Bay lên
        p.life -= 0.03;  // Mờ nhanh hơn để tạo vệt ngắn
        p.size *= 0.95;  // LOGIC MỚI: Thu nhỏ dần theo thời gian
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (p.life <= 0 || p.size <= 0.5) particles.splice(i, 1);
      });
      requestAnimationFrame(animate);
    };

    const handleMove = (e) => {
      // Khi di chuột, sinh ra chùm hạt
      for (let i = 0; i < 4; i++) {
        particles.push(createParticle(e.clientX, e.clientY));
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMove);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [isActive, isNight]);

  if (!isActive) return null;

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[200]" />;
};