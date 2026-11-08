import axiosClient from '../../../api/axiosClient';

const PATH = '/note';

// POST: parameter: interactionId, body: noteData
export const createNote = async (interactionId, noteData) => {
    const response = await axiosClient.post(`${PATH}/${interactionId}/upload`, noteData);
    return response.data;
};

// GET: parameter: interactionId
export const readNotes = async (interactionId) => {
    const response = await axiosClient.get(`${PATH}/${interactionId}/`);
    return response.data;
};

// PATCH: parameter: noteId, body: updateData
export const updateNote = async (noteId, updateData) => {
    const response = await axiosClient.patch(`${PATH}/${noteId}`, updateData);
    return response.data;
};

// DELETE: parameter: noteId
export const deleteNote = async (noteId) => {
    const response = await axiosClient.delete(`${PATH}/${noteId}`);
    return response.data;
};