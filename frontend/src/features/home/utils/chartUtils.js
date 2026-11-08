// Từ điển map môn học sang Tiếng Việt để hiển thị trên Legend/Tooltip nếu cần
export const SUBJECT_LABELS = {
    "MATHS": "Toán",
    "VIETNAMESE": "Tiếng Việt",
    "ENGLISH": "Tiếng Anh"
};


// Từ điển map activity_format sang Tiếng Việt
export const FORMAT_LABELS = {
    "MULTIPLE_CHOICE_QUESTIONS": "Trắc nghiệm",
    "OPEN_ENDED": "Tự luận"
};


// Từ điển map activity_type sang Tiếng Việt cho các bé dễ đọc
export const ACTIVITY_TYPE_LABELS = {
    "EXERCISE": "Làm bài tập",
    "REVIEW": "Ôn bài"
};


const PIE_COLORS = ['#0088FE', '#FFBB28', '#FF8042', '#00C49F', '#FF4560'];



/**
 * Chuyển đổi giá trị filter UI thành chuỗi ngày tháng cho Payload
 * Trả về định dạng chuỗi: "ddmmyyyy"
 */
export const getStartDateFromFilter = (filterValue) => {
    const today = new Date();
    let daysToSubtract = 7; // Mặc định là tuần

    if (filterValue === "Theo ngày" || filterValue === 1) daysToSubtract = 1;
    if (filterValue === "Theo tuần" || filterValue === 7) daysToSubtract = 7;
    if (filterValue === "Theo tháng" || filterValue === 30) daysToSubtract = 30;
    if (filterValue === "60 ngày" || filterValue === 60) daysToSubtract = 60;
    if (filterValue === "90 ngày" || filterValue === 90) daysToSubtract = 90;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - daysToSubtract);

    // Lấy ngày, tháng, năm
    const day = String(targetDate.getDate()).padStart(2, '0');
    const month = String(targetDate.getMonth() + 1).padStart(2, '0'); // Tháng trong JS bắt đầu từ 0
    const year = targetDate.getFullYear();

    // Trả về chuỗi ddmmyyyy
    return `${day}${month}${year}`; 
};

/**
 * Biến đổi dữ liệu mảng 3 chiều của API (Target: SCORE)
 * Fix: Luôn đảm bảo hiển thị đủ 3 môn học trên Radar Chart
 */
export const transformScoreData = (rawData) => {
    // 1. Khởi tạo mặc định 3 môn với điểm số 0%
    const defaultData = {
        "MATHS": { achieved: 0, max: 0, label: SUBJECT_LABELS["MATHS"], percentage: 0 },
        "VIETNAMESE": { achieved: 0, max: 0, label: SUBJECT_LABELS["VIETNAMESE"], percentage: 0 },
        "ENGLISH": { achieved: 0, max: 0, label: SUBJECT_LABELS["ENGLISH"], percentage: 0 }
    };

    // 2. Cập nhật dữ liệu thực tế từ API (nếu có)
    if (rawData && Array.isArray(rawData)) {
        rawData.forEach(item => {
            const achieved = parseFloat(item[0]) || 0;
            const max = parseFloat(item[1]) || 0;
            const subjectKey = item[2]; // "MATHS", "VIETNAMESE", "ENGLISH"

            // Nếu key tồn tại trong defaultData thì ghi đè kết quả
            if (defaultData[subjectKey]) {
                defaultData[subjectKey].achieved = achieved;
                defaultData[subjectKey].max = max;
                defaultData[subjectKey].percentage = max > 0 ? parseFloat(((achieved / max) * 100).toFixed(2)) : 0;
            }
        });
    }

    // 3. Trả về mảng theo đúng thứ tự cố định (Toán -> Văn -> Anh)
    return [
        defaultData["MATHS"],
        defaultData["VIETNAMESE"],
        defaultData["ENGLISH"]
    ];
};


/**
 * Biến đổi dữ liệu mảng 2 chiều (Target: COUNT_ITEM, COUNT_ACTIVITY)
 * Thường dùng cho Pie Chart, Bar Chart, Donut Chart
 */
