import { useState, useEffect } from 'react';
import { fetchTotalExercisesCount } from '../api/studyProgressAPI';

export const useTotalExercises = () => {
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTotal = async () => {
            try {
                setIsLoading(true);
                const rawData = await fetchTotalExercisesCount();
                
                // Xử lý đúng cấu trúc mảng trả về: [[190]]
                let total = 0;
                if (Array.isArray(rawData) && rawData.length > 0 && Array.isArray(rawData[0])) {
                    total = parseInt(rawData[0][0], 10) || 0;
                }
                
                setTotalCount(total);
            } catch (error) {
                console.error("Lỗi khi kiểm tra tổng dữ liệu:", error);
                setTotalCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTotal();
    }, []);

    return { totalCount, isLoading };
};