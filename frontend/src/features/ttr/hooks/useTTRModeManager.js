import { useState, useEffect, useCallback, useRef } from 'react';

export const useTTRModeManager = (mode, totalQuestions, streak, isCompleted, checkStatus) => {
  // Cập nhật công thức: 80s mặc định + 10s cho mỗi câu hỏi
  const maxTime = totalQuestions > 0 ? 40 + (10 * totalQuestions) : 0;

  const [timeLeft, setTimeLeft] = useState(0);
  const [freezeTimeLeft, setFreezeTimeLeft] = useState(0);
  const isTimeFrozen = freezeTimeLeft > 0;

  const [shields, setShields] = useState(0);
  const [isFogActive, setIsFogActive] = useState(mode === 'survival');

  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');

  const timerRef = useRef(null);
  const freezeTimeLeftRef = useRef(0);

  useEffect(() => {
    if (maxTime > 0) setTimeLeft(maxTime);
  }, [maxTime]);

  useEffect(() => {
    freezeTimeLeftRef.current = freezeTimeLeft;
  }, [freezeTimeLeft]);

  useEffect(() => {
    if (streak === 0) {
      if (mode === 'survival') setIsFogActive(true);
      return;
    }
    if (mode === 'speed') {
      if (streak === Math.max(1, Math.round(totalQuestions * 0.4)) || 
          streak === Math.max(2, Math.round(totalQuestions * 0.7))) {
        setFreezeTimeLeft(streak >= Math.round(totalQuestions * 0.7) ? 5 : 3);
      }
    }
    if (mode === 'survival') {
      if (streak === Math.max(1, Math.round(totalQuestions * 0.4))) setShields(prev => prev + 1);
      if (streak >= Math.max(2, Math.round(totalQuestions * 0.7))) setIsFogActive(false);
    }
  }, [streak, mode, totalQuestions]);

  // BỘ ĐẾM GIỜ CHÍNH - ĐÃ FIX LỖI ĐẾM NHANH
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const isPaused = checkStatus !== 'idle';
    if (mode !== 'speed' || isGameOver || isCompleted || isPaused || totalQuestions === 0) return;

    timerRef.current = setInterval(() => {
      if (freezeTimeLeftRef.current > 0) {
        setFreezeTimeLeft(prevFreeze => {
          const nextFreeze = Math.max(prevFreeze - 1, 0);
          freezeTimeLeftRef.current = nextFreeze;
          return nextFreeze;
        });
      } else {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            setIsGameOver(true);
            setGameOverReason('time_up');
            return 0;
          }
          return prevTime - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, isGameOver, isCompleted, checkStatus, totalQuestions]);

  const processAnswerTime = useCallback((isFullCorrect, isAnyWrong, newlyCorrectCount) => {
    if (mode !== 'speed') return;
    setTimeLeft(prev => {
      let newTime = prev;
      if (isFullCorrect) newTime += 5;
      else if (newlyCorrectCount > 0) newTime += newlyCorrectCount * 2;
      if (isAnyWrong) newTime -= 5;
      return Math.min(Math.max(newTime, 0), maxTime);
    });
  }, [mode, maxTime]);

  const processSurvivalDamage = useCallback(() => {
    if (mode !== 'survival') return false;
    if (shields > 0) {
      setShields(prev => prev - 1);
      return false;
    }
    setIsGameOver(true);
    setGameOverReason('one_hit_ko');
    return true;
  }, [mode, shields]);

  return {
    timeLeft, maxTime, isTimeFrozen, freezeTimeLeft,
    shields, isFogActive, isGameOver, gameOverReason,
    processAnswerTime, processSurvivalDamage,
  };
};