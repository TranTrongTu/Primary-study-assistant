const baseByKey = {
    "400:REQUEST_VALIDATION": {
        userMessage:
        "Hệ thống nhận dữ liệu chưa đúng định dạng khi xử lý. Bé không cần làm gì cả, đội phát triển sẽ kiểm tra và sửa ngay.",
        isDeveloperFix: true,
    },
    "400:BAD_REQUEST": {
        userMessage:
        "Dữ liệu bé gửi chưa phù hợp. Bé kiểm tra lại rồi thử nhé.",
        isDeveloperFix: false,
    },
    "401:AUTHENTICATION": {
        userMessage: "Phiên đăng nhập của bé đã hết hạn. Bé đăng nhập lại nhé.",
        isDeveloperFix: false,
    },
    "404:NOT_FOUND": {
        userMessage:
        "Không tìm thấy dữ liệu bộ thẻ flashcard tương ứng. Bé thử tải lại trang nhé.",
        isDeveloperFix: false,
    },
    // "409:TAKEN_INFO": {
    //     userMessage: "Email này đã được sử dụng. Bé thử lại email khác nhé.",
    //     isDeveloperFix: false,
    // },
    // "409:SUBMITTED_EXERCISE": {
    //     userMessage: "Bài này đã nộp rồi nên không thể sửa nữa.",
    //     isDeveloperFix: false,
    // },
    "500:INTERNAL_ERROR": {
        userMessage:
        "Hệ thống đang gặp lỗi nội bộ khi xử lý bộ thẻ flashcard. Bé thử lại sau nhé.",
        isDeveloperFix: true,
    },
    "502:LLM_ERROR": {
        userMessage:
        "AI chưa xử lý được nội dung lần này. Bé nhập lại yêu cầu rõ hơn nhé.",
        isDeveloperFix: false,
    },
    "503:EXTERNAL_SERVICE": {
        userMessage:
        "Dịch vụ AI đang bận hoặc tạm thời gián đoạn. Bé thử lại sau ít phút nhé.",
        isDeveloperFix: false,
    },
};

const fallbackByStatus = {
    400: {
        userMessage:
        "Yêu cầu chưa hợp lệ. Bé kiểm tra lại nội dung và thử lại nhé.",
        isDeveloperFix: false,
    },
    401: {
        userMessage: "Phiên đăng nhập của bé đã hết hạn. Bé đăng nhập lại nhé.",
        isDeveloperFix: false,
    },
    404: {
        userMessage: "Không tìm thấy dữ liệu. Bé tải lại trang để đồng bộ nhé.",
        isDeveloperFix: false,
    },
    409: {
        userMessage:
        "Dữ liệu đang xung đột trạng thái. Bé thử tải lại rồi thao tác lại nhé.",
        isDeveloperFix: false,
    },
    500: {
        userMessage: "Hệ thống đang gặp lỗi. Bé thử lại sau nhé.",
        isDeveloperFix: true,
    },
    502: {
        userMessage:
        "AI đang trả nội dung chưa hợp lệ. Bé thử lại với yêu cầu rõ hơn nhé.",
        isDeveloperFix: false,
    },
    503: {
        userMessage: "Dịch vụ ngoài đang tạm gián đoạn. Bé thử lại sau nhé.",
        isDeveloperFix: false,
    },
};

const actionOverrides = {
    create: {
        "400:BAD_REQUEST": {
        userMessage:
            "Nội dung bé nhập chưa phù hợp để tạo bộ thẻ flashcard. Bé thử viết rõ hơn nhé.",
        isDeveloperFix: false,
        },
        "404:NOT_FOUND": {
        userMessage:
            "Không tìm thấy buổi học để tạo bộ thẻ flashcard. Bé thử tải lại trang nhé.",
        isDeveloperFix: false,
        },
        "502:LLM_ERROR": {
        userMessage:
            "AI tạo bộ thẻ đang gặp vấn đề. Bé thử mô tả rõ hơn hoặc thử lại sau nhé.",
        isDeveloperFix: false,
        },
        "503:EXTERNAL_SERVICE": {
        userMessage:
            "Dịch vụ AI đang bận khi tạo bộ thẻ. Bé thử lại sau ít phút nhé.",
        isDeveloperFix: false,
        },
    },
    readSets: {
        "404:NOT_FOUND": {
        userMessage:
            "Không tìm thấy buổi học để lấy danh sách bộ thẻ flashcard. Bé thử tải lại trang nhé.",
        isDeveloperFix: false,
        },
    },
    readCards: {
        "404:NOT_FOUND": {
        userMessage:
            "Bộ thẻ này không còn tồn tại hoặc đã bị xóa.",
        isDeveloperFix: false,
        },
    },
    delete: {
        "404:NOT_FOUND": {
        userMessage:
            "Bộ thẻ này đã bị xóa trước đó rồi.",
        isDeveloperFix: false,
        },
    },
    createEmpty: {
        "404:NOT_FOUND": {
        userMessage:
            "Không tìm thấy buổi học để tạo bộ thẻ flashcard. Bé thử tải lại trang nhé.",
        isDeveloperFix: false,
        },
    },
    addCard: {
        "404:NOT_FOUND": {
        userMessage:
            "Không tìm thấy bộ thẻ flashcard để thêm thẻ. Bé thử tải lại trang nhé.",
        isDeveloperFix: false,
        },
    },
    updateCard: {
        "404:NOT_FOUND": {
        userMessage:
            "Không tìm thấy thẻ flashcard để chỉnh sửa. Bé thử tải lại trang nhé.",
        isDeveloperFix: false,
        },
    },
    deleteCard: {
        "404:NOT_FOUND": {
        userMessage:
            "Thẻ này đã được xóa trước đó rồi.",
        isDeveloperFix: false,
        },
    },
};

export const getFlashcardErrorInfo = (parsedError, action, options = {}) => {
    const fallbackMessage =
        options.fallbackMessage ||
        "Đã có lỗi xảy ra với bộ thẻ flashcard. Bé thử lại sau nhé.";

    const status = parsedError?.status;
    const exceptionType = parsedError?.exceptionType;
    const key = `${status || "UNKNOWN"}:${exceptionType || "UNKNOWN"}`;

    const override = action ? actionOverrides[action] : null;
    const mapped =
        (override && override[key]) ||
        baseByKey[key] ||
        fallbackByStatus[status] ||
        { userMessage: fallbackMessage, isDeveloperFix: false };

    return {
        userMessage: mapped.userMessage,
        isDeveloperFix: mapped.isDeveloperFix,
    };
};