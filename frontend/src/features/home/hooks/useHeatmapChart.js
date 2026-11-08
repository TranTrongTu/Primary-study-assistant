import { useMemo } from 'react';
import { useFetchChart } from './useFetchChart';
import { getStudyProgress } from '../api/studyProgressAPI';
import { getStartDateFromFilter, transformHeatmapData } from '../utils/chartUtils';

export const useHeatmapChart = (filterValue) => {
    // filterValue dự kiến từ UI truyền vào: "30 ngày", "60 ngày", "90 ngày"
    const payload = useMemo(() => {
        const startDate = getStartDateFromFilter(filterValue);
        
        return [
            {
                attribute: "created_at",
                value: null,
                operator: "GROUP_BY"
            },
            {
                attribute: "created_at",
                value: startDate,
                operator: "GE"
            }
        ];
    }, [filterValue]); // Chỉ tạo lại Payload nếu người dùng đổi filter

    // Bọc hàm gọi API với Target là 'COUNT_ITEM'
    const fetchApi = (pl) => getStudyProgress('COUNT_ITEM', pl);

    // MỚI: Bóc tách con số từ chữ "30 ngày", "90 ngày"
    const daysToView = parseInt(filterValue, 10) || 90;

    // MỚI: Truyền daysToView vào hàm transform thông qua một function trung gian (closure)
    return useFetchChart(fetchApi, payload, (rawData) => transformHeatmapData(rawData, daysToView));

};