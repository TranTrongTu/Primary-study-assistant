import React from "react";

import { InteractionList } from "../../interactions/components/InteractionList";

export const NotebookHeader = () => {
    return (
        <main className="flex flex-1 flex-col">
          <div className="mb-6">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-[#5b5b5b] md:text-[2.6rem]">
                Sổ ghi chú của tôi
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-[#6f6f6f]">
                Bé tự đặt tên và viết mô tả ngắn cho từng sổ học riêng.
              </p>
            </div>
          </div>
          
          <InteractionList />
        </main>
    );
};