import { useState, useEffect } from 'react';
import { 
    createStudentAssessment, 
    readLatestStudentAssessment, 
    readStudentAssessment,
    readStudentAssessmentByDay 
} from '../api/studyProgressAPI';

export const useEvaluation = (autoFetch = false) => {
    const [todayAssessment, setTodayAssessment] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [totalHistory, setTotalHistory] = useState(0);
    const [detailAssessment, setDetailAssessment] = useState(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    
    const [error, setError] = useState(null);
    const [detailError, setDetailError] = useState(null); // Quản lý lỗi màn hình chi tiết riêng biệt

    // ĐỒNG BỘ BACKEND: Chuẩn hóa bóc tách dữ liệu mảng hoặc đối tượng có chứa trường .content
    const normalizeText = (data) => {
        if (data == null) return '';
        if (typeof data === 'string') return data;
        
        // 1. Nếu Backend trả về dạng Mảng (Array) chứa phần tử
        if (Array.isArray(data)) {
            if (data.length === 0) return '';
            const firstItem = data[0];
            return firstItem.content || firstItem.assessment || JSON.stringify(firstItem);
        }
        
        // 2. Nếu Backend trả về dạng Đối tượng (Object) đơn lẻ
        if (typeof data === 'object') {
            return data.content || data.assessment || JSON.stringify(data);
        }
        return String(data);
    };

    // Tác vụ 1: Lấy hoặc tạo đánh giá hôm nay
    const fetchAssessment = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await createStudentAssessment();
            if (!data) {
                const latestData = await readLatestStudentAssessment();
                setTodayAssessment(normalizeText(latestData));
                return;
            }
            setTodayAssessment(normalizeText(data));
        } catch (err) {
            console.error('Lỗi khi load đánh giá hôm nay:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch) {
            fetchAssessment();
        }
    }, [autoFetch]);
    // Tác vụ 2: Tải danh sách lịch sử nhật ký (useEvaluation_5.js)
    const readHistory = async (limit, offset) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await readStudentAssessment(limit, offset);
            
            if (Array.isArray(response)) {
                setHistoryList(response);
                
                // SỬA LỖI TẠI ĐÂY: Tính toán tổng số bản ghi thực tế một cách chính xác
                // Nếu mảng trả về nhỏ hơn limit, tức là đã hết sạch dữ liệu => total chính bằng offset + độ dài mảng hiện tại.
                // Nếu mảng trả về bằng đúng limit, ta giả định tạm thời là CÓ THỂ còn trang tiếp theo (total = offset + limit + 1).
                // Tuy nhiên, để tránh "trang bóng ma" khi vừa đủ 10, ta kiểm tra nếu response.length < limit thì đóng form chuẩn.
                if (response.length < limit) {
                    setTotalHistory(offset + response.length);
                } else {
                    // Nếu vừa đúng 10, tạm thời cho phép bấm "Sau" nhưng ở Window ta sẽ khóa điều kiện dựa trên mảng rỗng
                    setTotalHistory(offset + response.length + 1);
                }
            } else if (response && Array.isArray(response.data)) {
                setHistoryList(response.data);
                setTotalHistory(response.total || response.data.length);
            } else if (response) {
                const possibleArray = response.results || response.items || [];
                setHistoryList(Array.isArray(possibleArray) ? possibleArray : [response]);
                setTotalHistory(1);
            }
        } catch (err) {
            console.error('Lỗi khi tải lịch sử:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Tác vụ 3: Truy vấn chi tiết theo ngày khi click chọn hoặc tra cứu thủ công
    const readDetailByDay = async (dateStr) => {
        if (!dateStr) {
            setDetailError(new Error("Không tìm thấy thông tin ngày đánh giá hợp lệ."));
            return;
        }
        setIsDetailLoading(true);
        setDetailError(null);
        setDetailAssessment(null); // Xóa dữ liệu cũ tránh hiện đè
        try {
            const data = await readStudentAssessmentByDay(dateStr);
            const parsedText = normalizeText(data);
            
            if (!parsedText || parsedText.trim() === "" || parsedText === "undefined") {
                setDetailError(new Error("Không có dữ liệu"));
            } else {
                setDetailAssessment(parsedText); // Lưu chuỗi văn bản Markdown sạch vào State
            }
        } catch (err) {
            console.error('Lỗi khi tải chi tiết theo ngày:', err);
            setDetailError(err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    return { 
        todayAssessment, 
        historyList, 
        totalHistory, 
        detailAssessment,
        setDetailAssessment,
        isLoading, 
        isDetailLoading,
        error, 
        detailError,
        setDetailError,
        fetchAssessment, 
        readHistory,
        readDetailByDay 
    };
};