import { useMemo } from 'react';
import { useFetchChart } from './useFetchChart';
import { getStudyProgress } from '../api/studyProgressAPI';
import { getStartDateFromFilter, transformFormatData } from '../utils/chartUtils';

export const useSubmittedFormatChart = (filterValue) => {
    // filterValue dự kiến từ UI: "Theo tuần", "Theo tháng"...
    const payload = useMemo(() => {
        const startDate = getStartDateFromFilter(filterValue);
        
        return [
            {
                attribute: "activity_format",
                value: null,
                operator: "GROUP_BY"
            },
            {
                attribute: "is_submitted",
                value: true,
                operator: "EQ" // Lọc ra những bài ĐÃ NỘP (do backend đã fix lỗi type)
            },
            {
                attribute: "submitted_at",
                value: startDate,
                operator: "GE" // Lọc thời gian dựa trên ngày nộp
            }
        ];
    }, [filterValue]);

    // Gọi hàm API với Target là 'COUNT_ACTIVITY'
    const fetchApi = (pl) => getStudyProgress('COUNT_ACTIVITY', pl);

    // Trả về state từ Generic Hook, dùng hàm transformFormatData vừa tạo
    return useFetchChart(fetchApi, payload, transformFormatData);
};