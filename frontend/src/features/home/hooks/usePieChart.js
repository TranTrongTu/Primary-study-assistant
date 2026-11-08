import { useMemo } from 'react';
import { useFetchChart } from './useFetchChart';
import { getStudyProgress } from '../api/studyProgressAPI';
import { getStartDateFromFilter, transformCountData } from '../utils/chartUtils';

export const usePieChart = (filterValue) => {
    const payload = useMemo(() => {
        const startDate = getStartDateFromFilter(filterValue);
        
        return [
            {
                attribute: "subject_type",
                value: null,
                operator: "GROUP_BY"
            },
            {
                attribute: "created_at",
                value: startDate,
                operator: "GE"
            }
        ];
    }, [filterValue]);

    // Bọc hàm API để truyền đúng Target là 'COUNT_ITEM'
    const fetchApi = (pl) => getStudyProgress('COUNT_ITEM', pl);

    // Dùng chung Generic Hook, truyền hàm transformCountData vào
    return useFetchChart(fetchApi, payload, transformCountData);
};