import React, { useState } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { useTheme } from '../../../components/theme/ThemeWrapper';

// 1. IMPORT HOOK VÀ TOOLTIP VỪA TẠO
import { useHeatmapLayout } from '../hooks/useHeatmapLayout'; 
import { HeatmapTooltip } from './HeatmapTooltip';

// 2. ĐƯA CÁC HẰNG SỐ RA NGOÀI COMPONENT ĐỂ TỐI ƯU HIỆU NĂNG
const BLOCK_MARGIN = 4;
const EXPLICIT_THEME = {
    light: ['#ebf0f4', '#ddd6fe', '#a78bfa', '#7c3aed', '#5b21b6'],
    dark: ['#1e293b', '#6d28d9', '#8b5cf6', '#a78bfa', '#ddd6fe'],
};
const CUSTOM_LABELS = {
    legend: { less: 'Ít', more: 'Nhiều' },
    months: ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'],
    weekdays: ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
};

export const HeatmapChartComponent = ({data}) => {
    const { isNight } = useTheme();
    const [tooltipData, setTooltipData] = useState(null);
    
    // 3. SỬ DỤNG CUSTOM HOOK GỌN GÀNG
    const { containerRef, dynamicBlockSize } = useHeatmapLayout(data, BLOCK_MARGIN);

    if (!data || data.length === 0) return null;

    return (
        <div ref={containerRef} className="w-full flex-1 flex items-center justify-center px-4 pb-4 overflow-hidden relative">
            <style>{`
                .react-activity-calendar__footer { width: 100%; }
                .react-activity-calendar__legend-colors { margin-left: 0 !important; }
            `}</style>
            
            <ActivityCalendar
                data={data}
                theme={EXPLICIT_THEME}
                colorScheme={isNight ? 'dark' : 'light'}
                
                blockSize={dynamicBlockSize}     
                blockRadius={Math.max(2, Math.floor(dynamicBlockSize / 4))} 
                blockMargin={BLOCK_MARGIN}    
                
                fontSize={14}
                showWeekdayLabels={true} 
                showTotalCount={false} 
                labels={CUSTOM_LABELS}

                renderBlock={(block, activity) =>
                    React.cloneElement(block, {
                        onMouseEnter: (e) => {
                            const rect = e.target.getBoundingClientRect();
                            setTooltipData({
                                x: rect.left + rect.width / 2, 
                                y: rect.top,                   
                                date: activity.date,
                                count: activity.count,
                                fill: e.target.getAttribute('fill') 
                            });
                        },
                        onMouseLeave: () => setTooltipData(null)
                    })
                }
            />

            {/* 4. SỬ DỤNG TOOLTIP COMPONENT */}
            <HeatmapTooltip tooltipData={tooltipData} isNight={isNight} />
        </div>
    );
}