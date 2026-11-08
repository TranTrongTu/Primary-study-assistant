import axiosClient from '../../../api/axiosClient';


export const getAllStudyActivities = async (interactionId) => {
    // Gọi GET /study-activity/{interaction_id}/
    const response = await axiosClient.get(`/study-activity/${interactionId}/`);
    return response.data;
};

export const createStudyActivity = async (interactionId, payload) => {
    // 🎯 Đảm bảo có document_id trong payload, nếu không có thì mặc định là 0
    const finalPayload = {
        ...payload,
        document_id: payload.document_id || 0
    };

    // Gọi POST /study-activity/{interaction_id}/create
    const response = await axiosClient.post(`/study-activity/${interactionId}/create`, finalPayload);
    return response.data;
};

// 1. Lấy toàn bộ thông tin bài tập (bao gồm danh sách câu hỏi)
export const getStudyActivityComplete = async (studyActivityId) => {
    // Gọi GET /study-activity/{study_activity_id}
    const response = await axiosClient.get(`/study-activity/${studyActivityId}`);
    return response.data;
};

// 2. Lưu câu trả lời nháp của học sinh cho một câu hỏi cụ thể
export const answerExerciseItem = async (exerciseItemId, answerText) => {
    // Gọi PATCH /study-activity/{exercise_item_id}/answer
    // Dữ liệu gửi lên là JSON: { "attempt": "câu trả lời..." }
    const response = await axiosClient.patch(`/study-activity/${exerciseItemId}/answer`, {
        attempt: answerText
    });
    return response.data;
};

// 3. Nộp bài tập
export const submitExerciseActivity = async (studyActivityId) => {
    // Gọi PATCH /study-activity/{study_activity_id}/submit
    const response = await axiosClient.patch(`/study-activity/${studyActivityId}/submit`);
    return response.data;
};


// 4. Xóa bài tập
export const deleteStudyActivity = async (studyActivityId) => {
    // Gọi DELETE /study-activity/{study_activity_id}/delete
    const response = await axiosClient.delete(`/study-activity/${studyActivityId}`);
    return response.data;
};