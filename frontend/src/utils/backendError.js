export const parseBackendError = (error, fallbackMsg = "Có lỗi xảy ra, vui lòng thử lại sau.") => {
    const status = error?.status_code || error?.response?.status;
    const exceptionType = error?.exception_type || error?.response?.data?.exception_type;
    const backendMessage = error?.message || error?.response?.data?.message;

    let uiMessage = fallbackMsg;
    let type = "error"; // mặc định

    switch (status) {
        case 400:
            uiMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!";
            type = "warning"; // lỗi do user nhập sai → warning
            break;
        case 401:
            uiMessage = "Phiên đăng nhập đã hết hạn, vui lòng tải lại trang.";
            type = "warning";
            break;
        case 404:
            uiMessage = "Tài nguyên không tìm thấy hoặc đã bị xóa.";
            type = "warning";
            break;
        case 409:
            if (exceptionType === "SUBMITTED_EXERCISE") {
                uiMessage = "Bài tập này đã được nộp rồi, không thể thao tác nữa!";
            } else if (exceptionType === "TAKEN_INFO") {
                uiMessage = "Thông tin này đã tồn tại trong hệ thống.";
            } else {
                uiMessage = "Dữ liệu bị xung đột với hệ thống.";
            }
            type = "warning";
            break;
        case 500:
            uiMessage = "Hệ thống đang gặp sự cố (Lỗi 500). Vui lòng báo cáo quản trị viên.";
            type = "error";
            break;
        case 502:
            uiMessage = "Cú Mèo (AI) đang gặp khó khăn. Hãy thử lại nhé!";
            type = "error";
            break;
        case 503:
            uiMessage = "Hệ thống AI đang quá tải. Bé đợi một chút rồi thử lại nha!";
            type = "error";
            break;
        default:
            if (!status) {
                uiMessage = "Không kết nối được máy chủ. Bé kiểm tra mạng nhé!";
                type = "error";
            } else if (backendMessage) {
                uiMessage = backendMessage;
            }
    }


    return { status, exceptionType, backendMessage, message: uiMessage, type, rawError: error };
};

export const logBackendError = (scope, parsedError, options = {}) => {
    if (!parsedError) return;

    const { isDeveloperFix = false } = options;
    const { status, exceptionType, backendMessage, rawError, message } = parsedError;

    if (isDeveloperFix) {
        console.error(`[${scope}] Backend error (needs dev fix):`, { status, exceptionType, backendMessage, uiMessage: message }, rawError);
        return;
    }

    console.warn(`[${scope}] Backend error:`, { status, exceptionType, backendMessage, uiMessage: message });
};

// Helper dùng chung: gộp message + type vào 1 state thay vì setError(parsed.message)
// Dùng trong tất cả hook: setErrorFromParsed(setError, parsed)
export const setErrorFromParsed = (setError, parsed) => {
    setError({ message: parsed.message, type: parsed.type });
};