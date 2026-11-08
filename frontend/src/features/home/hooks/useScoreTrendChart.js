import { useMemo } from 'react';
import { useFetchChart } from './useFetchChart';
import { getStudyProgress } from '../api/studyProgressAPI';
import { getStartDateFromFilter, transformScoreTrendData } from '../utils/chartUtils';

export const useScoreTrendChart = (filterValue = "90 ngày") => {
    const payload = useMemo(() => {
        const startDate = getStartDateFromFilter(filterValue);
        
        return [
            {
                attribute: "submitted_at",
                value: null,
                operator: "GROUP_BY"
            },
            {
                attribute: "subject_type",
                value: null,
                operator: "GROUP_BY"
            },
            {
                attribute: "submitted_at",
                value: startDate,
                operator: "GE" // Lọc dữ liệu trong khoảng thời gian đã chọn
            }
        ];
    }, [filterValue]);

    // Gọi hàm API gốc với Target chuyên biệt là 'SCORE'
    const fetchApi = (pl) => getStudyProgress('SCORE', pl);

    // Trả về dữ liệu sạch thông qua Generic Hook và hàm Transformer vừa tối ưu
    return useFetchChart(fetchApi, payload, transformScoreTrendData);
};