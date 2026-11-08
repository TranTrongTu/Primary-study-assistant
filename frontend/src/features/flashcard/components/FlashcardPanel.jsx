import React, { useEffect, useState } from 'react';
import FlashcardEditView from './FlashcardEditView';
import FlashcardGenerator from './FlashcardGenerator';
import FlashcardStudyView from './FlashcardStudyView';
import { useTheme } from '../../../components/theme/ThemeWrapper';

const FlashcardPanel = ({
  isLoading,
  isCreatingWithAI,
  onCreateFlashcardSet,
  onCreateEmptyFlashcardSet,
  error,
  onClose,
  onFlashcardSetCreated,
  initialViewMode = 'create',
  initialSelectedSet = null,
}) => {
  const { isNight } = useTheme();
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedSet, setSelectedSet] = useState(initialSelectedSet);
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setViewMode(initialViewMode);
    setSelectedSet(initialSelectedSet);
  }, [initialViewMode, initialSelectedSet]);

  const requestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
    }, 220);
  };

  const handleCreateWithAi = async (promptData) => {
    requestClose();
    const createdSet = await onCreateFlashcardSet(promptData);

    if (createdSet) {
      setGeneratorPrompt('');
      if (onFlashcardSetCreated) onFlashcardSetCreated();
    }

    return createdSet;
  };

  const handleCreateEmptySet = async (formData) => {
    const createdSet = await onCreateEmptyFlashcardSet(formData);

    if (createdSet) {
      setSelectedSet(createdSet);
      setViewMode('edit');
    }

    return createdSet;
  };

  const isCreateMode = viewMode === 'create';

  const renderContent = () => (
    <>
      {isCreateMode && (
        <FlashcardGenerator
          isLoading={isLoading}
          isCreatingWithAI={isCreatingWithAI}
          error={error}
          prompt={generatorPrompt}
          setPrompt={setGeneratorPrompt}
          onCreateFlashcardSet={handleCreateWithAi}
          onCreateEmptyFlashcardSet={handleCreateEmptySet}
          closeAfterAiSubmit={true}
        />
      )}

      {viewMode === 'study' && (
        <FlashcardStudyView
          selectedSet={selectedSet}
          onBack={requestClose}
          onEdit={() => setViewMode('edit')}
        />
      )}

      {viewMode === 'edit' && (
        <FlashcardEditView
          selectedSet={selectedSet}
          onBack={requestClose}
          onStudy={() => setViewMode('study')}
        />
      )}
    </>
  );

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-[220ms] ${
        isClosing ? 'opacity-0' : 'opacity-100'
      } ${isNight ? 'bg-black/60' : 'bg-white/40'}`}
      onClick={requestClose}
    >
      <div
        className={`relative max-h-[calc(100vh-2rem)] w-full transform-gpu transition-all duration-[220ms] ${
          isClosing
            ? 'translate-y-4 scale-[0.98] opacity-0'
            : 'translate-y-0 scale-100 opacity-100 animate-in fade-in zoom-in duration-300'
        } ${
          isCreateMode
            ? 'max-w-[800px] overflow-auto'
            : 'max-w-[1100px]'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {isCreateMode && (
          <button
            type="button"
            onClick={requestClose}
            className="absolute right-8 top-8 z-50 text-gray-400 transition-all hover:rotate-90 hover:text-red-500"
            aria-label="Đóng flashcard"
            title="Đóng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
              <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path>
            </svg>
          </button>
        )}
          

        <div key={viewMode} className="animate-in fade-in slide-in-from-bottom-3 duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FlashcardPanel;
