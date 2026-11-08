import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenText, Calculator, Notebook, Scroll, SparkleIcon } from "@phosphor-icons/react";

import { useInteractions } from "../hooks/useInteractions";
import { InteractionItem } from "./InteractionItem";
import { InteractionForm } from "./InteractionForm"; 
import { DeleteInteractionModal } from "./DeleteInteractionModal"; 

const PALETTE = [
  { badgeClass: "bg-[#fff4bf]", Icon: Notebook },
  { badgeClass: "bg-[#d8f3ff]", Icon: Calculator },
  { badgeClass: "bg-[#e8ddff]", Icon: BookOpenText },
  { badgeClass: "bg-[#ffe3c4]", Icon: Scroll }, 
  { badgeClass: "bg-[#dff7e8]", Icon: SparkleIcon },
  { badgeClass: "bg-[#f5ddff]", Icon: Notebook }
];

export const InteractionList = () => {
  const navigate = useNavigate();
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Lấy các state và function từ hook đã được làm sạch
  const {
    interactions, isLoading, error, 
    formData, handleFormChange, editingId, 
    handleEditClick, cancelEditClick, 
    createInteraction, updateInteraction, deleteInteraction
  } = useInteractions();

  const isEditing = editingId !== null;
  const pendingDeleteInteraction = interactions.find(i => i.id === pendingDeleteId);

  // Gom chung logic xử lý form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) return;

    const inputData = { 
      name, 
      description: formData.description.trim() || "..." 
    };

    if (isEditing) {
      await updateInteraction(editingId, inputData);
    } else {
      const created = await createInteraction(inputData);
      if (created?.id) navigate(`/interaction/${created.id}`);
    }
  };

  return (
    <>
      <InteractionForm 
        isEditing={isEditing}
        formData={formData}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onCancel={cancelEditClick}
      />

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {interactions.map((interaction, idx) => (
          <InteractionItem
            key={interaction.id}
            interaction={interaction}
            paletteItem={PALETTE[idx % PALETTE.length]}
            accentColor="#1d7bd8"
            onOpen={(id) => navigate(`/interaction/${id}`)}
            onEdit={handleEditClick}
            onDelete={setPendingDeleteId}
          />
        ))}

        {error && <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 text-sm font-medium">{error}</div>}
        {isLoading && interactions.length === 0 && <div className="col-span-full text-center p-10 text-gray-400 animate-pulse">Đang chuẩn bị sổ ghi chú...</div>}
        {!isLoading && interactions.length === 0 && <div className="col-span-full text-center p-10 text-gray-400 italic">Bé chưa có sổ nào, hãy tạo một cái nhé!</div>}
      </section>

      <DeleteInteractionModal 
        interactionName={pendingDeleteInteraction?.name}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          deleteInteraction(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </>
  );
};