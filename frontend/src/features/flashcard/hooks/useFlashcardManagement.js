import { useState, useCallback, useEffect } from 'react';
import { readFlashcard, addCard, updateFlashcard, deleteCard } from '../api/flashcardAPI';
import { parseBackendError, logBackendError, setErrorFromParsed } from "../../../utils/backendError";

const useFlashcardManagement = (study_activity_id) => {
    const [cardsList, setCardsList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadFlashcards = useCallback(async () => {
        if (!study_activity_id) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await readFlashcard(study_activity_id);
            setCardsList(Array.isArray(response) ? response : []);
        } catch (error) {
            const parsed = parseBackendError(error, "Không tải được bộ thẻ flashcard này. Bé thử lại sau nhé.");
            logBackendError("useFlashcardManagement.loadFlashcards", parsed);
            setErrorFromParsed(setError, parsed);
            setCardsList([]);
        } finally {
            setIsLoading(false);
        }
    }, [study_activity_id]);

    const createNewFlashcard = useCallback(async (flashcardId, front, back) => {
        const frontText = typeof front === 'string' ? front : front?.content || '';
        const backText = typeof back === 'string' ? back : back?.content || '';

        if (!frontText.trim() || !backText.trim() || !study_activity_id ) {
            setError({ message: 'Vui lòng nhập nội dung đầy đủ', type: 'warning' });
            return null;
        }

        setIsLoading(true);
        setError(null);
        try {
            const newFlashcards = { front: frontText, back: backText };
            const response = await addCard(flashcardId, newFlashcards);
            await loadFlashcards();
            return response;
        } catch (error) {
            const parsed = parseBackendError(error, "Chưa thêm được thẻ mới. Bé vui lòng thử lại sau nhé.");
            logBackendError("useFlashcardManagement.createNewFlashcard", parsed);
            setErrorFromParsed(setError, parsed);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [study_activity_id, loadFlashcards]);

    const updateCard = useCallback(async (flashcardId, front, back) => {
        const frontText = typeof front === 'string' ? front : front?.content || '';
        const backText = typeof back === 'string' ? back : back?.content || '';

        if (!frontText.trim() || !backText.trim() || !study_activity_id ) {
            setError({ message: 'Bé vui lòng nhập nội dung nhé', type: 'warning' });
            return null;
        }

        setIsLoading(true);
        setError(null);
        try {
            const newFlashcards = { front: frontText, back: backText };
            const response = await updateFlashcard(flashcardId, newFlashcards);
            await loadFlashcards();
            return response;
        } catch (error) {
            const parsed = parseBackendError(error, "Chưa chỉnh sửa được thẻ này. Bé vui lòng thử lại sau nhé.");
            logBackendError("useFlashcardManagement.updateCard", parsed);
            setErrorFromParsed(setError, parsed);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [study_activity_id, loadFlashcards]);

    const deleteFlashcard = useCallback(async (flashcardId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await deleteCard(flashcardId);
            await loadFlashcards();
            setError(null);
            return response;
        } catch (error) {
            const parsed = parseBackendError(error, "Chưa xóa được thẻ flashcard này. Bé vui lòng thử lại sau nhé.");
            logBackendError("useFlashcardManagement.deleteFlashcard", parsed);
            setErrorFromParsed(setError, parsed);
        } finally {
            setIsLoading(false);
        }
    }, [loadFlashcards]);

    useEffect(() => {
        if (study_activity_id) {
            const timeoutId = setTimeout(() => loadFlashcards(), 0);
            return () => clearTimeout(timeoutId);
        }
    }, [study_activity_id, loadFlashcards]);

    return { cardsList, setCardsList, isLoading, error, loadFlashcards, createNewFlashcard, updateCard, deleteFlashcard };
};

export default useFlashcardManagement;