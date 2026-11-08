import axiosClient from '../../../api/axiosClient';

/**
 * Hàm gọi API chung để lấy dữ liệu tiến độ học tập
 * @param {string} target - Mục tiêu thống kê (VD: 'SCORE', 'COUNT_ITEM', 'COUNT_ACTIVITY')
 * @param {Array} payload - Mảng chứa các quy tắc lọc (filters) và gom nhóm (GROUP_BY)
 * @returns {Promise} Dữ liệu mảng trả về từ API
 */
export const getStudyProgress = async (target, payload) => {
    // Gọi POST /study-progress/?target={target}
    // Axios sẽ tự động parse query params và gắn vào URL
    const response = await axiosClient.post('/study-progress/', payload, {
        params: { target }
    });
    return response.data;
};

// ============================================================================
// CÁC HÀM GỌI API CỤ THỂ CHO TỪNG BIỂU ĐỒ 
// (Giúp code ở Component rõ nghĩa hơn, tái sử dụng hàm getStudyProgress ở trên)
// ============================================================================

// Biểu đồ 1: Tỉ lệ đạt điểm tối đa các môn (Radar 1 biến)
export const fetchScoreRatioRadarChart = async (payload) => {
    return await getStudyProgress('SCORE', payload);
};

// Biểu đồ 2: Phân bổ bài tập theo môn học (Tròn 1 biến)
export const fetchSubjectDistributionPieChart = async (payload) => {
    return await getStudyProgress('COUNT_ITEM', payload);
};

// Biểu đồ 3: Chuỗi ngày luyện tập liên tục (GitHub calendar/Heatmap)
export const fetchStudyStreakHeatmap = async (payload) => {
    return await getStudyProgress('COUNT_ITEM', payload);
};

// Biểu đồ 4: Tỉ lệ hoàn thành bài tập (Vành khuyên)
export const fetchCompletionRateDonutChart = async (payload) => {
    return await getStudyProgress('COUNT_ACTIVITY', payload);
};

// Biểu đồ 5: Số bài nộp theo định dạng (Cột)
export const fetchSubmittedFormatColumnChart = async (payload) => {
    return await getStudyProgress('COUNT_ACTIVITY', payload);
};

// Biểu đồ 6: Xu hướng điểm số theo thời gian (Đường nhiều biến)
export const fetchScoreTrendMultiLineChart = async (payload) => {
    return await getStudyProgress('SCORE', payload);
};

// Biểu đồ 7: Hoạt động học tập yêu thích nhất (Thanh ngang / Cột chồng)
export const fetchFavoriteActivityBarChart = async (payload) => {
    return await getStudyProgress('COUNT_ACTIVITY', payload);
};


// Lấy thông tin đã tạo bất kỳ câu hỏi nào chưa
export const fetchTotalExercisesCount = async () => {
    // Payload rỗng để không bị giới hạn bởi thời gian hay môn học
    const payload = [];
    return await getStudyProgress('COUNT_ITEM', payload);
};

// Tạo đánh giá học sinh
export const createStudentAssessment = async () => {
    const response = await axiosClient.post('/study-progress/study-assessment');
    return response.data;
};

// Lấy đánh giá học sinh mới nhất
export const readLatestStudentAssessment = async () => {
    const response = await axiosClient.get('/study-progress/study-assessment/latest');
    return response.data;
};

// Lấy danh sách đánh giá (Chỉ truyền limit/offset khi có giá trị thực tế, không truyền bừa số 0)
export const readStudentAssessment = async (limit, offset) => {
    const config = {};
    
    // Tạo đối tượng params động
    const params = {};
    if (typeof limit === 'number' && limit > 0) params.limit = limit;
    if (typeof offset === 'number' && offset > 0) params.offset = offset;
    
    // Nếu có tham số cấu hình thì mới đính kèm vào request
    if (Object.keys(params).length > 0) {
        config.params = params;
    }

    const response = await axiosClient.get('/study-progress/study-assessment/', config);
    return response.data;
};

// Lấy chi tiết đánh giá học sinh theo ngày
export const readStudentAssessmentByDay = async (dateStr) => {
    const response = await axiosClient.get('/study-progress/study-assessment', {
        params: { specific_date: dateStr }
    });
    return response.data;
};