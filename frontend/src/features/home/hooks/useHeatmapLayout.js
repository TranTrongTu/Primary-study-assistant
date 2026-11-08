import { useMemo } from 'react';
import { useHeatmapSize } from './useHeatmapSize'; // Nhớ import hook đo kích thước cũ của bạn

export const useHeatmapLayout = (data, blockMargin = 4) => {
    const { containerWidth, containerRef } = useHeatmapSize();

    const dynamicBlockSize = useMemo(() => {
        if (!containerWidth || !data) return 12; 

        const daysToView = data.length; 
        const weeks = Math.ceil(daysToView / 7); 
        
        const paddingX = 32; 
        const labelWidth = 38; 
        
        const availableWidth = containerWidth - paddingX - labelWidth;
        const totalMargin = (weeks - 1) * blockMargin;
        const calculatedSize = (availableWidth - totalMargin) / weeks;

        return Math.max(8, Math.min(calculatedSize, 56));
    }, [containerWidth, data, blockMargin]);

    return { containerRef, dynamicBlockSize };
};