import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/notesApi';

export const useNotes = (interactionId) => {
    //

    const [notes, setNotes] = useState([]); // Danh sách note của interaction hiện tại 
    const [isLoading, setIsLoading] = useState(false); //
    const [error, setError] = useState(null); //

    const [noteName, setNoteName] = useState(''); // Tên
    const [noteDescription, setNoteDescription] = useState(''); // Mô tả
    const [noteContent, setNoteContent] = useState(''); // Nội dung note

    const [editingNoteID, setEditingNoteID] = useState(null); // ID của note đang được chỉnh sửa

    // Hàm hiển thị tên note trong lúc người dùng nhập
    const handleNoteNameChange = (e) => {
        setNoteName(e.target.value);
    };

    // Hàm hiển thị mô tả note trong lúc người dùng nhập
    const handleNoteDescriptionChange = (e) => {
        setNoteDescription(e.target.value);
    };

    // Hàm hiển thị nội dung note trong lúc người dùng nhập
    const handleNoteContentChange = (e) => {
        setNoteContent(e.target.value);
    };

    // Tạo note mới bằng cách chuẩn bị input và truyền vào hàm save
    const createNewNote = async(e) => { 
        if (e && e.preventDefault) e.preventDefault();

        const noteInput = {
            name: noteName || '',
            description: noteDescription || '',
            content: noteContent || ''
        };
        const result = await saveNote(noteInput);
        if (result) { // Chỉ reset nếu saveNote trả về dữ liệu (thành công)
            setNoteName('');
            setNoteDescription('');
            setNoteContent('');
        }
    };
    
    // Hàm đánh dấu bắt đầu chỉnh sửa: Gọi khi người dùng ấn vào nút bắt đầu chỉnh sửa
    const handleUpdateNoteClick = (note) => {
        setEditingNoteID(note.id); // Đánh dấu id note cần sửa
        setNoteName(note.name); // Điền tên cũ vào input
        setNoteDescription(note.description); // Điền mô tả cũ vào input
        setNoteContent(note.content); // Điền nội dung cũ
    }

    const cancelEditNoteClick = useCallback(() => {
        setEditingNoteID(null);
        setNoteName('');
        setNoteDescription('');
        setNoteContent(''); 
    }, []);

    const handleUpdateNote = async(e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editingNoteID) return;

        const noteInput = {
            name: noteName || '',
            description: noteDescription || '',
            content: noteContent || ''
        };
        
        const result = await updateNote(editingNoteID, noteInput);
        if (result) {
            // Reset form sau khi thành công
            cancelEditNoteClick();
        };
    }

    // Hàm thông báo lỗi
    const handleActionError = useCallback((err, defaultMessage) => {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;

        if (status === 401) {
            setError("Phiên làm việc đã hết hạn. Bé vui lòng đăng nhập lại nhé!");
        } else if (status === 404) {
            setError("Hệ thống không tìm thấy ghi chú này hoặc phiên học đã bị xóa rồi bé ơi!");
        } else if (status === 422) {
            setError("Thông tin bé điền chưa đúng quy định (có thể do tên quá dài hoặc để trống). Bé kiểm tra lại nhé!");
        } else {
            setError(detail || defaultMessage);
        }
    }, []);

    // Lấy danh sách toàn bộ note của interaction đó
    const readNotes = useCallback(async () => {
        if (!interactionId) return;
        setIsLoading(true);
        setError(null);
        try {
            // Truyền interactionId vào để lấy đúng các note của tương tác đó
            const data = await api.readNotes(interactionId);
            setNotes(data);
        } catch (err) {
            handleActionError(err, "Máy chủ đang bận, bé không thể tải danh sách ghi chú lúc này.");
        } finally {
            setIsLoading(false);
        }
    }, [interactionId, handleActionError]);

    useEffect(() => {
        readNotes();
    }, [readNotes]);

    const saveNote = async (noteInput) => {
        setIsLoading(true);
        setError(null);
        try {
            const newNote = await api.createNote(interactionId, noteInput);
            setNotes(prev => [...prev, newNote]);
            return newNote;
        } catch (err) {
            handleActionError(err, "Bé không thể lưu ghi chú lúc này. Thử lại sau nhé!");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const updateNote = async (noteId, updateData) => {
        setIsLoading(true);
        setError(null);
        try {
            const updatedNote = await api.updateNote(noteId, updateData);
            setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
            return updatedNote;
        } catch (err) {
            handleActionError(err, "Chỉnh sửa không thành công. Bé kiểm tra lại nhé!");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteNote = async (noteId) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.deleteNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
            return true;
        } catch (err) {
            handleActionError(err, "Không thể xóa ghi chú này. Bé thử lại sau nha!");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        notes,
        isLoading,
        error,
        noteName,
        noteDescription,
        noteContent,
        editingNoteID,

        handleNoteNameChange,
        handleNoteDescriptionChange,
        handleNoteContentChange,
        createNewNote,  // Tạo note mới
        handleUpdateNoteClick,
        cancelEditNoteClick,
        handleUpdateNote, // Cập nhật note 
        readNotes,
        deleteNote,
        setError
    };
};