import React from 'react';
import useFlashcardNavigation from '../hooks/useFlashcard';
import Flashcard from './Flashcard';
import useFlashcardManagement from '../hooks/useFlashcardManagement';
import { useTheme } from '../../../components/theme/ThemeWrapper';
import ErrorBanner from '../../../components/ErrorBanner';

const FlashcardStudyView = ({ selectedSet, onBack, onEdit }) => {
    const {
        cardsList,
        isLoading,
        error,
        clearError,
    } = useFlashcardManagement(selectedSet?.id);

    const {
        currentCard,
        isFlipped,
        flipCard,
        nextCard,
        prevCard,
        isFirst,
        isLast,
        currentIndex,
        progress,
    } = useFlashcardNavigation(cardsList);
    const { isNight } = useTheme();

    if (isLoading) {
        return (
            <div className={`flex h-full items-center justify-center rounded-[2.5rem] border p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all ${
                isNight
                    ? 'border-white/10 bg-[#1e293b]/90 text-gray-100'
                    : 'border-white/40 bg-white/90 text-gray-800'
            }`}>
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
                    <p className={`mt-4 ${isNight ? 'text-gray-400' : 'text-gray-600'}`}>Đang tải flashcard...</p>
                </div>
            </div>
        );
    }

    if (error && (!cardsList || cardsList.length === 0)) {
        return (
            <div className={`flex h-full items-center justify-center rounded-[2.5rem] border p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all ${
                isNight
                    ? 'border-white/10 bg-[#1e293b]/90 text-gray-100'
                    : 'border-white/40 bg-white/90 text-gray-800'
            }`}>
                <div className="max-w-md w-full flex flex-col gap-4">
                    <ErrorBanner error={error} onDismiss={clearError} />
                    <div className="text-center">
                        <p className={`text-lg font-semibold ${isNight ? 'text-blue-300' : 'text-slate-700'}`}>
                            Không thể tải flashcard
                        </p>
                        <p className={`mt-2 text-sm ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>
                            Bé thử tải lại hoặc quay về chọn bộ thẻ khác.
                        </p>
                        <button type="button" onClick={onBack} className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!cardsList || cardsList.length === 0) {
        return (
            <div className={`flex h-full items-center justify-center rounded-[2.5rem] border p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all ${
                isNight
                    ? 'border-white/10 bg-[#1e293b]/90 text-gray-100'
                    : 'border-white/40 bg-white/90 text-gray-800'
            }`}>
                <div className="max-w-md text-center">
                    <p className={`text-lg font-semibold ${
                        isNight ? 'text-blue-300' : 'text-slate-700'
                    }`}>
                        Bộ này chưa có flashcard nào
                    </p>
                    <p className={`mt-2 text-sm ${
                        isNight ? 'text-gray-400' : 'text-slate-500'
                    }`}>
                        Chuyển sang chỉnh sửa để thêm thẻ đầu tiên.
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={onEdit}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                        >
                            Chỉnh sửa
                        </button>
                        <button
                            type="button"
                            onClick={onBack}
                            className={`flex h-10 w-[66px] items-center justify-center text-gray-400 transition-all hover:rotate-90 ${
                                isNight
                                    ? 'hover:text-red-400'
                                    : 'hover:text-red-500'
                            }`}
                            aria-label="Đóng flashcard"
                            title="Đóng"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`mx-auto flex max-w-2xl flex-col gap-5 rounded-[2.5rem] border p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all ${
            isNight
                ? 'border-white/10 bg-[#1e293b]/90 text-gray-100'
                : 'border-white/40 bg-white/90 text-gray-800'
        }`}>
            {/* Thêm relative và pr-36 để chữ không đè lên nút */}
            <div className="relative flex flex-col gap-1 pr-36">
                <div>
                    <h3 className={`text-lg font-bold ${
                        isNight ? 'text-blue-300' : 'text-slate-800'
                    }`}>
                        {selectedSet?.name || 'Flashcard set'}
                    </h3>
                    {selectedSet?.description && (
                        <p className={`mt-1 text-sm leading-6 ${
                            isNight ? 'text-gray-400' : 'text-slate-500'
                        }`}>
                            {selectedSet.description}
                        </p>
                    )}
                </div>

                {/* Cụm nút được chuyển thành absolute */}
                <div className="absolute top-0 right-0 flex gap-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                            isNight
                                ? 'border-indigo-600/50 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'
                                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                    >
                        Chỉnh sửa
                    </button>
                    <button
                        type="button"
                        onClick={onBack}
                        className={`flex h-10 w-[66px] shrink-0 items-center justify-center text-gray-400 transition-all hover:rotate-90 ${
                            isNight
                                ? 'hover:text-red-400'
                                : 'hover:text-red-500'
                        }`}
                        aria-label="Đóng flashcard"
                        title="Đóng"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
                            <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div>
                <div className={`mb-3 h-2 rounded-full transition-all ${
                    isNight ? 'bg-gray-700' : 'bg-slate-200'
                }`}>
                    <div
                        className="h-2 rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className={`text-center text-sm font-medium ${
                    isNight ? 'text-gray-400' : 'text-slate-500'
                }`}>
                    Thẻ {currentIndex + 1} / {cardsList.length}
                </p>
            </div>

            <Flashcard
                front={currentCard.front}
                back={currentCard.back}
                isFlipped={isFlipped}
                onClick={flipCard}
                subject={selectedSet?.subject_type}
                isDarkMode={isNight}
            />

            <div className="grid grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={prevCard}
                    disabled={isFirst}
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        isNight
                            ? 'border-gray-600 bg-gray-800/50 text-gray-400 hover:bg-gray-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    Trước
                </button>

                <button
                    type="button"
                    onClick={flipCard}
                    className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                        isNight
                            ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                >
                    Lật thẻ
                </button>

                <button
                    type="button"
                    onClick={nextCard}
                    disabled={isLast}
                    className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Sau
                </button>
            </div>
        </div>
    );
};

export default FlashcardStudyView;
