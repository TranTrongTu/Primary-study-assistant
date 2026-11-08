import React from "react";

export const DayNightToggle = ({ isNight, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isNight ? "Chuyển sang ban ngày" : "Chuyển sang ban đêm"}
      style={{
        position: "relative",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
        width: 88,
        height: 40,
        borderRadius: 20,
        padding: 4,
        border: "none",
        outline: "none",
        background: isNight
          ? "linear-gradient(135deg, #0f1c3f, #1a2d6b, #0d1b4b)"
          : "linear-gradient(135deg, #f9c846, #f6a623, #f9c846)",
        boxShadow: isNight
          ? "0 0 0 2px rgba(100,140,255,.4), inset 0 2px 6px rgba(0,0,0,.5), 0 4px 16px rgba(30,60,180,.4)"
          : "0 0 0 2px rgba(249,200,70,.5), inset 0 2px 6px rgba(0,0,0,.15), 0 4px 16px rgba(249,160,30,.5)",
        transition: "background .5s, box-shadow .5s",
      }}
    >
      {/* Cụm sao nhỏ (chỉ hiện ban đêm) */}
      {isNight && (
        <span
          style={{
            position: "absolute",
            left: 10,
            top: 8,
            width: 2,
            height: 2,
            borderRadius: "50%",
            background: "rgba(255,255,255,.9)",
            boxShadow: "8px 4px 0 rgba(255,255,255,.7), 4px 12px 0 rgba(255,255,255,.5)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Chữ / Icon mặt trời (chỉ hiện ban ngày) */}
      {!isNight && (
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 14,
            opacity: 0.6,
            pointerEvents: "none",
          }}
        >
          ☀️
        </span>
      )}

      {/* Cục tròn di chuyển (Thumb) */}
      <span
        style={{
          position: "absolute",
          left: isNight ? "calc(100% - 36px - 4px)" : 4,
          width: 36,
          height: 32,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "left .4s cubic-bezier(.34,1.56,.64,1), background .4s, box-shadow .4s",
          background: isNight
            ? "linear-gradient(135deg, #dce8ff, #b8ccff)"
            : "linear-gradient(135deg, #fff9e6, #ffe680)",
          boxShadow: isNight
            ? "0 2px 8px rgba(0,0,30,.5), 0 0 12px rgba(160,190,255,.4)"
            : "0 2px 8px rgba(180,100,0,.3), 0 0 12px rgba(255,220,50,.6)",
        }}
      >
        {isNight ? (
          /* Icon Mặt trăng khuyết */
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M14.5 9.5C14.5 13.09 11.59 16 8 16C4.41 16 1.5 13.09 1.5 9.5C1.5 5.91 4.41 3 8 3C8.27 3 8.53 3.02 8.79 3.05C7.41 4.1 6.5 5.7 6.5 7.5C6.5 10.26 8.74 12.5 11.5 12.5C12.57 12.5 13.56 12.15 14.35 11.55C14.44 10.88 14.5 10.2 14.5 9.5Z"
              fill="#4a6fa5"
              stroke="#6b8fc7"
              strokeWidth="0.5"
            />
          </svg>
        ) : (
          /* Icon Mặt trời tỏa nắng */
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="4" fill="#f6a623" stroke="#e8900a" strokeWidth="0.5" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
              <line
                key={i}
                x1={9 + 5.5 * Math.cos((a * Math.PI) / 180)}
                y1={9 + 5.5 * Math.sin((a * Math.PI) / 180)}
                x2={9 + 7.5 * Math.cos((a * Math.PI) / 180)}
                y2={9 + 7.5 * Math.sin((a * Math.PI) / 180)}
                stroke="#f6a623"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}
      </span>
    </button>
  );
};