// src/pages/AuthPage.jsx
import { useState, useEffect, useRef } from 'react';
import { LoginForm } from '../features/auth/components/LoginForm';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { EduSparkMascot } from '../features/auth/components/EduSparkMascot';
import { useMascotAnimation } from '../features/auth/hooks/useMascotAnimation';
import { SchoolGate } from '../features/auth/components/SchoolGate';
import { ThemeWrapper, useTheme } from '../components/theme/ThemeWrapper';
import './AuthPage.css';

const AuthPageContent = () => {
  const { isNight } = useTheme();

  const [mode, setMode] = useState('login');
  const [focusField, setFocusField] = useState('default');
  const [showPassword, setShowPassword] = useState(false);

  const [phase, setPhase] = useState('gate-enter');
  const [mascotFace, setMascotFace] = useState('idle'); // Nét mặt: checking, happy, sad
  const [mascotMotion, setMascotMotion] = useState(''); // Chuyển động: nod, shake-slow
  const [gateOpen, setGateOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  // Khóa mắt Cún nhìn thẳng khi xử lý API dữ liệu
  useMascotAnimation(focusField, showPassword, mascotFace); 

  const timeoutsRef = useRef([]);
  const registerTimeout = (callback, delay) => {
    const id = setTimeout(callback, delay);
    timeoutsRef.current.push(id);
  };

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === 'gate-enter') {
      const t1 = setTimeout(() => setPhase('form-drop'), 800);
      const t2 = setTimeout(() => setPhase('idle'), 1600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [phase]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setFocusField('default');
    setShowPassword(false);
    setMascotFace('idle');
    setMascotMotion('');
  };

  const handleLoadingState = (isLoading) => {
    if (isLoading) {
      setMascotFace('checking'); // Làm nét mặt thám tử
      setMascotMotion('');
    }
  };

  // ── ĐĂNG NHẬP ──
  const handleLoginSuccess = () => {
    setMascotFace('happy'); 
    setMascotMotion('nod'); 
    
    registerTimeout(() => { setMascotFace('idle'); setMascotMotion(''); }, 1500);
    registerTimeout(() => setPhase('success-roll'), 600); // Thả cuộn giấy thu ngược lên
    registerTimeout(() => { setGateOpen(true); setPhase('gate-open'); }, 1400); // Mở cửa giấu sau cột
    registerTimeout(() => { setIsZooming(true); setPhase('zoom-in'); }, 2200); // Đi bộ xuyên qua 3s
    registerTimeout(() => { window.location.href = '/#/dashboard'; }, 5200);
  };

  const handleLoginError = () => {
    setMascotFace('sad'); // Cụp tai mếu máo
    setMascotMotion('shake-slow'); // Lắc đầu buồn bã từ từ
    registerTimeout(() => { setMascotFace('idle'); setMascotMotion(''); }, 2000);
  };

  // ── ĐĂNG KÝ ──
  const handleRegisterSuccess = () => {
    setMascotFace('happy'); 
    setMascotMotion('nod'); 
    registerTimeout(() => { 
      setMascotFace('idle'); 
      setMascotMotion(''); 
      handleModeChange('login'); 
    }, 2500);
  };

  const handleRegisterError = () => {
    setMascotFace('sad');
    setMascotMotion('shake-slow'); 
    registerTimeout(() => { setMascotFace('idle'); setMascotMotion(''); }, 2000);
  };

  const isFormVisible = phase === 'form-drop' || phase === 'idle';
  const isFormRolled  = phase === 'success-roll' || phase === 'gate-open' || phase === 'zoom-in';

  return (
    <div className={`auth-root ${isNight ? 'dark' : ''} ${isZooming ? 'zooming' : ''}`}>
      <div className={`gate-scene ${phase === 'gate-enter' ? 'entering' : ''} ${isZooming ? 'zoom-through' : ''}`}>
        
        <div className="gate-stage">
          <SchoolGate isOpen={gateOpen} isDark={isNight} />

          <div className={`mascot-on-gate ${mascotMotion}`}>
            <EduSparkMascot
              focusField={focusField}
              isPasswordVisible={showPassword}
              customAnim={mascotFace}
            />
          </div>

          <div className={`form-panel ${isFormVisible ? 'dropped' : ''} ${isFormRolled ? 'rolled-up' : ''}`}>
            <div className="form-panel-cap" />
            
            <div className="form-panel-inner">
              <div className="form-panel-content">
                
                <div className="form-header">
                  <div className="eduspark-logo">
                    <span className="logo-spark">✦</span>
                    <span className="logo-text">EduSpark</span>
                    <span className="logo-spark">✦</span>
                  </div>
                  <p className="form-tagline">
                    {mode === 'login'
                      ? 'Chào mừng bé trở lại! Vào lớp thôi nào 🐾'
                      : 'Gia nhập hành trình học tập cùng EduSpark!'}
                  </p>
                </div>

                <div className="mode-tabs">
                  <button type="button" onClick={() => handleModeChange('login')}
                    className={`mode-tab ${mode === 'login' ? 'active' : ''}`}>Đăng nhập</button>
                  <button type="button" onClick={() => handleModeChange('register')}
                    className={`mode-tab ${mode === 'register' ? 'active' : ''}`}>Đăng ký</button>
                  <div className={`tab-slider ${mode === 'register' ? 'right' : ''}`} />
                </div>

                <div className="form-body">
                  {mode === 'login' ? (
                    <LoginForm 
                      setFocusField={setFocusField} showPassword={showPassword} setShowPassword={setShowPassword} 
                      onSuccess={handleLoginSuccess} onError={handleLoginError} onLoading={handleLoadingState}
                    />
                  ) : (
                    <RegisterForm 
                      setFocusField={setFocusField} showPassword={showPassword} setShowPassword={setShowPassword} 
                      onSuccess={handleRegisterSuccess} onError={handleRegisterError} onLoading={handleLoadingState}
                    />
                  )}
                </div>

              </div>
            </div>
            
            <div className="form-scroll-deco" />
          </div>
          
        </div>
      </div>
    </div>
  );
};

export const AuthPage = () => (
  <ThemeWrapper showToggle={true}>
    <AuthPageContent />
  </ThemeWrapper>
);