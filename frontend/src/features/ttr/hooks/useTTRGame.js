import { useState, useCallback, useEffect } from 'react';
import { fetchStudyActivity } from '../api/ttrApi';
import { useTTRModeManager } from './useTTRModeManager';
import { parseBackendError, logBackendError, setErrorFromParsed } from "../../../utils/backendError";

// Dùng để test tính năng trước khi có BE, sẽ xóa sau khi tích hợp API thật
import { MOCK_BACKEND_DATA } from '../utils/mockData';

const mapBackendDataToGameFormat = (backendData) => {
  const items = backendData.items || [];
  return items.map((item, index) => {
    const textContentObj = item.contents.find(c => c.type === 'GAP_FILL_TEXT');
    const correctContents = item.contents.filter(c => c.type === 'GAP_FILL_CORRECT');
    const distractorContents = item.contents.filter(c => c.type === 'GAP_FILL_DISTRACTOR');

    const textString = textContentObj ? textContentObj.content : "";
    const correctWords = correctContents.map(c => c.content);
    const distractors = distractorContents.map(c => c.content);

    const textChunks = textString.split(/\$!BLANK!\$|\[BLANK\]|___/);
    const blanks = correctWords.map((word, i) => ({ id: `q${index}-b${i}`, correctWord: word }));

    const allOptions = [...correctWords, ...distractors];
    
    // CẢI TIẾN: Tạo Object có ID duy nhất cho từng từ để phân biệt các từ trùng lặp
    const optionObjects = allOptions.map((word, i) => ({
      id: `opt-${index}-${i}`,
      text: word
    }));
    const shuffledOptions = optionObjects.sort(() => Math.random() - 0.5);

    return { id: `q${index}`, textChunks, blanks, options: shuffledOptions };
  });
};

