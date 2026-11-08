import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/chatApi';

const getErrorMessage = (status) => {
    switch (status) {
        case 400: return "Câu hỏi có vẻ hơi lạ hoặc thiếu tài liệu tham khảo. Bé kiểm tra lại nhé!";
        case 401: return "Phiên làm việc hết hạn rồi. Bé đăng nhập lại để tiếp tục nhé!";
        case 422: return "Có lỗi về định dạng tin nhắn hoặc đường dẫn. Bé kiểm tra lại nha!";
        default: return "AI đang bận một chút hoặc lỗi kết nối mạng. Bé thử lại sau nhé!";
    }
};

export const useChat = (interactionId) => {
    const [chatlog, setChatlog] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [promptText, setPromptText] = useState('');

    const readChat = useCallback(async () => {
        if (!interactionId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.readChat(interactionId);
            const formattedLog = data.flatMap(item => [
                { role: "user", content: item.prompt },
                { role: "ai", content: item.answer }
            ]);
            setChatlog(formattedLog);
        } catch (err) {
            setError(getErrorMessage(err.response?.status));
        } finally {
            setIsLoading(false);
        }
    }, [interactionId]);

    useEffect(() => {
        setChatlog([]);
        setError(null);
        setPromptText('');
        if (interactionId) {
            readChat();
        }
    }, [interactionId, readChat]);

    // 🎯 SỬA CHỮA: Nhận trực tiếp văn bản và ID tài liệu từ ngoài vào
    const askLLM = async (directText = null, documentId = null) => {
        // Lấy text trực tiếp nếu có (Auto Chat), nếu không thì lấy từ ô nhập liệu
        const textToSubmit = directText !== null ? directText.trim() : promptText.trim();
        
        if (!interactionId) {
            setError("Bé ơi, hãy chọn một cuộc trò chuyện trước khi hỏi nhé!");
            return;
        }
        if (!textToSubmit) return;

        setIsLoading(true);
        setError(null);
        
        // Chỉ dọn dẹp ô nhập liệu nếu người dùng tự chat tay
        if (directText === null) setPromptText('');

        const userMsg = { role: "user", content: textToSubmit };
        setChatlog((prev) => [...prev, userMsg]);

        try {
            // 🎯 GỌI API: Truyền documentId thẳng xuống file chatApi
            const response = await api.askLLM(interactionId, textToSubmit, documentId);
            
            if (response && response.answer) {
                setChatlog((prev) => [...prev, { role: "ai", content: response.answer }]); 
            }
            return response;
        } catch (err) {
            if (directText === null) setPromptText(textToSubmit);
            setChatlog((prev) => prev.filter(msg => msg !== userMsg)); 
            setError(getErrorMessage(err.response?.status));
        } finally {
            setIsLoading(false);
        }
    };

    return { chatlog, isLoading, error, promptText, setPromptText, readChat, askLLM };
};