export const transformCountData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];
    
    // 1. Tính tổng số lượng
    let total = 0;
    const mappedData = rawData.map(item => {
        const count = parseInt(item[0], 10) || 0;
        const rawLabel = item[1]; 
        total += count;
        return {
            count: count,
            label: SUBJECT_LABELS[rawLabel] || rawLabel 
        };
    });

    if (total === 0) return mappedData;

    // 2. NHÂN LÊN 1000 LẦN (Để tính toán 1 chữ số thập phân)
    const percentagesWithRemainders = mappedData.map(item => {
        const exactScaled = (item.count / total) * 1000; 
        const integerPart = Math.floor(exactScaled); // Lấy phần nguyên (VD: 333)
        const remainder = exactScaled - integerPart; // Lấy phần dư
        return { ...item, integerPart, remainder, originalIndex: mappedData.indexOf(item) };
    });

    // 3. Tính tổng các phần nguyên hiện tại (Ví dụ: ra 999)
    let currentSum = percentagesWithRemainders.reduce((sum, item) => sum + item.integerPart, 0);

    // 4. Tìm số đơn vị còn thiếu để đủ 1000
    let difference = 1000 - currentSum;

    // 5. Sắp xếp mảng theo phần dư giảm dần để ưu tiên "phát kẹo"
    percentagesWithRemainders.sort((a, b) => b.remainder - a.remainder);

    // 6. Phân bổ các đơn vị còn thiếu cho những lát cắt có phần dư lớn nhất
    for (let i = 0; i < difference; i++) {
        percentagesWithRemainders[i].integerPart += 1;
    }

    // Phục hồi lại đúng thứ tự ban đầu của mảng (tránh việc lát cắt bị đổi chỗ)
    percentagesWithRemainders.sort((a, b) => a.originalIndex - b.originalIndex);

    // 7. CHIA NGƯỢC LẠI CHO 10 ĐỂ RA 1 CHỮ SỐ THẬP PHÂN (VD: 334 / 10 = 33.4)
    return percentagesWithRemainders.map((item, index) => ({
        count: item.count,
        label: item.label,
        fill: PIE_COLORS[index % PIE_COLORS.length],
        displayPercent: (item.integerPart / 10).toFixed(1) 
    }));
};



/**
 * Biến đổi dữ liệu cho react-activity-calendar
 * Khắc phục lỗi thiếu ô: Tự động "đổ nền" (pad) các ngày không có dữ liệu thành 0
 */
export const transformHeatmapData = (rawData, daysToView = 90) => {
    // 1. TẠO MẢNG "NỀN" CHỨA ĐẦY ĐỦ CÁC NGÀY (Từ quá khứ tới hôm nay)
    const today = new Date();
    const fullDateRange = [];
    
    for (let i = daysToView - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Ép chuẩn múi giờ địa phương (YYYY-MM-DD)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        // Mặc định tất cả các ngày đều là 0 hoạt động
        fullDateRange.push({
            date: dateString,
            count: 0,
            level: 0
        });
    }

    // Nếu API lỗi hoặc rỗng, trả thẳng mảng nền xám
    if (!rawData || !Array.isArray(rawData)) return fullDateRange;

    // 2. CHUYỂN DATA TỪ API THÀNH DẠNG TỪ ĐIỂN ĐỂ DỄ GHÉP NỐI
    const actualDataMap = {};
    rawData.forEach(item => {
        const count = parseInt(item[0], 10) || 0;
        const dateString = item[1] || "";
        
        let level = 0;
        if (count > 0 && count <= 2) level = 1;
        else if (count > 2 && count <= 5) level = 2;
        else if (count > 5 && count <= 10) level = 3;
        else if (count > 10) level = 4;

        actualDataMap[dateString] = { count, level };
    });

    // 3. ĐÈ DATA THỰC TẾ LÊN MẢNG NỀN
    return fullDateRange.map(dayTemplate => {
        const actualData = actualDataMap[dayTemplate.date];
        if (actualData) {
            // Ngày nào có học -> Ghi đè số lượng và level màu
            return {
                ...dayTemplate,
                count: actualData.count,
                level: actualData.level
            };
        }
        // Ngày nào cúp học -> Giữ nguyên nền 0
        return dayTemplate;
    });
};



/**
 * Biến đổi dữ liệu mảng 2 chiều cho Biểu đồ Vành khuyên (Target: COUNT_ACTIVITY)
 * Áp dụng Thuật toán Largest Remainder để chia % chính xác tuyệt đối (1 chữ số thập phân)
 */
