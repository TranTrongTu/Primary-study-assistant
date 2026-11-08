import { useState } from 'react';
// Import API tạo bài tập của bạn vào
import { createStudyActivity } from '../api/studyActivityApi'; 

export const useCreateEssay = (interactionId, onSuccess) => {
    const [isCreatingEssay, setIsCreatingEssay] = useState(false);

    // Kích hoạt khi bấm nút công cụ "Tự luận", sau khi tạo xong sẽ gọi fetchActivities để load lại list
    const handleCreateEssay = async (setupData) => {
        if (!interactionId) return;
        
        setIsCreatingEssay(true);
        try {
            const payload = {
                prompt: setupData?.prompt,
                activity_type: "EXERCISE",
                activity_format: "OPEN_ENDED",
                subject_type: setupData?.subject
            };
            
            const newActivity = await createStudyActivity(interactionId, payload);
            console.log("Tạo bài tập thành công, ID:", newActivity.id);
            if (onSuccess) onSuccess(); // Báo cho cha biết để gọi fetchActivities()
        } catch (error) {
            console.error("Lỗi khi tạo bài tập:", error);
            alert("Có lỗi xảy ra khi gọi AI tạo bài tập.");
        } finally {
            setIsCreatingEssay(false);
        }
    };

    return {
        isCreatingEssay,
        handleCreateEssay
    };
};