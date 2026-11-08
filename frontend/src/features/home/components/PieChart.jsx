import React from 'react';
import { PieChart, Pie, Legend, Sector } from 'recharts';
import { useTheme } from "@/components/theme/ThemeWrapper";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";


const renderShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, cornerRadius, startAngle, endAngle, fill, isActive, percent } = props;
  const dynamicCornerRadius = percent < 0.1 ? 10 : cornerRadius; 

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={isActive ? innerRadius - 8 : innerRadius}
        outerRadius={isActive ? outerRadius + 8 : outerRadius}
        cornerRadius={dynamicCornerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
        transition: 'all 0.3s ease',
        ...(isActive ? { filter: `drop-shadow(0px 0px 8px ${fill}44)` } : {})
      }}
      />
    </g>
  );
};


export const PieChartComponent = ({ data, isAnimationActive }) => {
  const { isNight } = useTheme();

  const chartConfig = {
    count: {
      label: "Số lượng",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="w-full aspect-square relative">
      <PieChart>
        <Pie 
            data={data} 
            dataKey="count" 
            nameKey="label" 
            cx="50%" 
            cy="45%" 
            innerRadius="50%" 
            outerRadius="70%" 
            cornerRadius="10%" 
            paddingAngle={3} 
            shape={renderShape}
            label={({ payload }) => `${payload.displayPercent}%`}
            isAnimationActive={isAnimationActive}>
            </Pie>
            <ChartTooltip 
                cursor={false} 
                isAnimationActive={false}
                wrapperStyle={{ zIndex: 100 }}
                content={
                    <ChartTooltipContent 
                        className={isNight ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}
                        formatter={(value, name, props) => (
                            <div className={`flex items-center gap-2 ${isNight ? "text-slate-200" : "text-slate-700"}`}>
                                
                                {/* 1. TỰ TAY VẼ CỤC MÀU: Lấy đúng màu tím từ config */}
                                <div 
                                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]" 
                                    style={{ backgroundColor: props.payload.fill || props.color }} 
                                />
                                
                                {/* 2. CHỮ VÀ SỐ: Gói vào một div có gap-1.5 để luôn có khoảng cách đẹp mắt */}
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium">{chartConfig[name]?.label || name}:</span>
                                    <span className="font-bold">{value}</span>
                                    <span className="font-light">({props.payload.displayPercent}%)</span>
                                </div>
                                
                            </div>
                        )}
                    />
                }
            />
            {/* <Legend /> */}
        </PieChart>
        <div 
          // pointer-events-none: GIÚP CHUỘT XUYÊN QUA CHỮ ĐỂ HOVER VÀO ĐỒ THỊ NHƯ BÌNH THƯỜNG
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 z-0"
        >
          {/* Lặp qua data để in 3 thông số ra giữa màn hình */}
          {data && data.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm leading-tight">
                  {/* Dấu chấm màu nhỏ */}
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.fill }} 
                  />
                  {/* Tên môn và Số phần trăm */}
                  <span className={`font-medium ${isNight ? 'text-slate-300' : 'text-slate-600'}`}>
                      {item.label}: <span className="font-bold text-base">{item.count}</span>
                  </span>
              </div>
          ))}
        </div>
    </ChartContainer>
  );
}