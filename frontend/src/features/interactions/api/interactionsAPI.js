import axiosClient from '../../../api/axiosClient';

const PATH = '/interaction';

// POST: body: interactionData = { title, description, ... }
export const createInteraction = async (interactionData) => {
    const response = await axiosClient.post(`${PATH}/create`, interactionData);
    return response.data;
};

// GET
export const readInteractions = async () => {
    const response = await axiosClient.get(PATH);
    return response.data;
}

// PATCH: parameter: interactionId; body: updateData
export const updateInteraction = async (interactionId, updateData) => {
    const response = await axiosClient.patch(`${PATH}/${interactionId}`, updateData);
    return response.data;
};

// DELETE: parameter: interactionId
export const deleteInteraction = async (interactionId) => {
    const response = await axiosClient.delete(`${PATH}/${interactionId}`);
    return response.data;
};