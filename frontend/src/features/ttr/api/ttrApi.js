import axiosClient from '../../../api/axiosClient';

// Sử dụng path tương đối vì axiosClient thường đã cấu hình sẵn baseURL
const API_BASE_URL = '/study-activity'; 
const getToken = () => localStorage.getItem('token'); 

// Hàm dùng chung để xử lý lỗi đã được tinh chỉnh cho Axios
const handleApiError = (error) => {
  if (error.response) {
    // Nếu server có trả về response (lỗi 4xx, 5xx)
    const errorData = error.response.data || {};
    
    // Ném ra object lỗi chuẩn xác theo tài liệu Backend
    throw {
      status_code: error.response.status,
      exception_type: errorData.exception_type || 'UNKNOWN_ERROR',
      message: errorData.message || 'Đã xảy ra lỗi không xác định.'
    };
  } else {
    // Nếu không có response (lỗi mạng, không kết nối được)
    throw {
      status_code: 500,
      exception_type: 'NETWORK_ERROR',
      message: "Không thể kết nối đến máy chủ."
    };
  }
};

export const fetchActivitiesByInteraction = async (interactionId) => {
  try {
    const response = await axiosClient.get(`${API_BASE_URL}/${interactionId}/`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) return []; // Nếu không tìm thấy trả về mảng rỗng
    handleApiError(error);
  }
};

export const fetchStudyActivity = async (studyActivityId) => {
  try {
    const response = await axiosClient.get(`${API_BASE_URL}/${studyActivityId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createTTRActivity = async (interactionId, payload) => {
  const finalSubject = payload.subject_type || payload.subjectType || "MATHS";
  const documentId = payload.document_id || 0; // 🎯 Lấy document_id (mặc định 0)

  try {
    const response = await axiosClient.post(`${API_BASE_URL}/${interactionId}/create`, {
      prompt: payload.prompt,
      activity_type: "REVIEW", 
      activity_format: "GAP_FILL",
      subject_type: finalSubject,
      document_id: documentId // 🎯 Đẩy vào body
    }, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteTTRActivity = async (studyActivityId) => {
  try {
    const response = await axiosClient.delete(`${API_BASE_URL}/${studyActivityId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    // Xóa thành công BE thường trả về 204 (No Content) hoặc 200
    if (response.status === 204 || response.status === 200) {
      return true; 
    }
  } catch (error) {
    handleApiError(error);
  }
};