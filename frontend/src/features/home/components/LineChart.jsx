import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { SUBJECT_LABELS } from "../utils/chartUtils";
import { useTheme } from "@/components/theme/ThemeWrapper";

import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";


export const LineChartComponent = ({data, isAnimationActive}) => {
    const { isNight } = useTheme();

    const textColor = isNight ? '#e2e8f0' : '#374151'; // e2e8f0 là slate-200, 374151 là gray-700
    const gridColor = isNight ? '#475569' : '#414650'; // Màu của lưới nhện

    const chartConfig = {
        MATHS: {
            label: SUBJECT_LABELS.MATHS,
            color: "#3b82f6",
        },
        VIETNAMESE: {
            label: SUBJECT_LABELS.VIETNAMESE,
            color: "#ec4899",
        },
        ENGLISH: {
            label: SUBJECT_LABELS.ENGLISH,
            color: "#10b981",
        }
    };

    return (
        <ChartContainer config={chartConfig} className="w-full aspect-square">
            <LineChart 
            data={data} 
            margin={{ top: 20, right: 30, bottom: 20 }}>
                <XAxis dataKey="date" tick={{ fill: textColor }} />
                <YAxis tick={{ fill: textColor }} />
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <Line 
                    type="monotone" 
                    dataKey="MATHS" 
                    name={chartConfig.MATHS.label}
                    stroke="var(--color-MATHS)" 
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                    isAnimationActive={isAnimationActive}
                />
                <Line 
                    type="monotone" 
                    dataKey="VIETNAMESE" 
                    name={chartConfig.VIETNAMESE.label}
                    stroke="var(--color-VIETNAMESE)" 
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                    isAnimationActive={isAnimationActive}
                />
                <Line 
                    type="monotone" 
                    dataKey="ENGLISH" 
                    name={chartConfig.ENGLISH.label}
                    stroke="var(--color-ENGLISH)" 
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                    isAnimationActive={isAnimationActive}
                />

                <ChartTooltip 
                    cursor={false} 
                    isAnimationActive={false}
                    content={
                        <ChartTooltipContent 
                            className={isNight ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}
                            formatter={(value, name, props) => (
                                <div className={`flex items-center gap-2 ${isNight ? "text-slate-200" : "text-slate-700"}`}>
                                    
                                    {/* 1. TỰ TAY VẼ CỤC MÀU: Lấy đúng màu tím từ config */}
                                    <div 
                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]" 
                                        style={{ backgroundColor: props.color || "#8884d8" }} 
                                    />
                                    
                                    {/* 2. CHỮ VÀ SỐ: Gói vào một div có gap-1.5 để luôn có khoảng cách đẹp mắt */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium">{chartConfig[name]?.label || name}:</span>
                                        <span className="font-bold">{value}</span>
                                    </div>
                                    
                                </div>
                            )}
                        />
                    }
                />
                <Legend />
            </LineChart>
        </ChartContainer>
    
    
  );
}