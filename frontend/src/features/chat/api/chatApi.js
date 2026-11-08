import axiosClient from '../../../api/axiosClient';

const PATH = '/llm-response';

// parameter: interactionId; body: chatInput = { prompt: "...", document_id: 0 }
export const askLLM = async (interactionId, promptText, documentId = 0) => { // 🎯 Nhận documentId (mặc định 0)
    const chatInput = { 
        prompt: promptText,
        document_id: documentId || 0 // 🎯 Đẩy vào body
    };
    
    const response = await axiosClient.post(`${PATH}/${interactionId}/chat`, chatInput);
    return response.data;
};

export const readChat = async (interactionId, limit = null) => {
    const response = await axiosClient.get(`${PATH}/${interactionId}/`, {
        params: limit ? {limit} : {}
    });
    return response.data;
};