export const transformCompletionData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];
    
    // 1. Map dữ liệu cơ bản và tính tổng
    let total = 0;
    const mappedData = rawData.map(item => {
        const count = parseInt(item[0], 10) || 0;
        const isSubmitted = item[1]; // true hoặc false
        total += count;
        
        return {
            count: count,
            label: isSubmitted === true ? "Đã nộp" : "Chưa nộp",
            // Khớp với màu sắc trên giao diện UI hiện tại của bạn
            fill: isSubmitted === true ? "#FFBB28" : "#0088FE" 
        };
    });

    if (total === 0) return mappedData;

    // 2. Nhân lên 1000 lần (Để tính toán 1 chữ số thập phân)
    const percentagesWithRemainders = mappedData.map((item, index) => {
        const exactScaled = (item.count / total) * 1000; 
        const integerPart = Math.floor(exactScaled); 
        const remainder = exactScaled - integerPart; 
        return { ...item, integerPart, remainder, originalIndex: index };
    });

    // 3. Tính tổng các phần nguyên hiện tại
    let currentSum = percentagesWithRemainders.reduce((sum, item) => sum + item.integerPart, 0);

    // 4. Tìm số đơn vị còn thiếu để đủ 1000
    let difference = 1000 - currentSum;

    // 5. Sắp xếp mảng theo phần dư giảm dần để ưu tiên "phát kẹo" bù sai số
    percentagesWithRemainders.sort((a, b) => b.remainder - a.remainder);

    // 6. Phân bổ các đơn vị còn thiếu
    for (let i = 0; i < difference; i++) {
        percentagesWithRemainders[i].integerPart += 1;
    }

    // Phục hồi lại đúng thứ tự ban đầu của mảng
    percentagesWithRemainders.sort((a, b) => a.originalIndex - b.originalIndex);

    // 7. Chia ngược lại cho 10 để ra % và trả về kết quả
    return percentagesWithRemainders.map(item => ({
        count: item.count,
        label: item.label,
        fill: item.fill, // Recharts sẽ tự động bắt màu này để tô cho lát cắt
        displayPercent: (item.integerPart / 10).toFixed(1) 
    }));
};




/**
 * Biến đổi dữ liệu mảng 2 chiều cho Biểu đồ Cột (Biểu đồ 5)
 * VD API trả về: [[2, "OPEN_ENDED"], [5, "MULTIPLE_CHOICE_QUESTIONS"]]
 * Output cho UI: [{ count: 2, label: "Tự luận" }, { count: 5, label: "Trắc nghiệm" }]
 */
export const transformFormatData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];
    
    return rawData.map(item => {
        const count = parseInt(item[0], 10) || 0;
        const formatKey = item[1]; 
        
        return {
            count: count,
            // Dò tìm trong từ điển, nếu không có thì trả về formatKey gốc để tránh lỗi hiển thị trống
            label: FORMAT_LABELS[formatKey] || formatKey 
        };
    });
};



/**
 * Biến đổi dữ liệu mảng 4 chiều cho Biểu đồ Đường nhiều biến (Biểu đồ 6)
 * VD API trả về: 
 * [
 * [10, 100, "2026-05-17", "MATHS"],
 * [0, 100, "2026-05-17", "VIETNAMESE"]
 * ]
 * * Output cho UI: [{ date: "2026-05-17", MATHS: 10, VIETNAMESE: 0 }]
 */
export const transformScoreTrendData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];

    const dateMap = {};

    rawData.forEach(item => {
        const achieved = parseFloat(item[0]) || 0;
        const max = parseFloat(item[1]) || 0;
        const date = item[2];     // "2026-05-17"
        const subject = item[3];  // "MATHS", "VIETNAMESE"...

        // Tính toán phần trăm tương tự như Biểu đồ 1
        const percentage = max > 0 ? parseFloat(((achieved / max) * 100).toFixed(2)) : 0;

        // Nếu ngày này chưa có trong map thì khởi tạo
        if (!dateMap[date]) {
            dateMap[date] = { date: date };
        }

        // Gán giá trị phần trăm của môn học vào ngày đó
        dateMap[date][subject] = percentage;
    });

    // Chuyển đổi cấu trúc object thành mảng 
    const trendArray = Object.values(dateMap);

    // Sắp xếp các ngày theo thứ tự thời gian tăng dần để đường biểu đồ không bị rối mớ bòng bong
    return trendArray.sort((a, b) => new Date(a.date) - new Date(b.date));
};





/**
 * Biến đổi dữ liệu mảng 2 chiều cho Biểu đồ Thanh ngang (Biểu đồ 7)
 * VD API trả về: [[5, "REVIEW"], [6, "EXERCISE"]]
 * Output cho UI: [{ count: 5, label: "Ôn bài" }, { count: 6, label: "Làm bài tập" }]
 */
export const transformActivityTypeData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];
    
    return rawData.map(item => {
        const count = parseInt(item[0], 10) || 0;
        const typeKey = item[1]; 
        
        return {
            count: count,
            label: ACTIVITY_TYPE_LABELS[typeKey] || typeKey 
        };
    });
};