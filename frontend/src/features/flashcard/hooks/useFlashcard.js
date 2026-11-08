import { useState, useCallback, useMemo } from 'react';

/**
 * Hook quản lý navigation/interaction giữa các flashcard
 * @param {Array} cards - Mảng flashcard data
 * @returns {Object} - currentCard, index, flip logic, progress
 */
const useFlashcardNavigation = (cards) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Đảm bảo cards là mảng
    const cardsList = useMemo(() => {
        return Array.isArray(cards) ? cards : [];
    }, [cards]);

    // Lật mặt thẻ (trước <-> sau)
    const flipCard = useCallback(() => {
        setIsFlipped((prev) => !prev);
    }, []);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Chuyển sang thẻ tiếp theo
    const nextCard = useCallback(async () => {
        if (currentIndex < cardsList.length - 1) {
            if (isFlipped) {
                setIsFlipped(false);
                await delay(900);
            }
            setCurrentIndex((prev) => prev + 1);
        }
    }, [currentIndex, cardsList.length, isFlipped, setIsFlipped]);

    // Quay lại thẻ trước đó
    const prevCard = useCallback(async () => {
        if (currentIndex > 0) {
            if (isFlipped) {
                setIsFlipped(false);
                await delay(900);
            }
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex, isFlipped, setIsFlipped]);

    // Reset về thẻ đầu tiên
    const resetDeck = useCallback(() => {
        setCurrentIndex(0);
        setIsFlipped(false);
    }, []);

    // Tính toán các giá trị dùng cho UI
    const currentCard = cardsList[currentIndex] || { front: '', back: '' };
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === cardsList.length - 1;
    const progress = cardsList.length > 0 ? ((currentIndex + 1) / cardsList.length) * 100 : 0;

    return {
        currentCard,
        currentIndex,
        isFlipped,
        flipCard,
        nextCard,
        prevCard,
        resetDeck,
        isFirst,
        isLast,
        progress,
        totalCards: cardsList.length,
    };
};

export default useFlashcardNavigation;