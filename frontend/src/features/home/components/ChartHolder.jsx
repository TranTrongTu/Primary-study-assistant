import { useRef } from "react";

import { AnimatedChart } from "./AnimatedChart"
import { useTotalExercises } from "../hooks/useTotalExercises";

export const ChartHolder = ({ listOfCharts, sidebarCardCls, isNight }) => {
    const scrollRef = useRef(null);
    const { totalCount, isLoading } = useTotalExercises();

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center h-32 rounded-[1.5rem] shadow-sm border-2 transition-all ${sidebarCardCls}`}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <div className={`flex flex-col items-center justify-center text-center px-6 py-10 rounded-[1.5rem] shadow-sm border-2 transition-all ${sidebarCardCls}`}>
                <h1 className={`text-lg font-bold ${isNight ? "text-slate-200" : "text-slate-800"}`}>
                    Bé hãy bắt đầu tạo câu hỏi đầu tiên để khám phá tiến độ học tập của mình nhé!
                </h1>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full overflow-y-auto gap-8">
            {listOfCharts.map((item) => (
                <div key={item.id} className={`flex flex-col rounded-2xl shadow-sm shrink-0 rounded-[1.5rem] px-1 py-4 border-2 transition-all ${sidebarCardCls}`}>
                    <AnimatedChart scrollRoot={scrollRef} aspectClass={item.aspectClass}>
                        {item.Widget}
                    </AnimatedChart>
                </div>
            ))}
        </div>
    )
}