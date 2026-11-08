import { useMemo } from 'react';
import { useFetchChart } from './useFetchChart';
import { getStudyProgress } from '../api/studyProgressAPI';
import { getStartDateFromFilter, transformActivityTypeData } from '../utils/chartUtils';

export const useFavoriteActivityChart = (filterValue = "30 ngày") => {
    const payload = useMemo(() => {
        const startDate = getStartDateFromFilter(filterValue);
        
        return [
            {
                attribute: "activity_type",
                value: null,
                operator: "GROUP_BY"
            },
            {
                attribute: "created_at",
                value: startDate,
                operator: "GE" // Lọc theo thời gian tạo hoạt động
            }
        ];
    }, [filterValue]);

    // Gọi API với Target là 'COUNT_ACTIVITY'
    const fetchApi = (pl) => getStudyProgress('COUNT_ACTIVITY', pl);

    // Trả về dữ liệu đã qua xử lý
    return useFetchChart(fetchApi, payload, transformActivityTypeData);
};