export const useTTRGame = (studyActivityId, onClose, initialMode = 'play') => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeBlankId, setActiveBlankId] = useState(null); 
  const [filledBlanks, setFilledBlanks] = useState({});     
  const [wrongBlanks, setWrongBlanks] = useState([]);       
  const [confirmedBlanks, setConfirmedBlanks] = useState([]); 
  const [checkStatus, setCheckStatus] = useState('idle');   

  const [power5050, setPower5050] = useState(0);         
  const [powerMagic, setPowerMagic] = useState(0);       
  const [shieldActive, setShieldActive] = useState(false); 
  const [eliminatedOptions, setEliminatedOptions] = useState([]);

  const [isReviewMode, setIsReviewMode] = useState(initialMode === 'review');
  const [isCompleted, setIsCompleted] = useState(false);

  const modeManager = useTTRModeManager(initialMode, questions.length, streak, isCompleted, checkStatus);

  useEffect(() => {
    const loadData = async () => {
      if (!studyActivityId) return;
      try {
        setIsLoading(true);
        const beData = await fetchStudyActivity(studyActivityId);
        const formattedQuestions = mapBackendDataToGameFormat(beData);
        setQuestions(formattedQuestions);
        setIsLoading(false);
      } 
      catch (err) {
        // [ĐỒNG BỘ] Sử dụng chuẩn error handler mới
        const parsed = parseBackendError(err, "Không thể tải dữ liệu bài tập. Vui lòng thử lại!");
        logBackendError("useTTRGame.loadData", parsed);
        setErrorFromParsed(setError, parsed); 
        setIsLoading(false);
      }
    };
    loadData();
  }, [studyActivityId]);

  const totalQuestions = questions.length;

  useEffect(() => {
    if (streak > 0 && totalQuestions > 0) {
      const base = Math.min(totalQuestions, 10);
      const step3 = Math.max(1, Math.round(base * 0.3)); 
      const step5 = Math.max(1, Math.round(base * 0.5)); 
      const step7 = Math.max(1, Math.round(base * 0.7)); 

      if (streak % step3 === 0) setPower5050(prev => prev + 1);
      if (streak % step5 === 0) setPowerMagic(prev => prev + 1);
      if (streak % step7 === 0) setShieldActive(true);
    }
  }, [streak, totalQuestions]);

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : null;

  useEffect(() => {
    if (isReviewMode && currentQuestion) {
      const autoFilled = {};
      const rights = [];
      const assignedOptionIds = new Set();
      
      currentQuestion.blanks.forEach(b => {
        // Tìm option trùng chữ chưa được gán cho ô nào trước đó để kích hoạt mờ nút dưới UI công bằng
        const foundOption = currentQuestion.options.find(o => o.text === b.correctWord && !assignedOptionIds.has(o.id));
        if (foundOption) {
          autoFilled[b.id] = foundOption.id;
          assignedOptionIds.add(foundOption.id);
        } else {
          autoFilled[b.id] = b.correctWord;
        }
        rights.push(b.id);
      });
      setFilledBlanks(autoFilled);
      setConfirmedBlanks(rights);
      setCheckStatus('success');
    } else {
      if (currentQuestion && currentQuestion.blanks.length > 0) setActiveBlankId(currentQuestion.blanks[0].id);
      setFilledBlanks({});
      setWrongBlanks([]);
      setConfirmedBlanks([]); 
      setCheckStatus('idle');
      setEliminatedOptions([]); 
    }
  }, [currentIndex, currentQuestion, isReviewMode]);

  const handleUse5050 = useCallback(() => {
    if (power5050 <= 0 || checkStatus === 'success' || !currentQuestion) return;
    const correctWords = currentQuestion.blanks.map(b => b.correctWord);
    // Lọc theo thuộc tính .text của option object
    const wrongOptions = currentQuestion.options.filter(opt => !correctWords.includes(opt.text) && !eliminatedOptions.includes(opt.id));
    const numToRemove = Math.max(1, Math.floor(wrongOptions.length / 2));
    const removed = [...wrongOptions].sort(() => 0.5 - Math.random()).slice(0, numToRemove).map(o => o.id);
    setEliminatedOptions(prev => [...prev, ...removed]);
    setPower5050(prev => prev - 1); 
  }, [power5050, checkStatus, currentQuestion, eliminatedOptions]);

  const handleUseMagic = useCallback(() => {
    if (powerMagic <= 0 || checkStatus === 'success' || !currentQuestion) return;
    const targetBlank = currentQuestion.blanks.find(b => !confirmedBlanks.includes(b.id));
    if (targetBlank) {
      const usedOptionIds = Object.values(filledBlanks);
      const foundOption = currentQuestion.options.find(o => o.text === targetBlank.correctWord && !usedOptionIds.includes(o.id));
      const optionId = foundOption ? foundOption.id : targetBlank.correctWord;

      setFilledBlanks(prev => ({ ...prev, [targetBlank.id]: optionId }));
      setConfirmedBlanks(prev => [...prev, targetBlank.id]);
      setPowerMagic(prev => prev - 1); 
      const nextEmpty = currentQuestion.blanks.find(b => b.id !== targetBlank.id && !confirmedBlanks.includes(b.id));
      setActiveBlankId(nextEmpty ? nextEmpty.id : null);
    }
  }, [powerMagic, checkStatus, currentQuestion, confirmedBlanks, filledBlanks]);

  // Nhận optionId thay vì chữ văn bản thuần
  const handleSelectWord = useCallback((optionId) => {
    if (!activeBlankId || checkStatus === 'success' || !currentQuestion) return;
    setFilledBlanks(prev => {
      const newFilled = { ...prev, [activeBlankId]: optionId };
      const nextEmpty = currentQuestion.blanks.find(b => b.id !== activeBlankId && !newFilled[b.id] && !confirmedBlanks.includes(b.id));
      setActiveBlankId(nextEmpty ? nextEmpty.id : null);
      return newFilled;
    });
  }, [activeBlankId, checkStatus, currentQuestion, confirmedBlanks]);

  // Nhận optionId từ sự kiện Drag Drop
  const handleDropWord = useCallback((optionId, targetBlankId) => {
    if (checkStatus === 'success' || confirmedBlanks.includes(targetBlankId) || !currentQuestion) return;
    setFilledBlanks(prev => {
      const newFilled = { ...prev, [targetBlankId]: optionId };
      const nextEmpty = currentQuestion.blanks.find(b => !newFilled[b.id] && !confirmedBlanks.includes(b.id));
      setActiveBlankId(nextEmpty ? nextEmpty.id : null);
      return newFilled;
    });
  }, [checkStatus, confirmedBlanks, currentQuestion]);
  
  const handleBlankClick = useCallback((blankId) => {
    if (checkStatus === 'success' || confirmedBlanks.includes(blankId)) return;
    if (filledBlanks[blankId]) {
      const newFilled = { ...filledBlanks };
      delete newFilled[blankId];
      setFilledBlanks(newFilled);
    }
    setActiveBlankId(blankId); 
  }, [filledBlanks, checkStatus, confirmedBlanks]);

  const handleCheckAnswer = () => {
    let wrongs = [], rights = [], newlyCorrectCount = 0;
    currentQuestion.blanks.forEach(b => {
      const assigned = filledBlanks[b.id];
      const assignedOption = currentQuestion.options.find(o => o.id === assigned);
      // Lấy text thực tế ra để so với đáp án đúng của BE
      const assignedText = assignedOption ? assignedOption.text : assigned;

      if (assignedText !== b.correctWord) wrongs.push(b.id);
      else {
        rights.push(b.id);
        if (!confirmedBlanks.includes(b.id)) newlyCorrectCount++; 
      }
    });

    const isFullCorrect = wrongs.length === 0;
    const isAnyWrong = wrongs.length > 0;

    modeManager.processAnswerTime(isFullCorrect, isAnyWrong, newlyCorrectCount);

    if (isFullCorrect) {
      setCheckStatus('success');
      setConfirmedBlanks(rights);
      setStreak(prev => prev + 1);
      setActiveBlankId(null);
    } else {
      const isFatal = modeManager.processSurvivalDamage();
      if (isFatal) return;

      setCheckStatus('wrong');
      setWrongBlanks(wrongs);
      setConfirmedBlanks(prev => [...new Set([...prev, ...rights])]); 
      
      if (initialMode === 'survival') {
        setStreak(0);
        if (shieldActive) setShieldActive(false);
      } else {
        if (shieldActive) {
          setShieldActive(false); 
        } else {
          setStreak(0); 
        }
      }

      setTimeout(() => {
        setFilledBlanks(prev => {
          const newF = { ...prev };
          wrongs.forEach(id => delete newF[id]);
          return newF;
        });
        setWrongBlanks([]);
        setCheckStatus('idle');
        setActiveBlankId(wrongs[0]); 
      }, 1000);
    }
  };

  const handleNextQuestion = useCallback(() => {
    if (checkStatus !== 'success') return;
    setCheckStatus('idle'); 
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else { 
      setIsCompleted(true); 
    }
  }, [currentIndex, totalQuestions, checkStatus]);

  const toggleReviewMode = useCallback((active) => { setIsReviewMode(active); }, []);

  return {
    isLoading, error, clearError: () => setError(null), isReviewMode, toggleReviewMode,
    isCompleted, mode: initialMode, 
    ...modeManager,
    currentIndex, totalQuestions, currentQuestion: questions[currentIndex],
    activeBlankId, filledBlanks, wrongBlanks, confirmedBlanks, checkStatus, streak,
    power5050, powerMagic, shieldActive, eliminatedOptions,
    onSelectWord: handleSelectWord, onDropWord: handleDropWord, onBlankClick: handleBlankClick,    
    onCheckAnswer: handleCheckAnswer, onNextQuestion: handleNextQuestion, onExit: onClose,
    handleUse5050, handleUseMagic,
  };
};