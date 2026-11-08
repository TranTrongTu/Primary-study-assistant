import { useMemo } from 'react';
import { useFetchChart } from './useFetchChart';
import { fetchScoreRatioRadarChart } from '../api/studyProgressAPI';
import { getStartDateFromFilter, transformScoreData } from '../utils/chartUtils';

export const useRadarChart = (filterValue) => {
    // Dùng useMemo để tránh việc mảng payload bị tạo mới liên tục mỗi lần render,
    // gây ra infinite loop trong useEffect của useFetchChart.
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
    }, [filterValue]); // Payload chỉ build lại khi filterValue thay đổi

    // Truyền API, Payload và hàm Transform vào Generic Hook
    return useFetchChart(fetchScoreRatioRadarChart, payload, transformScoreData);
};