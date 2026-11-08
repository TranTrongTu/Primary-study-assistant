import { useMemo } from 'react';
import { useFetchChart } from './useFetchChart';
import { getStudyProgress } from '../api/studyProgressAPI';
import { getStartDateFromFilter, transformCompletionData } from '../utils/chartUtils';

export const useCompletionRateChart = (filterValue) => {
    // filterValue dự kiến: "Theo tuần", "Theo tháng" (hoặc "7 ngày", "30 ngày" tùy cách bạn làm dropdown)
    const payload = useMemo(() => {
        const startDate = getStartDateFromFilter(filterValue);
        
        return [
            {
                attribute: "is_submitted",
                value: null,
                operator: "GROUP_BY"
            },
            {
                attribute: "created_at",
                value: startDate,
                operator: "GE" // Lớn hơn hoặc bằng ngày bắt đầu
            }
        ];
    }, [filterValue]);

    // Bọc hàm API để truyền đúng Target là 'COUNT_ACTIVITY'
    const fetchApi = (pl) => getStudyProgress('COUNT_ACTIVITY', pl);

    // Trả về state từ Generic Hook
    return useFetchChart(fetchApi, payload, transformCompletionData);
};