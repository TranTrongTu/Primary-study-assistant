import axiosClient from '../../../api/axiosClient';

/**
 * Parameter: 
 * - interactionId: ID của interaction (ví dụ: bài học, chủ đề, v.v.) mà flashcard thuộc về
 * - flashcardId: ID của flashcard Set
 * - cardId: ID của từng card trong flashcard set
 * - promptData: Dữ liệu đầu vào để tạo flashcard, có thể là string hoặc object chứa prompt và subject_type
 * - formData: Dữ liệu từ form để tạo hoặc cập nhật flashcard, bao gồm front, back, name, description, subject_type
 */

const PATH = '/study-activity';

const FRONT_TYPE = 'FLASHCARDS_FRONT';
const BACK_TYPE = 'FLASHCARDS_BACK';

export const transformBackendFlashcards = (studyActivityComplete) => {
    if (!studyActivityComplete || !Array.isArray(studyActivityComplete.items)) {
        return [];
    }

    return studyActivityComplete.items.map((reviewItem) => {
        const contents = Array.isArray(reviewItem.contents) ? reviewItem.contents : [];
        const frontContent = contents.find((content) => content.type === FRONT_TYPE);
        const backContent = contents.find((content) => content.type === BACK_TYPE);

        return {
            id: reviewItem.id,
            studyActivityId: studyActivityComplete.id,
            name: studyActivityComplete.name,
            description: studyActivityComplete.description,
            front: frontContent?.content || '',
            back: backContent?.content || '',
        };
    });
};

export const createFlashcard = async (interactionId, promptData) => {
    const promptText = typeof promptData === 'object' ? promptData.prompt : promptData;
    const subjectType = typeof promptData === 'object' ? promptData.subject_type : undefined;
    const documentId = typeof promptData === 'object' ? promptData.document_id : 0; // 🎯 Lấy document_id

    const payload = {
        prompt: promptText,
        activity_type: "REVIEW",
        activity_format: "FLASHCARDS",
        subject_type: subjectType,
        document_id: documentId || 0 // 🎯 Đẩy vào body
    };

    const response = await axiosClient.post(
            `${PATH}/${interactionId}/create`,
            payload
        )

    return response.data;
};

export const readFlashcard = async (flashcardId) => {
    const response = await axiosClient.get(`${PATH}/${flashcardId}`);
    return transformBackendFlashcards(response.data);
};

export const readAllFlashcards = async (interactionId) => {
    const response = await axiosClient.get(`${PATH}/${interactionId}/`);
    const activities = Array.isArray(response.data) ? response.data : [];
    
    // Filter chỉ lấy flashcards format
    const flashcardActivities = activities.filter((activity) => (
        activity.activity_type === "REVIEW" &&
        activity.activity_format === "FLASHCARDS"
    ));

    return flashcardActivities;
};

export const deleteFlashcard = async (flashcardId) => {
    const response = await axiosClient.delete(`${PATH}/${flashcardId}`);
    return response.data;
};

export const createEmptyFlashcard = async (interactionId, formData) => {
    const payload = {
        subject_type: formData.subject_type,
        name: formData.name,
        description: formData.description,
    };

    const response = await axiosClient.post(
            `${PATH}/${interactionId}/flashcards/create`,
            payload
        );

    return response.data;
}

export const addCard = async (flashcardId, formData) => {
    const payload = [{
        front: formData.front,
        back: formData.back,
    }];

    const response = await axiosClient.post(
            `${PATH}/${flashcardId}/add-cards`,
            payload
        );

    return response.data;
}

export const updateFlashcard = async (cardId, formData) => {
    const payload = {
        front: formData.front,
        back: formData.back,
    };

    const response = await axiosClient.patch(
            `${PATH}/flashcards/${cardId}`,
            payload
        );

    return response.data;
}

export const deleteCard = async (cardId) => {
    const response = await axiosClient.delete(`${PATH}/flashcards/${cardId}`);
    return response.data;
}
