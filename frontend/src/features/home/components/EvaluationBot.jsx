import React, { useState, useEffect } from 'react';
import EvaluationWindow from './EvaluationWindow';
import { useEvaluation } from '../hooks/useEvaluation';
import robotPurple from "../assets/robot-purple.png";

const EvaluationBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    
    const { 
        todayAssessment,       
        historyList,           
        totalHistory,
        detailAssessment,      
        isDetailLoading,
        isLoading: loading, 
        error, 
        detailError,       
        setDetailError,    
        fetchAssessment,
        readHistory,
        readDetailByDay,       
        setDetailAssessment   
    } = useEvaluation(true);   

    // Quản lý thông báo "Đánh giá mới chưa đọc" trong ngày
    useEffect(() => {
        // Chỉ kích hoạt kiểm tra khi `todayAssessment` có dữ liệu thực sự từ AI trả về
        if (todayAssessment && todayAssessment.trim() !== "") {
            
            // Lấy ngày hôm nay định dạng YYYY-MM-DD theo giờ địa phương
            const todayStr = new Date().toLocaleDateString('sv-SE'); 
            
            // Kiểm tra xem ngày hôm nay người dùng đã click đọc thông báo chưa
            const lastReadDate = localStorage.getItem('evaluation_last_read_date');
            
            if (lastReadDate !== todayStr) {
                // Nếu chưa đọc hoặc là ngày mới, hiển thị thông báo nổi bật
                setShowNotification(true);
            }
        }
    }, [todayAssessment]);

    const handleToggleEvaluation = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        
        if (nextState) {
            // Khi người dùng bấm mở cửa sổ xem, tắt ngay thông báo đi
            setShowNotification(false);
            
            // Lưu ngày hôm nay vào localStorage để đánh dấu "Đã đọc hôm nay"
            const todayStr = new Date().toLocaleDateString('sv-SE');
            localStorage.setItem('evaluation_last_read_date', todayStr);

            try {
                await fetchAssessment();
            } catch (err) {
                console.error('Failed to fetch assessment:', err);
            }
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
            {isOpen && (
                <EvaluationWindow
                    data={todayAssessment}
                    loading={loading}
                    error={error}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    
                    historyList={historyList}
                    totalHistory={totalHistory}
                    onFetchHistory={readHistory}
                    
                    detailAssessment={detailAssessment}
                    isDetailLoading={isDetailLoading}
                    detailError={detailError} 
                    onFetchDetail={readDetailByDay}
                    
                    onResetDetail={() => {
                        setDetailAssessment(null);
                        setDetailError(null);
                    }}
                />
            )}

            {/* Khối chứa nút Robot và Bong bóng thông báo */}
            <div className="relative group cursor-pointer flex flex-col items-end">
                
                {/* 💬 BONG BÓNG THÔNG BÁO (Hiện phía trên đầu Robot khi có đánh giá mới chưa đọc) */}
                {showNotification && !isOpen && (
                    <div className="mb-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg border border-white flex items-center gap-1.5 animate-bounce whitespace-nowrap relative">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        Bé có một đánh giá mới chưa đọc này! ✨
                        
                        {/* Mũi tên nhỏ chỉ xuống đầu chú robot */}
                        <div className="absolute bottom-[-5px] right-5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500"></div>
                    </div>
                )}

                {/* Chú Robot AI */}
                <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-300" />
                    
                    {/* Chấm tròn đỏ nhỏ nhấp nháy trên góc avatar tăng tính chú ý */}
                    {showNotification && !isOpen && (
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white z-10 animate-pulse" />
                    )}

                    <img
                        alt="Robot AI"
                        src={robotPurple}
                        onClick={handleToggleEvaluation}
                        className="relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-white"
                    />
                </div>
            </div>
        </div>
    );
};

export default EvaluationBot;