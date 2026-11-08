import { useState, useEffect, useCallback } from 'react';
import { getAllStudyActivities, deleteStudyActivity } from '../api/studyActivityApi';

export const useStudyActivities = (interactionId) => {
    const [activities, setActivities] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);

    // Dùng ở cột Sidebar trang chính để in ra menu các bài tập
    const fetchActivities = useCallback(async () => {
        if (!interactionId) return;
        setIsLoadingList(true);
        try {
            const data = await getAllStudyActivities(interactionId);
            setActivities(data); // Lưu mảng bài tập vào state
        } catch (error) {
            console.error("Lỗi khi tải danh sách bài tập:", error);
        } finally {
            setIsLoadingList(false);
        }
    }, [interactionId]);

    const handleDeleteActivity = async (activityId) => {
        try {
            await deleteStudyActivity(activityId);
            // Sau khi xóa thành công ở Server, cập nhật lại danh sách ở Local ngay lập tức
            console.log("Xóa bài tập thành công, ID:", activityId);
            setActivities(prev => prev.filter(act => act.id !== activityId));
        } catch (error) {
            console.error("Lỗi khi xóa bài tập:", error);
            alert("Không thể xóa bài tập lúc này.");
        }
    };

    // Tự động chạy khi mở sổ tay (interactionId thay đổi)
    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    return { 
        activities, 
        fetchActivities, 
        handleDeleteActivity,
        isLoadingList 
    };
};