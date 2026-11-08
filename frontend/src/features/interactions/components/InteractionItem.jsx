import React from "react";
import { PencilSimple, Trash } from "@phosphor-icons/react";

export const InteractionItem = ({
  interaction, paletteItem, accentColor = "#1d7bd8", onOpen, onDelete, onEdit
}) => {
  const { Icon, badgeClass } = paletteItem;

  // Helper gom logic chặn sự kiện (tránh click nhầm vào việc mở sổ)
  const handleAction = (e, actionFn) => {
    e.stopPropagation();
    actionFn();
  };

  return (
    <div className="group relative min-h-[126px] rounded-[18px] border border-[#8a8a8a] bg-white px-4 py-4 text-left shadow-[0_2px_0_rgba(255,255,255,0.9)_inset] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(0,0,0,0.1)]">
      <button
        type="button"
        onClick={() => onOpen(interaction.id)}
        className="flex w-full items-center gap-4 focus:outline-none focus:ring-4 focus:ring-[#1d7bd8]/20 rounded-xl"
      >
        <div className={`flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl ${badgeClass}`}>
          <Icon size={30} weight="fill" color={accentColor} />
        </div>

        <div className="min-w-0 pr-16 text-left">
          <p className="truncate text-[1.05rem] font-bold leading-tight text-[#4f4f4f]">
            {interaction.name}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-[#7a7a7a]">
            {interaction.description || "Chưa có mô tả..."}
          </p>
        </div>
      </button>

      {/* Các nút thao tác - Chỉ hiện khi hover */}
      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-100">
        <button
          type="button"
          onClick={(e) => handleAction(e, () => onEdit(interaction))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f0ff] text-[#1d7bd8] transition hover:bg-[#d1e3ff]"
          title="Sửa sổ"
        >
          <PencilSimple size={18} weight="bold" />
        </button>

        <button
          type="button"
          onClick={(e) => handleAction(e, () => onDelete(interaction.id))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe6e6] text-[#c63030] transition hover:bg-[#ffd5d5]"
          title="Xóa sổ"
        >
          <Trash size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
};