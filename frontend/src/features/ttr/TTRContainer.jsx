import React, { useState } from 'react';
import { TTRSetupModal } from './components/TTRSetupModal';
import { TTRFeature } from './index'; 
import { createTTRActivity } from './api/ttrApi';

export const TTRContainer = ({ interactionId, onClose }) => {
  const [step, setStep] = useState('setup'); 
  const [activityId, setActivityId] = useState(null);

  // Nhận ĐÚNG CẤU TRÚC Object từ Modal gửi ra
  const handleStartCreation = async ({ prompt, gameMode, subjectType }) => {
    try {
      setStep('loading');
      
      // Truyền thêm subject_type xuống API
      const data = await createTTRActivity(interactionId, { 
        prompt: prompt,
        subject_type: subjectType 
      });
      
      setActivityId(data.id);
      setStep('game');
    } catch (error) {
      alert("Lỗi: " + error.message);
      setStep('setup');
    }
  };

  if (step === 'setup' || step === 'loading') {
    return (
      <TTRSetupModal 
        isOpen={isSetupOpen} 
        onClose={() => setIsSetupOpen(false)} 
        onSubmit={(data) => handleCreateTTRBackground(data)} // Bắt buộc phải bọc (data) như thế này
      />
    );
  }

  return <TTRFeature activityId={activityId} onClose={onClose} />;
};