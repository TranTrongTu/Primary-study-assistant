import React, { useMemo, useState, useEffect } from 'react';
import { Cards, MagicWand, Sparkle, WarningCircle } from '@phosphor-icons/react';
import { useTheme } from '../../../components/theme/ThemeWrapper';
import { SUBJECTS, SAMPLE_PROMPTS } from '../constants';



const FlashcardGenerator = ({
    isLoading,
    isCreatingWithAI,
    error,
    prompt,
    setPrompt,
    onCreateFlashcardSet,
    onCreateEmptyFlashcardSet,
    closeAfterAiSubmit = false,
}) => {
    const { isNight } = useTheme();
    const [createMode, setCreateMode] = useState('ai');
    const [subject, setSubject] = useState('VIETNAMESE');
    const [selectedSamples, setSelectedSamples] = useState([]);
    const [emptySetForm, setEmptySetForm] = useState({
        name: '',
        description: '',
    });

    const [suggestedPrompts, setSuggestedPrompts] = useState([]);
    const refreshPrompts = () => {
        const shuffled = [...SAMPLE_PROMPTS].sort(() => 0.5 - Math.random());
        const count = Math.floor(Math.random() * 2) + 3;
        setSuggestedPrompts(shuffled.slice(0, count));
    };
    useEffect(() => {
        refreshPrompts();
    }, []);

    const subjectLabel = useMemo(
        () => SUBJECTS.find((item) => item.id === subject)?.label,
        [subject],
    );

    const finalPrompt = useMemo(() => {
        const basePrompt = [prompt.trim(), ...selectedSamples].filter(Boolean).join('. ');
        if (!basePrompt) return '';

        return `Môn học: ${subjectLabel}. Nội dung tạo flashcard: ${basePrompt}`;
    }, [prompt, selectedSamples, subjectLabel]);

    const canCreateWithAi = finalPrompt.trim().length > 0;
    const canCreateEmptySet = (
        emptySetForm.name.trim() &&
        emptySetForm.description.trim() &&
        subject
    );
    const isFormValid = createMode === 'ai' ? canCreateWithAi : canCreateEmptySet;

    const isSubmitting = createMode === 'ai' ? isCreatingWithAI : isLoading;

    const updateEmptySetForm = (field, value) => {
        setEmptySetForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const toggleSample = (sample) => {
        setSelectedSamples((prev) => (
            prev.includes(sample) ? prev.filter((item) => item !== sample) : [...prev, sample]
        ));
    };

    const handleSubmit = async () => {
        if (!isFormValid || isSubmitting) return;

        if (createMode === 'ai') {
            const creationPromise = onCreateFlashcardSet({
                prompt: finalPrompt,
                subject_type: subject,
            });

            if (closeAfterAiSubmit) return;

            const createdSet = await creationPromise;
            if (createdSet) {
                setPrompt('');
                setSelectedSamples([]);
            }
            return;
        }

        const createdSet = await onCreateEmptyFlashcardSet({
            name: emptySetForm.name,
            description: emptySetForm.description,
            subject_type: subject,
        });

        if (createdSet) {
            setEmptySetForm({
                name: '',
                description: '',
            });
        }
    };

    return (
        <div className={`relative w-full rounded-[2.5rem] border p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all ${
            isNight
                ? 'border-white/10 bg-[#1e293b]/90 text-gray-100'
                : 'border-white/40 bg-white/90 text-gray-800'
        }`}>
            <header className="mb-6 flex items-center gap-4 pr-12">
                <div className={`rounded-2xl p-4 shadow-sm ${isNight ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
                    <Cards size={32} weight="fill" className="text-indigo-500" />
                </div>
                <div>
                    <h2 className={`text-3xl font-black tracking-tight ${isNight ? 'text-blue-400' : 'text-blue-600'}`}>
                        Cấu hình Flashcard
                    </h2>
                    <p className="text-sm font-bold opacity-60">
                        Cú Mèo sẽ dựa vào đây để tạo bộ thẻ ghi nhớ cho bé
                    </p>
                </div>
            </header>

            <div className="mb-6 flex gap-2">
                {[
                    { id: 'ai', label: 'Tạo bằng AI' },
                    { id: 'empty', label: 'Tạo bộ trống' },
                ].map((mode) => (
                    <button
                        key={mode.id}
                        type="button"
                        onClick={() => setCreateMode(mode.id)}
                        className={`rounded-xl border-2 px-5 py-2 text-sm font-black transition-all ${
                            createMode === mode.id
                                ? 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : (isNight ? 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100')
                        }`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            {isCreatingWithAI && (
                <div className={`mb-5 flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-bold ${
                    isNight
                        ? 'border-indigo-500/30 bg-indigo-900/20 text-indigo-300'
                        : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                }`}>
                    <Sparkle size={18} className="animate-spin shrink-0" />
                    AI đang tạo bộ thẻ... Bé có thể mở bộ flashcard cũ trong lúc chờ!
                </div>
            )}

            {error && (
                <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
                    typeof error === 'object' && error.type === 'warning'
                        ? (isNight ? 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200' : 'border-yellow-300 bg-yellow-50 text-yellow-700')
                        : (isNight ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-red-300 bg-red-50 text-red-700')
                }`}>
                    <span className="mt-0.5 shrink-0 text-base">{typeof error === 'object' && error.type === 'warning' ? '⚡' : '⚠️'}</span>
                    <span className="flex-1">{typeof error === 'string' ? error : error?.message || 'Có lỗi xảy ra'}</span>
                </div>
            )}

            <div className="mb-4">
                {createMode === 'ai' ? (
                    <>
                        <textarea
                            className={`h-36 w-full resize-none rounded-[2rem] border-2 p-6 text-[1.2rem] leading-relaxed outline-none transition-all custom-scrollbar ${
                                isNight
                                    ? 'border-gray-700 bg-gray-900/50 text-white placeholder-gray-600 focus:border-blue-400'
                                    : 'border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500'
                            }`}
                            placeholder="Nhập yêu cầu của bé hoặc dán văn bản vào đây..."
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            disabled={isCreatingWithAI}
                        />
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-black uppercase opacity-60">Gợi ý từ Cú Mèo:</h4>
                            <button type="button" onClick={refreshPrompts} className="text-[10px] font-bold text-blue-500 hover:underline">
                                Đổi gợi ý khác
                            </button>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {suggestedPrompts.map((sample) => {
                                const isSelected = selectedSamples.includes(sample);
                                return (
                                    <button
                                        key={sample}
                                        type="button"
                                        onClick={() => toggleSample(sample)}
                                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                                            isSelected
                                                ? 'border-blue-400 bg-blue-500 text-white shadow-lg shadow-blue-500/30 -translate-y-1'
                                                : (isNight ? 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100')
                                        }`}
                                    >
                                        {isSelected && <Sparkle size={14} weight="fill" className="animate-pulse" />}
                                        {sample}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="grid gap-4">
                        <input
                            className={`w-full rounded-[1.5rem] border-2 px-5 py-4 text-base font-bold outline-none transition ${
                                isNight
                                    ? 'border-gray-700 bg-gray-900/50 text-white placeholder-gray-600 focus:border-blue-400'
                                    : 'border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500'
                            }`}
                            value={emptySetForm.name}
                            onChange={(event) => updateEmptySetForm('name', event.target.value)}
                            placeholder="Tên bộ thẻ, ví dụ: Unit 4 vocabulary"
                            disabled={isSubmitting}
                        />
                        <textarea
                            className={`h-36 w-full resize-none rounded-[2rem] border-2 p-6 text-[1.05rem] leading-relaxed outline-none transition-all custom-scrollbar ${
                                isNight
                                    ? 'border-gray-700 bg-gray-900/50 text-white placeholder-gray-600 focus:border-blue-400'
                                    : 'border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500'
                            }`}
                            value={emptySetForm.description}
                            onChange={(event) => updateEmptySetForm('description', event.target.value)}
                            placeholder="Mục tiêu hoặc mô tả ngắn cho bộ flashcard..."
                            disabled={isSubmitting}
                        />
                    </div>
                )}
            </div>

            <div className="mb-5 flex flex-col gap-4 md:flex-row">
                <div className={`flex-1 rounded-3xl border-2 p-5 ${isNight ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest opacity-70">
                        📚 Chọn môn học:
                    </h4>
                    <div className="flex gap-2">
                        {SUBJECTS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSubject(item.id)}
                                className={`flex-1 rounded-xl border-2 py-3 text-xs font-black transition-all ${
                                    subject === item.id
                                        ? 'border-purple-500 bg-purple-500 text-white shadow-lg'
                                        : (isNight ? 'border-gray-700 bg-gray-800 text-gray-500 hover:bg-gray-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50')
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`flex flex-1 flex-col items-center justify-center rounded-3xl border-2 p-5 text-center ${isNight ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                    <p className="text-sm font-bold italic opacity-50">
                        {createMode === 'ai'
                            ? 'Bé sẽ dùng bộ flashcard này để ôn tập và ghi nhớ kiến thức'
                            : 'Bộ trống sẽ mở màn hình chỉnh sửa để bé thêm thẻ thủ công'}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    {!isFormValid && (
                        <span className="flex animate-pulse items-center gap-1 text-xs font-bold text-red-500">
                            <WarningCircle size={16} />
                            {createMode === 'ai'
                                ? 'Bé chưa nhập nội dung bài học!'
                                : 'Bé chưa nhập tên và mô tả bộ thẻ!'}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    disabled={isSubmitting || !isFormValid}
                    onClick={handleSubmit}
                    className={`group flex items-center gap-3 rounded-2xl px-10 py-4 font-black text-white shadow-xl transition-all active:scale-95 ${
                        !isFormValid
                            ? 'cursor-not-allowed bg-gray-400'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-purple-500/20 hover:-translate-y-1 hover:from-purple-600 hover:to-indigo-700'
                    }`}
                >
                    {isSubmitting ? (
                        <Sparkle size={24} className="animate-spin" />
                    ) : (
                        <MagicWand size={24} weight="fill" className="transition-transform group-hover:rotate-12" />
                    )}
                    {isSubmitting
                        ? 'ĐANG TẠO BỘ THẺ...'
                        : createMode === 'ai'
                            ? 'BẮT ĐẦU TẠO BỘ THẺ'
                            : 'TẠO BỘ TRỐNG'}
                </button>
            </div>
        </div>
    );
};

export default FlashcardGenerator;
