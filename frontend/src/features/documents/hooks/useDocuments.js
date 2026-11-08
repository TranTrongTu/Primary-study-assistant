import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/documentsApi';

export const useDocuments = (interactionId) => {
    const [documents, setDocuments] = useState([]);
    const [selectedDocIds, setSelectedDocIds] = useState([]);
    const [editingID, setEditingID] = useState(null);
    const [documentName, setDocumentName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleStartEdit = (doc) => {
        setEditingID(doc.id);
        const dotIndex = doc.name?.lastIndexOf('.') ?? -1;
        const baseName = dotIndex !== -1 ? doc.name.substring(0, dotIndex) : (doc.name || "");
        setDocumentName(baseName);
    };

    const updateDocument = async (id, updates = null) => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return setEditingID(null);

        let payload = {};
        let newName = doc.name;

        if (updates && typeof updates === 'object') {
            if (updates.name && updates.name !== doc.name) payload.name = updates.name;
            
            if (updates.hasOwnProperty('subject_type') && updates.subject_type !== doc.subject_type) {
                 payload.subject_type = updates.subject_type;
            }
        } else {
            const dotIndex = doc.name?.lastIndexOf('.') ?? -1;
            const ext = dotIndex !== -1 ? doc.name.substring(dotIndex) : '';
            if (documentName.trim()) {
                newName = documentName.trim() + ext;
                if (newName !== doc.name) payload.name = newName;
            }
        }

        if (Object.keys(payload).length === 0) return setEditingID(null);

        // 🎯 THÊM ĐOẠN NÀY: Ép luôn luôn có subject_type gửi lên Backend
        // Tránh việc Backend báo lỗi 400 do thiếu trường dữ liệu
        const apiPayload = { ...payload };
        if (!apiPayload.hasOwnProperty('subject_type')) {
            apiPayload.subject_type = ['MATHS', 'VIETNAMESE', 'ENGLISH'].includes(doc.subject_type) ? doc.subject_type : null;
        }

        try {
            // Cập nhật giao diện lập tức cho mượt
            setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, ...payload } : d));
            setEditingID(null);
            
            // Gửi apiPayload (chắc chắn luôn chứa subject_type) lên BE
            await api.updateDocument(id, apiPayload);
        } catch (err) { 
            console.error("Lỗi cập nhật tài liệu:", err);
            readDocuments(); // Nếu BE báo lỗi, nó sẽ fetch lại data cũ (gây ra hiện tượng "giật")
        }
    };

    const uploadMultipleFiles = async (fileItems) => {
        // 🎯 ĐẶT GIỚI HẠN DUNG LƯỢNG Ở FRONTEND (Ví dụ: 20MB = 20 * 1024 * 1024 bytes)
        const MAX_FILE_SIZE = 20 * 1024 * 1024; 

        const validFiles = [];
        const oversizedFiles = [];

        // Kiểm tra từng file trước khi đưa vào hàng đợi
        fileItems.forEach(item => {
            if (item.file.size > MAX_FILE_SIZE) {
                oversizedFiles.push(item);
            } else {
                validFiles.push(item);
            }
        });

        // Cảnh báo thân thiện nếu có file quá nặng
        if (oversizedFiles.length > 0) {
            const fileNames = oversizedFiles.map(f => f.file.name).join(', ');
            alert(`❌ File quá lớn (vượt quá 20MB): ${fileNames}.\n\nCú Mèo không vác nổi đâu, bé hãy cắt nhỏ file PDF ra hoặc chọn file nhẹ hơn nhé!`);
            
            // Nếu không có file nào hợp lệ thì dừng luôn
            if (validFiles.length === 0) return; 
        }

        // Bắt đầu quy trình upload với các file hợp lệ (validFiles)
        const tempDocs = validFiles.map((item, index) => ({ 
            id: `temp-${Date.now()}-${index}`, 
            name: item.file?.name || "Đang tải...", 
            subject_type: item.subject_type,
            isUploading: true,
            created_at: new Date().toISOString() 
        }));
        
        setDocuments(prev => [...tempDocs, ...prev]);

        await Promise.all(
            validFiles.map(async (item, index) => {
                const tempId = tempDocs[index].id;
                
                try {
                    const documentInput = {
                        name: item.file.name,
                        subject_type: item.subject_type, // Có thể là undefined, null, hoặc 'MATHS'...
                        // 🎯 Nếu undefined (Auto) -> true. Còn chọn Khác (null) hoặc 3 môn kia -> false
                        subject_type_overwrite: item.subject_type === undefined ? true : false
                    };

                    const response = await api.saveDocument(interactionId, item.file, documentInput);
                    
                    let actualData = response;
                    if (response && response.data) actualData = response.data;
                    let newDoc = Array.isArray(actualData) ? actualData[0] : actualData;
                    
                    if (!newDoc || !newDoc.name) {
                        newDoc = { ...newDoc, id: newDoc?.id || tempId, name: item.file.name, created_at: new Date().toISOString() };
                    }
                    
                    setDocuments(prev => prev.map(d => d.id === tempId ? newDoc : d));
                } catch (err) { 
                    console.error(`Lỗi tải lên file ${item.file?.name}:`, err);
                    setDocuments(prev => prev.map(d => d.id === tempId ? { ...d, isUploading: false, isError: true } : d)); 
                }
            })
        );
    };

    const readDocuments = useCallback(async () => {
        if (!interactionId) return;
        setIsLoading(true);
        try {
            const data = await api.readDocuments(interactionId);
            setDocuments(data);
        } catch (err) {
            console.error("Lỗi tải tài liệu:", err);
        } finally {
            setIsLoading(false);
        }
    }, [interactionId]);

    useEffect(() => { 
        setDocuments([]); 
        setSelectedDocIds([]);
        if (interactionId) readDocuments(); 
    }, [interactionId, readDocuments]);

    const deleteDocument = async (id) => {
        try {
            setDocuments((prev) => prev.filter(doc => doc.id !== id));
            setSelectedDocIds((prev) => prev.filter(docId => docId !== id));
            await api.deleteDocument(id);
        } catch (err) {
            console.error("Lỗi khi xóa tài liệu:", err);
            readDocuments();
        }
    };

    return { 
        documents, selectedDocIds, editingID, documentName, setDocumentName, 
        handleDocCheck: (id) => setSelectedDocIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]),
        handleStartEdit, updateDocument, uploadMultipleFiles, deleteDocument
    };
};