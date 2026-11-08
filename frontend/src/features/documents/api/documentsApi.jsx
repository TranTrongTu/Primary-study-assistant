import axiosClient from '../../../api/axiosClient';

const PATH = '/document';

// POST: query: name, subject_type; body: file
export const saveDocument = async (interactionId, file, documentInput) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = new URLSearchParams();
    if (documentInput.name) {
        params.append('name', documentInput.name);
    }
    
    // 🎯 1. BẮT BUỘC gửi cờ subject_type_overwrite
    // Ép sang chuỗi để truyền an toàn qua URL Query Params
    params.append('subject_type_overwrite', String(documentInput.subject_type_overwrite));
    
    // 🎯 2. CHỈ truyền subject_type nếu là 3 môn chính ('MATHS', 'VIETNAMESE', 'ENGLISH')
    // Nếu là null (Khác) hoặc undefined (Auto) thì lệnh if này sẽ false -> KHÔNG TRUYỀN VÀO
    if (documentInput.subject_type) {
        params.append('subject_type', documentInput.subject_type);
    }

    const response = await axiosClient.post(
        `${PATH}/${interactionId}/upload?${params.toString()}`, 
        formData, 
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000 
        }
    );
    return response.data;
};

// GET 1: Lấy danh sách tài liệu cơ bản (Chỉ gồm tên, id, định dạng)
export const readDocuments = async (interactionId) => {
    const response = await axiosClient.get(`${PATH}/${interactionId}/`);  
    return response.data;
};

// GET 2: Lấy Full chi tiết 1 tài liệu (Có Lộ trình, Câu hỏi, Bài tập)
export const readDocumentComplete = async (interactionId, documentId) => {
    const response = await axiosClient.get(`${PATH}/${interactionId}/${documentId}`);
    return response.data;
};

// PATCH: parameter: documentId
export const updateDocument = async (documentId, updateData) => {
    // 🎯 Huy đã mở nhận null, ta truyền thẳng updateData chứa JS null qua luôn, không cắt xén gì nữa
    const response = await axiosClient.patch(`${PATH}/${documentId}`, updateData);
    return response.data;


    
};

// DELETE: parameter: documentId
export const deleteDocument = async (documentId) => {
    const response = await axiosClient.delete(`${PATH}/${documentId}`);
    return response.status === 204 || response.status === 200;
};