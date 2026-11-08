// src/features/interactions/hooks/useInteractions.js
import { useState, useEffect, useCallback } from "react";
import * as api from "../api/interactionsAPI";
import { useChartStore } from "../../home/hooks/useChartStore";

// Helper tập trung xử lý thông báo lỗi
const getErrorMessage = (status) => {
    switch (status) {
        case 401: return "Phiên làm việc đã hết hạn. Bé vui lòng đăng nhập lại nhé!";
        case 404: return "Hệ thống không tìm thấy sổ ghi chú này.";
        case 422: return "Bé điền thiếu thông tin rồi!";
        default: return "Máy chủ đang bận một chút hoặc lỗi kết nối. Bé thử lại sau nhé!";
    }
};

export const useInteractions = () => {
    const triggerRefresh = useChartStore((state) => state.triggerRefresh);
    // 1. STATE CHÍNH
    const [interactions, setInteractions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeInteractionId, setActiveInteractionId] = useState(null);

    // 2. STATE FORM & EDITING
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState(null); // null means the user is creating new a one

    // 3. UI HANDLERS
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (interaction) => {
        setEditingId(interaction.id);
        setFormData({ name: interaction.name, description: interaction.description || '' });
    };

    const cancelEditClick = () => {
        setEditingId(null);
        setFormData({ name: '', description: '' });
    };

    // 4. API WRAPPER (Tránh lặp lại try...catch và loading/error states)
    const executeRequest = async (apiCall, onSuccess) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiCall();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            setError(getErrorMessage(err.response?.status));
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // 5. CRUD OPERATIONS
    const readInteractions = useCallback(() => {
        return executeRequest(api.readInteractions, (data) => { // để ý truyền vô ko có dấu ngoặc
            setInteractions(data);
            if (data.length > 0 && !activeInteractionId) {
                setActiveInteractionId(data[0].id);
            }
        });
    }, [activeInteractionId]);

    useEffect(() => { 
        readInteractions(); 
    }, [readInteractions]);

    const createInteraction = (input) => {
        return executeRequest(() => api.createInteraction(input), (newInteraction) => { // truyền thẳng ở đây thì phải thêm cú pháp () => 
            setInteractions((prev) => [...prev, newInteraction]);
            cancelEditClick(); // Reset form sau khi tạo thành công
        });
    };

    const updateInteraction = (id, updateData) => {
        return executeRequest(() => api.updateInteraction(id, updateData), (updated) => {
            setInteractions((prev) => prev.map((item) => (item.id === id ? updated : item)));
            cancelEditClick(); // Reset form & thoát chế độ edit
        });
    };

    const deleteInteraction = (id) => {
        return executeRequest(() => api.deleteInteraction(id), () => {
            setInteractions((prev) => prev.filter((item) => item.id !== id));

            triggerRefresh(); // Báo cho các component khác biết là đã có thay đổi (VD: để Home fetch lại biểu đồ)
        });
    };

    return {
        interactions, isLoading, error, setError,
        activeInteractionId, setActiveInteractionId,
        formData, handleFormChange, editingId,
        handleEditClick, cancelEditClick,
        readInteractions, createInteraction, updateInteraction, deleteInteraction
    };
};