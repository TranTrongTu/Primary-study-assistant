import React, { useState, useEffect, useRef } from 'react';
import './Flashcard.css';

const Flashcard = ({ front, back, isFlipped, onClick, subject, isDarkMode }) => {
    // localFlipped dùng để tạo độ trễ lật so với hiệu ứng gió của Canvas
    const [localFlipped, setLocalFlipped] = useState(isFlipped);
    const [isWindActive, setIsWindActive] = useState(false);
    
    const canvasRef = useRef(null);
    const leavesRef = useRef([]);
    const animationFrameRef = useRef(null);

    // Đồng bộ hóa trạng thái lật từ prop cha với độ trễ (Gió thổi trước -> Lật theo sau)
    useEffect(() => {
        if (isFlipped !== localFlipped) {
            // 1. Bật tín hiệu kích hoạt gió ngay lập tức
            setIsWindActive(true);

            // 2. Trì hoãn hành động lật đều của thẻ (chờ gió thổi trước 150ms)
            const timer = setTimeout(() => {
                setLocalFlipped(isFlipped);
            }, 150); 

            return () => clearTimeout(timer);
        }
    }, [isFlipped]);

    // HỆ THỐNG CANVAS LÁ CÂY BÙNG NỔ KHI CÓ TÍN HIỆU GIÓ
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement.offsetWidth * 1.2;
            canvas.height = canvas.parentElement.offsetHeight * 1.2;
        };
        resizeCanvas();

        const LEAF_COLORS = ['#556b2f', '#6b8e23', '#8fbc8f', '#9acd32', '#7cb342', '#aed581'];

        // Hàm sinh lá với vận tốc cực nhanh (Gió thổi mạnh)
        const createLeaf = (forceFromLeft) => {
            return {
                x: forceFromLeft ? -10 : canvas.width + 10,
                y: Math.random() * canvas.height * 0.7 + (canvas.height * 0.05),
                size: 5 + Math.random() * 4,
                color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
                alpha: 1.0,
                // GIÓ THỔI CỰC NHANH: Vận tốc lớn để lá bay vút qua trước
                vx: forceFromLeft ? (18 + Math.random() * 10) : -(18 + Math.random() * 10),
                vy: (Math.random() - 0.4) * 4,
                angle: Math.random() * Math.PI * 2,
                spinSpeed: (Math.random() - 0.5) * 0.5,
                curvePhase: Math.random() * Math.PI,
                curveSpeed: 0.1
            };
        };

        // Nếu tín hiệu gió được kích hoạt, thổi bùng ra 15 chiếc lá bay xé gió
        if (isWindActive) {
            const newLeaves = Array.from({ length: 15 }, () => createLeaf(isFlipped));
            leavesRef.current = [...leavesRef.current, ...newLeaves];
            setIsWindActive(false); // Reset trạng thái kích hoạt luồng gió
        }

        // Loop cập nhật vật lý lá cây
        const updateAnimation = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            leavesRef.current = leavesRef.current.filter(leaf => {
                leaf.x += leaf.vx;
                leaf.y += leaf.vy + Math.sin(leaf.curvePhase) * 1.5;
                leaf.curvePhase += leaf.curveSpeed;
                leaf.angle += leaf.spinSpeed;
                leaf.alpha -= 0.02; // Lá tan nhanh hơn để phù hợp với tốc độ gió vút qua

                if (leaf.alpha <= 0) return false;

                ctx.save();
                ctx.translate(leaf.x, leaf.y);
                ctx.rotate(leaf.angle);
                ctx.globalAlpha = leaf.alpha;
                ctx.fillStyle = leaf.color;

                ctx.beginPath();
                ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(-leaf.size, 0);
                ctx.lineTo(leaf.size, 0);
                ctx.stroke();

                ctx.restore();
                return true;
            });

            animationFrameRef.current = requestAnimationFrame(updateAnimation);
        };

        updateAnimation();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isWindActive, isFlipped]);

    const normalizedSubject = String(subject || 'VIETNAMESE').toUpperCase();
    const containerClasses = [
        'flashcard-container',
        localFlipped ? 'flipped' : '', // Sử dụng state local có độ trễ để xoay đều
        normalizedSubject,
        isDarkMode ? 'night' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses} onClick={onClick}>
            {/* Hệ thống Canvas lá cây phản ứng ngay lập tức khi click */}
            <canvas ref={canvasRef} className="flashcard-wind-canvas" />

            <div className="flashcard-inner">
                <div className="flashcard-front">
                    <div className="p-6 flex items-center justify-center text-center h-full">
                        <h3 className="flashcard-front-text text-xl font-semibold select-none">{front}</h3>
                    </div>
                </div>
                
                <div className="flashcard-back">
                    <div className="p-6 flex items-center justify-center text-center h-full">
                        <p className="text-lg font-medium select-none">{back}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Flashcard;