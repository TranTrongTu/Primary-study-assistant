import React, { useState } from 'react';
import { useLogin } from '../features/auth/hooks/useLogin';
import { useRegister } from '../features/auth/hooks/useRegister';
import { useInteractions } from '../features/interactions/hooks/useInteractions';
import { useNotes } from '../features/notes/hooks/useNotes';
import { useDocuments } from '../features/documents/hooks/useDocuments';
import { useChat } from '../features/chat/hooks/useChat';

const TestLogic = () => {
    const [selectedId, setSelectedId] = useState('');

    // --- 1. AUTH HOOKS (Dùng handleSubmit nhận 'e') ---
    const regHook = useRegister();
    const loginHook = useLogin();

    // --- 2. BUSINESS LOGIC HOOKS ---
    const { 
        interactions, 
        createInteraction, 
        readInteractions, 
        deleteInteraction, // Thêm hàm xóa để Phú test
        isLoading: interLoading, 
        error: interError 
    } = useInteractions();

    const { notes, createNote, deleteNote, error: noteError } = useNotes(selectedId);
    const { documents, createDocument, error: docError } = useDocuments(selectedId);
    const { chatLog, askLLM, isLoading: chatLoading, error: chatError } = useChat(selectedId);

    return (
        <div style={{ padding: '40px', fontFamily: 'Montserrat, Segoe UI, Tahoma, Geneva, Verdana, sans-serif', maxWidth: '1100px', margin: 'auto', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <h1 style={{ textAlign: 'center', color: '#1a73e8', marginBottom: '30px' }}>🛠 AI TUTOR INTEGRATION TEST</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* --- ĐĂNG KÝ --- */}
                <fieldset style={fieldStyle('#34a853')}>
                    <legend><strong>🆕 Step 1: Register</strong></legend>
                    <form onSubmit={(e) => regHook.handleSubmit(e)}>
                        <input placeholder="Username" value={regHook.username} onChange={(e) => regHook.setUsername(e.target.value)} style={inputStyle} required />
                        <input placeholder="Email" type="email" value={regHook.email} onChange={(e) => regHook.setEmail(e.target.value)} style={inputStyle} required />
                        <input placeholder="Password" type="password" value={regHook.password} onChange={(e) => regHook.setPassword(e.target.value)} style={inputStyle} required />
                        <button type="submit" disabled={regHook.isLoading} style={btnStyle('#34a853', true)}>
                            {regHook.isLoading ? 'Processing...' : 'Register Now'}
                        </button>
                    </form>
                    {regHook.error && <p style={errStyle}>{regHook.error}</p>}
                </fieldset>

                {/* --- ĐĂNG NHẬP --- */}
                <fieldset style={fieldStyle('#4285f4')}>
                    <legend><strong>🔑 Step 2: Login</strong></legend>
                    <form onSubmit={(e) => loginHook.handleSubmit(e)}>
                        <input placeholder="Username" onChange={(e) => loginHook.setUsername(e.target.value)} style={inputStyle} required />
                        <input placeholder="Password" type="password" onChange={(e) => loginHook.setPassword(e.target.value)} style={inputStyle} required />
                        <button type="submit" disabled={loginHook.isLoading} style={btnStyle('#4285f4', true)}>
                            {loginHook.isLoading ? 'Authenticating...' : 'Login'}
                        </button>
                    </form>
                    {loginHook.error && <p style={errStyle}>{loginHook.error}</p>}
                </fieldset>
            </div>

            {/* --- QUẢN LÝ INTERACTIONS --- */}
            <fieldset style={fieldStyle('#fabb05')}>
                <legend><strong>📂 Step 3: Interactions Management</strong></legend>
                <div style={{ marginBottom: '15px' }}>
                    <button 
                        onClick={() => createInteraction({ title: `Lab AI ${new Date().toLocaleTimeString()}`, content: "Test content" })} 
                        style={btnStyle('#fabb05')}
                    >
                        ➕ Create New Interaction
                    </button>
                    <button onClick={readInteractions} style={{ ...btnStyle('#5f6368'), marginLeft: '10px' }}>
                        🔄 Refresh List
                    </button>
                </div>

                <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                    {interLoading ? <p style={{padding: '10px'}}>Loading...</p> : (
                        interactions.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee' }}>
                                <span><strong>ID: {item.id}</strong> - {item.title}</span>
                                <div>
                                    <button 
                                        onClick={() => setSelectedId(item.id)}
                                        style={{ background: selectedId === item.id ? '#ea4335' : '#1a73e8', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}
                                    >
                                        {selectedId === item.id ? '✅ Selected' : 'Select'}
                                    </button>
                                    <button onClick={() => deleteInteraction(item.id)} style={{ background: 'none', color: '#ea4335', border: '1px solid #ea4335', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {interError && <p style={errStyle}>{interError}</p>}
            </fieldset>

            {/* --- TÍNH NĂNG CHI TIẾT --- */}
            {selectedId ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginTop: '30px' }}>
                    
                    {/* Chat AI Section */}
                    <fieldset style={fieldStyle('#a142f4')}>
                        <legend><strong>🤖 AI Chat (ID: {selectedId})</strong></legend>
                        <div style={{ height: '250px', overflowY: 'auto', background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e0e0e0' }}>
                            {chatLog.length === 0 && <p style={{color: '#999'}}>No messages yet...</p>}
                            {chatLog.map((msg, i) => (
                                <div key={i} style={{ marginBottom: '15px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#a142f4' }}>User: <span style={{fontWeight: 'normal', color: '#333'}}>{msg.prompt}</span></div>
                                    <div style={{ fontWeight: 'bold', color: '#34a853', marginTop: '5px' }}>AI: <span style={{fontWeight: 'normal', color: '#333'}}>{msg.answer}</span></div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => askLLM("Explain Linear Regression in 1 sentence.")} disabled={chatLoading} style={btnStyle('#a142f4', true)}>
                            {chatLoading ? 'AI is thinking...' : 'Ask AI Sample Question'}
                        </button>
                        {chatError && <p style={errStyle}>{chatError}</p>}
                    </fieldset>

                    {/* Notes & Docs Section */}
                    <div>
                        <fieldset style={fieldStyle('#34a853')}>
                            <legend><strong>📝 Notes</strong></legend>
                            <button onClick={() => createNote({ content: "Quick note at " + new Date().toLocaleTimeString() })} style={btnStyle('#34a853', true)}>Add Quick Note</button>
                            <div style={{ marginTop: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                                {notes.map(n => (
                                    <div key={n.id} style={{ fontSize: '13px', padding: '5px 0', borderBottom: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between' }}>
                                        {n.content} <span onClick={() => deleteNote(n.id)} style={{color: 'red', cursor: 'pointer'}}>✖</span>
                                    </div>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset style={fieldStyle('#ea4335', '20px')}>
                            <legend><strong>📄 Documents</strong></legend>
                            <input type="file" onChange={(e) => e.target.files[0] && createDocument(e.target.files[0], { title: "Upload Test" })} style={{fontSize: '12px'}} />
                            <div style={{marginTop: '10px', fontSize: '12px'}}>Files: {documents.length}</div>
                        </fieldset>
                    </div>

                </div>
            ) : (
                <div style={{ textAlign: 'center', marginTop: '30px', padding: '40px', background: '#e8f0fe', borderRadius: '12px', color: '#1967d2', border: '2px dashed #1a73e8' }}>
                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>👋 Ready to start?</p>
                    <p>Please <strong>Login</strong> and <strong>Select an Interaction</strong> above to activate AI features.</p>
                </div>
            )}
        </div>
    );
};

// --- STYLES ---
const fieldStyle = (color, marginTop = '0px') => ({
    border: `2px solid ${color}`,
    borderRadius: '12px',
    padding: '20px',
    marginTop,
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
});

const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #dadce0', boxSizing: 'border-box' };

const btnStyle = (color, fullWidth = false) => ({
    width: fullWidth ? '100%' : 'auto',
    padding: '12px 24px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'opacity 0.2s'
});

const errStyle = { color: '#d93025', fontSize: '13px', marginTop: '8px', fontWeight: '500' };

export default TestLogic;