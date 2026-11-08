import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/studyActivityApi'; 
import { parseBackendError, logBackendError, setErrorFromParsed } from "../../../utils/backendError";

export const useOpenEnded = (studyActivityId) => {
    const [activityData, setActivityData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    

    // Hàm lấy toàn bộ thông tin bài tập (API GET)
    const fetchActivityData = useCallback(async () => {
        if (!studyActivityId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getStudyActivityComplete(studyActivityId);
            if (data && data.items) {
                data.items.sort((a, b) => a.id - b.id);
            }
            setActivityData(data);
        } catch (err) {
            // [ĐỒNG BỘ] Sử dụng utility chuẩn
            const parsed = parseBackendError(err, "Không thể tải bài tập lúc này. Bé thử lại sau nhé!");
            logBackendError("useOpenEnded.fetchActivityData", parsed);
            setErrorFromParsed(setError, parsed);
        } finally {
            setIsLoading(false);
        }
    }, [studyActivityId]);

    useEffect(() => {
        fetchActivityData();
    }, [fetchActivityData]);

    const saveAnswerDraft = async (exerciseItemId, answerText) => {
        try {
            await api.answerExerciseItem(exerciseItemId, answerText);
        } catch (err) {
            // Log lỗi nhẹ nhàng cho lưu nháp
            const parsed = parseBackendError(err);
            logBackendError("useOpenEnded.saveAnswerDraft", parsed);
        }
    };

    const submitActivity = async () => {
        if (!studyActivityId) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await api.submitExerciseActivity(studyActivityId);
            await fetchActivityData();
        } catch (err) {
            // [ĐỒNG BỘ] Sử dụng utility chuẩn
            const parsed = parseBackendError(err, "Có lỗi khi nộp bài. Bé kiểm tra lại kết nối mạng nha!");
            logBackendError("useOpenEnded.submitActivity", parsed);
            setErrorFromParsed(setError, parsed);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        activityData,
        isLoading,
        isSubmitting,
        error,
        clearError: () => setError(null),
        saveAnswerDraft,
        submitActivity,
        refreshData: fetchActivityData
    };
};