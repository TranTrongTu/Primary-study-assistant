import { useState, useCallback, useEffect } from 'react';
import { readAllFlashcards, createFlashcard, deleteFlashcard, createEmptyFlashcard } from '../api/flashcardAPI';
import { parseBackendError, logBackendError, setErrorFromParsed } from "../../../utils/backendError";

const useFlashcardSetManagement = (interactionId) => {
    const [flashcardSets, setFlashcardSets] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [isCreatingWithAI, setIsCreatingWithAI] = useState(false);

    const loadFlashcardSets = useCallback(async () => {
        if (!interactionId) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await readAllFlashcards(interactionId);
            setFlashcardSets(Array.isArray(response) ? response : []);
        } catch (error) {
            const parsed = parseBackendError(error, "Chưa tải được các bộ thẻ flashcard. Bé vui lòng thử lại sau nhé.");
            logBackendError("useFlashcardSetManagement.loadFlashcardSets", parsed);
            setErrorFromParsed(setError, parsed);
            setFlashcardSets([]);
        } finally {
            setIsLoading(false);
        }
    }, [interactionId]);

    const createNewFlashcardSet = useCallback(async (promptData) => {
        const promptText = typeof promptData === 'object' ? promptData.prompt : promptData;
        const subjectType = typeof promptData === 'object' ? promptData.subject_type : null;

        if (!promptText?.trim() || !interactionId) {
            setError({ message: 'Bé vui lòng nhập nội dung nhé', type: 'warning' });
            return null;
        }

        setIsCreatingWithAI(true);
        setError(null);
        try {
            const newFlashcardSet = await createFlashcard(interactionId, {
                prompt: promptText,
                subject_type: subjectType,
            });

            if (newFlashcardSet) {
                setFlashcardSets(prev => [newFlashcardSet, ...prev]); 
            }
            setPrompt('');
            return newFlashcardSet;

        } catch (error) {
            const parsed = parseBackendError(error, "Chưa tạo được bộ thẻ flashcard mới. Bé vui lòng thử lại sau nhé.");
            logBackendError("useFlashcardSetManagement.createNewFlashcardSet", parsed);
            setErrorFromParsed(setError, parsed);
        } finally {
            setIsCreatingWithAI(false);
        }
        return null;
    }, [interactionId]);

    const createEmptyFlashcardSet = useCallback(async (formData) => {
        const subjectType = formData?.subject_type || '';
        const setName = formData?.name || '';
        const setDescription = formData?.description || '';

        if (!subjectType.trim() || !setName.trim() || !setDescription.trim() || !interactionId) {
            setError({ message: 'Bé vui lòng nhập nội dung nhé', type: 'warning' });
            return null;
        }

        setIsLoading(true);
        setError(null);
        try {
            const newFlashcardSet = await createEmptyFlashcard(interactionId, {
                subject_type: subjectType,
                name: setName,
                description: setDescription,
            });

            if (newFlashcardSet) {
                setFlashcardSets(prev => [newFlashcardSet, ...prev]); 
            }
            setPrompt('');
            return newFlashcardSet;

        } catch (error) {
            const parsed = parseBackendError(error, "Chưa tạo được bộ thẻ flashcard trống. Bé vui lòng thử lại sau nhé.");
            logBackendError("useFlashcardSetManagement.createEmptyFlashcardSet", parsed);
            setErrorFromParsed(setError, parsed);
        } finally {
            setIsLoading(false);
        }
        return null;
    }, [interactionId]);

    const removeFlashcardSet = useCallback(async (study_activity_id) => {
        setIsLoading(true);
        setError(null);
        try {
            await deleteFlashcard(study_activity_id);
            setFlashcardSets(prev => prev.filter(set => set.id !== study_activity_id));
            setError(null);
        } catch (error) {
            const parsed = parseBackendError(error, "Chưa xóa được bộ thẻ flashcard này. Bé vui lòng thử lại sau nhé.");
            logBackendError("useFlashcardSetManagement.removeFlashcardSet", parsed);
            setErrorFromParsed(setError, parsed);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (interactionId) {
            const timeoutId = setTimeout(() => loadFlashcardSets(), 0);
            return () => clearTimeout(timeoutId);
        }
    }, [interactionId, loadFlashcardSets]);

    return {
        flashcardSets, setFlashcardSets, isLoading, isCreatingWithAI, error, prompt, setPrompt,
        loadFlashcardSets, createNewFlashcardSet, createEmptyFlashcardSet, removeFlashcardSet

    };
};

export default useFlashcardSetManagement;