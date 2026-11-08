import React, { useState } from 'react';
import useFlashcardManagement from '../hooks/useFlashcardManagement';
import { Trash } from "@phosphor-icons/react";
import { useTheme } from '../../../components/theme/ThemeWrapper';
import ErrorBanner from '../../../components/ErrorBanner';

const emptyDraft = {
    front: '',
    back: '',
};

const FlashcardEditView = ({ selectedSet, onBack, onStudy }) => {
    const {
        cardsList,
        isLoading,
        error,
        createNewFlashcard,
        updateCard,
        deleteFlashcard,
        clearError,
    } = useFlashcardManagement(selectedSet?.id);

    const { isNight } = useTheme();
    const [newCard, setNewCard] = useState(emptyDraft);
    const [editingCardId, setEditingCardId] = useState(null);
    const [editingCard, setEditingCard] = useState(emptyDraft);

    const updateNewCard = (field, value) => {
        setNewCard((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const updateEditingCard = (field, value) => {
        setEditingCard((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddCard = async () => {
        const createdCard = await createNewFlashcard(
            selectedSet.id,
            newCard.front,
            newCard.back,
        );

        if (createdCard) {
            setNewCard(emptyDraft);
        }
    };

    const handleStartEdit = (card) => {
        setEditingCardId(card.id);
        setEditingCard({
            front: card.front || '',
            back: card.back || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingCardId(null);
        setEditingCard(emptyDraft);
    };

    const handleSaveEdit = async (cardId) => {
        const updatedCard = await updateCard(
            cardId,
            editingCard.front,
            editingCard.back,
        );

        if (updatedCard) {
            handleCancelEdit();
        }
    };

    const canAddCard = newCard.front.trim() && newCard.back.trim();
    const canSaveEdit = editingCard.front.trim() && editingCard.back.trim();

    return (
        <div className="mx-auto max-w-5xl rounded-[2.5rem] border isolate shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all overflow-hidden">
    
        <div className= {`custom-scrollbar flex max-h-[calc(100vh-8rem)] flex-col gap-5 overflow-y-auto pt-10 pb-10 pl-10 pr-6 ${
            isNight
                ? 'border-white/10 bg-[#1e293b]/90 text-gray-100'
                : 'border-white/40 bg-white/90 text-gray-800'
        }`}>
            {/* Thêm relative và pr-44 để tạo khoảng trống cố định bên phải, tránh chữ đè lên nút */}
            <div className="relative flex flex-col pr-44">
                <div className="flex-1">
                    {/* Đã dọn dẹp class text trùng lặp */}
                    <h3 className={`text-xl font-bold break-words ${
                        isNight ? 'text-blue-300' : 'text-slate-800'
                    }`}>
                        {selectedSet?.name || 'Flashcard set'}
                    </h3>
                    {selectedSet?.description && (
                        <p className={`mt-1 text-sm leading-6 break-words ${
                            isNight ? 'text-gray-400' : 'text-slate-500'
                        }`}>
                            {selectedSet.description}
                        </p>
                    )}
                </div>

                {/* Cụm nút được đưa về absolute ở góc trên bên phải */}
                <div className="absolute top-0 right-0 flex items-center gap-4 shrink-0">
                    <button
                        type="button"
                        onClick={onStudy}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 whitespace-nowrap"
                    >
                        Học bộ này
                    </button>
                    <button
                        type="button"
                        onClick={onBack}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center text-gray-400 transition-all hover:rotate-90 ${
                            isNight ? 'hover:text-red-400' : 'hover:text-red-500'
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

            <ErrorBanner error={error} onDismiss={clearError} />

            <section className={`rounded-lg border p-4 shadow-sm transition-all ${
                isNight
                    ? 'border-gray-700 bg-gray-800/50'
                    : 'border-slate-200 bg-white'
            }`}>
                <h4 className={`text-lg mb-3 text-base font-bold ${
                    isNight ? 'text-blue-300' : 'text-slate-800'
                }`}>
                    Thêm thẻ mới
                </h4>

                <div className="grid gap-3 md:grid-cols-2">
                    <textarea
                        className={`text-xl min-h-24 resize-none rounded-lg border p-3 outline-none transition focus:ring-2 ${
                            isNight
                                ? 'border-gray-700 bg-gray-900/50 text-white placeholder-gray-600 focus:border-blue-400 focus:ring-blue-900/30'
                                : 'border-slate-200 bg-white text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-indigo-100'
                        }`}
                        value={newCard.front}
                        onChange={(e) => updateNewCard('front', e.target.value)}
                        placeholder="Mặt trước"
                        disabled={isLoading}
                    />
                    <textarea
                        className={`text-xl min-h-24 resize-none rounded-lg border p-3 outline-none transition focus:ring-2 ${
                            isNight
                                ? 'border-gray-700 bg-gray-900/50 text-white placeholder-gray-600 focus:border-blue-400 focus:ring-blue-900/30'
                                : 'border-slate-200 bg-white text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-indigo-100'
                        }`}
                        value={newCard.back}
                        onChange={(e) => updateNewCard('back', e.target.value)}
                        placeholder="Mặt sau"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex justify-end w-full">
                    <button
                        type="button"
                        onClick={handleAddCard}
                        disabled={isLoading || !canAddCard}
                        className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                            isNight
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-600'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300'
                        }`}
                    >
                        {isLoading ? 'Đang lưu...' : 'Thêm thẻ'}
                    </button>
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <h4 className={`text-lg text-base font-bold ${
                        isNight ? 'text-blue-300' : 'text-slate-800'
                    }`}>
                        Toàn bộ thẻ
                    </h4>
                    <span className={`text-sm font-medium ${
                        isNight ? 'text-gray-400' : 'text-slate-500'
                    }`}>
                        {cardsList.length} thẻ
                    </span>
                </div>

                {isLoading && cardsList.length === 0 ? (
                    <div className={`rounded-lg border p-4 text-center text-sm transition-all ${
                        isNight
                            ? 'border-gray-700 bg-gray-800/50 text-gray-400'
                            : 'border-slate-200 bg-white text-slate-500'
                    }`}>
                        Đang tải flashcard...
                    </div>
                ) : cardsList.length === 0 ? (
                    <div className={`rounded-lg border border-dashed p-6 text-center text-sm transition-all ${
                        isNight
                            ? 'border-gray-600 bg-gray-900/20 text-gray-400'
                            : 'border-slate-300 bg-white text-slate-500'
                    }`}>
                        Bộ này chưa có thẻ nào. Thêm thẻ đầu tiên ở phía trên.
                    </div>
                ) : (
                    cardsList.map((card, index) => {
                        const isEditing = editingCardId === card.id;

                        return (
                            <article
                                key={card.id}
                                className={`rounded-lg border p-4 shadow-sm transition-all ${
                                    isNight
                                        ? 'border-gray-700 bg-gray-800/50'
                                        : 'border-slate-200 bg-white'
                                }`}
                            >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <span className={`flex-1 text-sm font-bold whitespace-nowrap ${
                                        isNight ? 'text-gray-400' : 'text-slate-500'
                                    }`}>
                                        Thẻ {index + 1}
                                    </span>

                                    {isEditing ? (
                                        <div className="flex justify-end items-center gap-2 w-full">
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEdit(card.id)}
                                                disabled={isLoading || !canSaveEdit}
                                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                                                    isNight
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-600'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300'
                                                }`}
                                            >
                                                Lưu
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                                    isNight
                                                        ? 'border-gray-600 bg-gray-700/50 text-gray-400 hover:bg-gray-600'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end items-center gap-2 w-full">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(card)}
                                                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                                    isNight
                                                        ? 'border-indigo-600/50 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'
                                                        : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                }`}
                                            >
                                                Chỉnh sửa
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteFlashcard(card.id);
                                                }}
                                                className={`flex cursor-pointer h-10 w-10 items-center justify-center rounded-xl text-red-400 opacity-100 transition-all hover:text-red-600 ${
                                                    isNight ? "hover:bg-gray-600/80" : "hover:bg-gray-200"
                                                }`}
                                                >
                                                <Trash size={18} weight="bold" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {isEditing ? (
                                    <>
                                        <textarea
                                            className={`text-lg min-h-24 resize-none rounded-lg border p-3 outline-none transition focus:ring-2 ${
                                                isNight
                                                    ? 'border-gray-700 bg-gray-900/50 text-white placeholder-gray-600 focus:border-blue-400 focus:ring-blue-900/30'
                                                    : 'border-slate-200 bg-white text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-indigo-100'
                                            }`}
                                            value={editingCard.front}
                                            onChange={(e) => updateEditingCard('front', e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <textarea
                                            className={`text-lg min-h-24 resize-none rounded-lg border p-3 outline-none transition focus:ring-2 ${
                                                isNight
                                                    ? 'border-gray-700 bg-gray-900/50 text-white placeholder-gray-600 focus:border-blue-400 focus:ring-blue-900/30'
                                                    : 'border-slate-200 bg-white text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-indigo-100'
                                            }`}
                                            value={editingCard.back}
                                            onChange={(e) => updateEditingCard('back', e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className={`min-h-24 rounded-lg p-3 text-lg leading-6 transition-all ${
                                            isNight
                                                ? 'bg-gray-900/50 text-gray-200'
                                                : 'bg-slate-50 text-slate-700'
                                        }`}>
                                            {card.front}
                                        </div>
                                        <div className={`min-h-24 rounded-lg p-3 text-lg leading-6 transition-all ${
                                            isNight
                                                ? 'bg-indigo-900/30 text-indigo-200'
                                                : 'bg-indigo-50 text-indigo-900'
                                        }`}>
                                            {card.back}
                                        </div>
                                    </>
                                )}
                            </div>
                            </article>
                        );
                    })
                )}
            </section>
        </div>
        </div>
    );
};

export default FlashcardEditView;
