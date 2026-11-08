// src/features/auth/hooks/useMascotAnimation.js
import { useEffect, useRef } from 'react';

export const useMascotAnimation = (focusField, showPassword, customAnim) => {
  const requestRef = useRef();
  const stateRef = useRef({ curX: 0, curY: 0, tgtX: 0, tgtY: 0 });

  useEffect(() => {
    const loop = () => {
      const state = stateRef.current;
      state.curX += (state.tgtX - state.curX) * 0.15;
      state.curY += (state.tgtY - state.curY) * 0.15;

      const eyeL = document.getElementById('eyeL-move');
      const eyeR = document.getElementById('eyeR-move');
      
      if (eyeL && eyeR) {
        eyeL.style.transform = `translate(${state.curX}px, ${state.curY}px)`;
        eyeR.style.transform = `translate(${state.curX}px, ${state.curY}px)`;
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    const aim = (nx, ny) => {
      // NẾU CÚN ĐANG CÓ BIỂU CẢM (Checking, Happy, Sad) -> KHÓA MẮT NHÌN THẲNG
      if (customAnim && customAnim !== 'idle') {
        stateRef.current.tgtX = 0;
        stateRef.current.tgtY = 0;
        return;
      }
      stateRef.current.tgtX = nx * 4.5;
      stateRef.current.tgtY = ny * 4.5;
    };
    const resetAim = () => { stateRef.current.tgtX = 0; stateRef.current.tgtY = 0; };

    const handleMouseMove = (e) => {
      if (focusField !== 'default') return;
      const svgEl = document.getElementById('dogSvg');
      if (!svgEl) return;

      const rect = svgEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.37;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      
      const speedFactor = Math.min(dist / 300, 1);
      aim((dx / dist) * speedFactor, (dy / dist) * speedFactor);
    };

    const trackCaret = () => {
      if (customAnim && customAnim !== 'idle') {
        resetAim();
        return;
      }

      const isTyping = focusField === 'email' || focusField === 'username' || focusField === 'password-empty';
      const isPeekingPassword = focusField === 'password' && showPassword;
      if (!isTyping && !isPeekingPassword) return;

      const input = document.activeElement;
      if (!input || !(input instanceof HTMLInputElement)) return;

      const svgEl = document.getElementById('dogSvg');
      if (!svgEl) return;

      const rect = svgEl.getBoundingClientRect();
      const svgCX = rect.left + rect.width / 2;
      const svgCY = rect.top + rect.height * 0.37;

      const pos = input.selectionEnd ?? input.value.length;
      const div = document.createElement('div');
      const cs = getComputedStyle(input);
      
      const props = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'wordSpacing', 'paddingLeft', 'paddingRight'];
      props.forEach(p => div.style[p] = cs[p]);

      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      div.style.whiteSpace = 'pre';
      div.style.width = 'auto'; 

      const textStr = input.value.substring(0, pos);
      div.textContent = input.type === 'password' ? '•'.repeat(textStr.length) : textStr;

      const caret = document.createElement('span');
      caret.textContent = '|';
      div.appendChild(caret);
      document.body.appendChild(div);

      const caretLeftOffset = caret.offsetLeft;
      document.body.removeChild(div);

      const inputRect = input.getBoundingClientRect();
      const caretX = inputRect.left + caretLeftOffset - input.scrollLeft;
      const caretY = inputRect.top + inputRect.height / 2;

      const dx = caretX - svgCX;
      const dy = caretY - svgCY;
      const dist = Math.hypot(dx, dy) || 1;
      const f = Math.min(dist / 140, 1);

      aim((dx / dist) * f, (dy / dist) * f);
    };

    if (focusField === 'default') {
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      window.addEventListener('input', trackCaret);
      window.addEventListener('click', trackCaret);
      window.addEventListener('keyup', trackCaret);
      setTimeout(trackCaret, 40); 
    }

    if (focusField === 'password') {
      if (!showPassword) resetAim(); 
      else setTimeout(trackCaret, 40);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('input', trackCaret);
      window.removeEventListener('click', trackCaret);
      window.removeEventListener('keyup', trackCaret);
    };
  }, [focusField, showPassword, customAnim]);
};