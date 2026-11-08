// src/features/auth/components/EduSparkMascot.jsx
import React from 'react';
import './animations/Mascot.css';

export const EduSparkMascot = ({ focusField, isPasswordVisible, customAnim }) => {
  let modeClass = 'idle';
  
  if (focusField === 'email' || focusField === 'username') modeClass = 'typing';
  if (focusField === 'password-empty') modeClass = 'idle'; 
  if (focusField === 'password') {
    modeClass = isPasswordVisible ? 'peeking' : 'closing';
  }

  if (customAnim === 'checking') modeClass = 'checking';
  if (customAnim === 'success') modeClass = 'happy';
  if (customAnim === 'error') modeClass = 'sad';

  let mouthPath = 'M91,101 Q100,107 109,101'; 
  if (modeClass === 'typing') mouthPath = 'M88,101 Q100,110 112,101';
  if (modeClass === 'closing') mouthPath = 'M93,103 Q100,105 107,103';
  if (modeClass === 'peeking') mouthPath = 'M86,99 Q100,110 115,97'; 
  if (modeClass === 'checking') mouthPath = 'M92,103 Q100,103 108,103'; 
  if (modeClass === 'happy') mouthPath = 'M85,98 Q100,118 115,98'; 
  if (modeClass === 'sad') mouthPath = 'M90,107 Q100,98 110,107'; 

  let leftEyeCurve = "M69,75 Q83,85 97,75";
  let rightEyeCurve = "M103,75 Q117,85 131,75";
  if (modeClass === 'happy') {
    leftEyeCurve = "M69,78 Q83,63 97,78"; 
    rightEyeCurve = "M103,78 Q117,63 131,78";
  }

  return (
    <div className={`mascot-wrap ${modeClass}`} id="mascotWrap">
      <svg id="dogSvg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="170" height="170" overflow="visible">
        
        {/* ĐUÔI */}
        <g className="dog-tail">
          <circle cx="154" cy="138" r="14" fill="#B87A3D" stroke="#3D1F0A" strokeWidth="2.5" />
          <circle cx="162" cy="130" r="10" fill="#F2C088" stroke="#3D1F0A" strokeWidth="2" />
        </g>

        <g className="dog-body-group">
          {/* THÂN VÀ BỤNG (Đứng yên) */}
          <ellipse cx="100" cy="155" rx="48" ry="38" fill="#B87A3D" stroke="#3D1F0A" strokeWidth="2.5"/>
          <ellipse cx="100" cy="164" rx="28" ry="20" fill="#F2C088" stroke="#3D1F0A" strokeWidth="1.5"/>

          {/* ==================== HỘP SỌ (dog-head) ==================== */}
          <g className="dog-head">
            {/* TAI */}
            <g className="ear-l"><ellipse cx="58" cy="90" rx="16" ry="26" fill="#965D2B" stroke="#3D1F0A" strokeWidth="2.5" transform="rotate(15 58 90)"/><circle cx="53" cy="108" r="14" fill="#965D2B" stroke="#3D1F0A" strokeWidth="2.5"/></g>
            <g className="ear-r"><ellipse cx="142" cy="90" rx="16" ry="26" fill="#965D2B" stroke="#3D1F0A" strokeWidth="2.5" transform="rotate(-15 142 90)"/><circle cx="147" cy="108" r="14" fill="#965D2B" stroke="#3D1F0A" strokeWidth="2.5"/></g>

            {/* KHỐI ĐẦU VÀ LÔNG XÙ */}
            <ellipse cx="100" cy="80" rx="44" ry="40" fill="#B87A3D" stroke="#3D1F0A" strokeWidth="2.5"/>
            <circle cx="100" cy="44" r="20" fill="#B87A3D" stroke="#3D1F0A" strokeWidth="2.5" />
            <circle cx="80" cy="50" r="16" fill="#B87A3D" stroke="#3D1F0A" strokeWidth="2.5" />
            <circle cx="120" cy="50" r="16" fill="#B87A3D" stroke="#3D1F0A" strokeWidth="2.5" />
            <circle cx="100" cy="48" r="20" fill="#B87A3D" /> 
            <circle cx="84" cy="54" r="16" fill="#B87A3D" />
            <circle cx="116" cy="54" r="16" fill="#B87A3D" />

            {/* ==================== KHUÔN MẶT (dog-face) ==================== */}
            {/* Nhóm này sẽ dịch chuyển biên độ lớn tạo cảm giác 3D quay mặt */}
            <g className="dog-face">
              {/* MÕM & MŨI */}
              <ellipse cx="100" cy="98" rx="26" ry="18" fill="#F2C088" stroke="#3D1F0A" strokeWidth="2"/>
              <ellipse cx="100" cy="90" rx="8" ry="6" fill="#1A0D06"/>
              <ellipse cx="97.5" cy="88" rx="2.5" ry="1.5" fill="#fff" opacity=".5"/>
              <path id="mouthPath" d={mouthPath} fill="none" stroke="#3D1F0A" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'd 0.3s ease' }} />
              <g className={`tongue ${modeClass === 'typing' || modeClass === 'peeking' || modeClass === 'happy' ? 'show' : ''}`} id="tongue">
                <ellipse cx="100" cy="111" rx="7" ry="9" fill="#ff6b6b"/>
                <ellipse cx="100" cy="111" rx="3" ry="7" fill="#c04040" opacity=".35"/>
              </g>

              {/* MẮT TRÁI */}
              <g className="eye-group-l">
                <clipPath id="eyeClipL"><circle cx="83" cy="74" r="12.5"/></clipPath>
                <circle cx="83" cy="74" r="12.5" fill="#fff" />
                <g clipPath="url(#eyeClipL)"><g id="eyeL-move"><circle cx="83" cy="74" r="6.5" fill="#1A0D06"/><circle cx="80.5" cy="71.5" r="2.5" fill="#fff"/></g></g>
                <circle cx="83" cy="74" r="12.5" fill="none" stroke="#3D1F0A" strokeWidth="2"/>
              </g>
              <path className="sleeping-eye-curve" d={leftEyeCurve} fill="none" stroke="#3D1F0A" strokeWidth="2.5" strokeLinecap="round"/>

              {/* MẮT PHẢI */}
              <g className="eye-group-r">
                <clipPath id="eyeClipR"><circle cx="117" cy="74" r="12.5"/></clipPath>
                <circle cx="117" cy="74" r="12.5" fill="#fff" />
                <g clipPath="url(#eyeClipR)"><g id="eyeR-move"><circle cx="117" cy="74" r="6.5" fill="#1A0D06"/><circle cx="114.5" cy="71.5" r="2.5" fill="#fff"/></g></g>
                <circle cx="117" cy="74" r="12.5" fill="none" stroke="#3D1F0A" strokeWidth="2"/>
              </g>
              <path className="sleeping-eye-curve" d={rightEyeCurve} fill="none" stroke="#3D1F0A" strokeWidth="2.5" strokeLinecap="round"/>

              {/* LÔNG MÀY */}
              <path id="browL" d="M72,59 Q83,54 94,58" fill="none" stroke="#3D1F0A" strokeWidth="3" strokeLinecap="round"/>
              <path id="browR" d="M106,58 Q117,54 128,59" fill="none" stroke="#3D1F0A" strokeWidth="3" strokeLinecap="round"/>

              {/* MÁ HỒNG */}
              <ellipse cx="64" cy="86" rx="10" ry="6" fill="#FF8A8A" opacity=".4"/>
              <ellipse cx="136" cy="86" rx="10" ry="6" fill="#FF8A8A" opacity=".4"/>
            </g>
          </g>

          {/* ==================== VÒNG CỔ (Tách khỏi đầu để đứng im) ==================== */}
          <g className="dog-collar">
            <path d="M78,124 Q100,132 122,124 L120,130 Q100,138 80,130 Z" fill="#FF4757" stroke="#C0392B" strokeWidth="1.5" />
            <circle cx="100" cy="138" r="9" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
            <circle cx="100" cy="140" r="2.5" fill="#B8860B"/>
            <path d="M100,142 L100,147" fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round"/>
          </g>

        </g>
      </svg>
    </div>
  );
};