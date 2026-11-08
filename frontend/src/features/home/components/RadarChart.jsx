import { RadarChart, Radar, ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend } from 'recharts';
import { useTheme } from "@/components/theme/ThemeWrapper";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";


export const RadarChartComponent = ({ data, isAnimationActive }) => {
    const { isNight } = useTheme();

    const textColor = isNight ? '#e2e8f0' : '#374151'; // e2e8f0 là slate-200, 374151 là gray-700
    const gridColor = isNight ? '#475569' : '#c7c8cb'; // Màu của lưới nhện
    const axisColor = isNight ? '#94a3b8' : '#9ca3af'; // Màu của các con số 0, 25, 50...

    const chartConfig = {
        percentage: {
            label: "Tỉ lệ tổng điểm",
            color: "#8884d8",      
        },
    };


    return (
        <ChartContainer config={chartConfig} className="w-full aspect-square">
            <RadarChart 
            cx="50%" 
            cy="55%" 
            outerRadius="80%" 
            data={data} 
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke={gridColor}/>
                <PolarAngleAxis 
                dataKey="label" 
                tick={{ fontSize: 13, fill: textColor }}
                />
                <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tickCount={5} 
                tick={{ fontSize: 10, fill: axisColor }} />
                <Radar 
                dataKey="percentage" 
                type="monotone" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6} 
                isAnimationActive={isAnimationActive} />
                <ChartTooltip 
                    cursor={false} 
                    isAnimationActive={false}
                    content={
                        <ChartTooltipContent 
                            className={isNight ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}
                            formatter={(value, name) => (
                                <div className={`flex items-center gap-2 ${isNight ? "text-slate-200" : "text-slate-700"}`}>
                                    
                                    {/* 1. TỰ TAY VẼ CỤC MÀU: Lấy đúng màu tím từ config */}
                                    <div 
                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]" 
                                        style={{ backgroundColor: chartConfig[name]?.color || "#8884d8" }} 
                                    />
                                    
                                    {/* 2. CHỮ VÀ SỐ: Gói vào một div có gap-1.5 để luôn có khoảng cách đẹp mắt */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium">{chartConfig[name]?.label || name}:</span>
                                        <span className="font-bold">{value}%</span>
                                    </div>
                                    
                                </div>
                            )}
                        />
                    }
                />
            </RadarChart>
        </ChartContainer>
    );
}