import { useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api/documentsApi';

export const useLearningPath = () => {
  const params = useParams();
  
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [pathData, setPathData] = useState(null);

  const generateLearningPath = async (documentId, documentName) => {
    // Đảm bảo bắt được Interaction ID dù cho React Router có bị ảnh hưởng bởi lớp Portal
    const interactionId = params.interactionId || window.location.pathname.split('/')[2];
    
    if (!interactionId || !documentId) return;

    setIsGeneratingPath(true);
    setPathData(null); 
    
    try {
      const responseData = await api.readDocumentComplete(interactionId, documentId);
      
      // Bóc tách dữ liệu AI nằm lẫn trong mảng
      let actualData = responseData.data || responseData;
      let aiData = null;
      
      if (Array.isArray(actualData)) {
        // Tìm phần tử chứa Lộ trình AI
        aiData = actualData.find(item => item.summary || item.material_recommendations);
      } else {
        aiData = actualData.summary ? actualData : null;
      }

      if (aiData) {
        setPathData(aiData);
      } else {
        setPathData(null);
        alert("⏳ Cú Mèo đang bắt đầu đọc tài liệu này ở hậu trường. Bé hãy đợi vài phút rồi mở lại nhé!");
      }

    } catch (error) {
      console.error("Lỗi khi tải dữ liệu phân tích:", error);
      setPathData(null); 
      
      // 🎯 LỖI SỐ 3: Bắt trúng tim đen lỗi 400 (Backend chưa xử lý xong)
      if (error.response && error.response.status === 400) {
         alert("⏳ Cú Mèo đang mải miết đọc và tóm tắt tài liệu bé vừa tải lên. Bé đợi khoảng 1-2 phút rồi bấm lại nhé!");
      } else {
         alert("❌ Ối, kết nối bị gián đoạn mất rồi. Bé hãy thử F5 lại trang xem sao!");
      }
    } finally {
      setIsGeneratingPath(false);
    }
  };

  return { isGeneratingPath, pathData, generateLearningPath };
};