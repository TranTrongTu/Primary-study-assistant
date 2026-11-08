// src/components/ThemeWrapper.jsx
import React, { useState, useEffect, createContext, useContext } from "react";
import backgroundDay from "../../assets/background/background_day.png";
import backgroundNight from "../../assets/background/background_night.png";

import { useWeatherEngine } from "./hooks/useWeatherEngine";
import { DayNightToggle } from "./elements/DayNightToggle";
import { GlobalStyles } from "./elements/GlobalStyles";
import {
  RainCanvas,
  PuddleSplashes,
  PetrichorMist,
} from "./elements/RainSystem";
import {
  DriftingClouds,
  MorningFog,
  StarField,
  ShootingStars,
} from "./elements/SkyEffects";
import {
  Butterflies,
  FallingPetals,
  GoldenDust,
  Bees,
  Fireflies,
  FallingLeaves,
} from "./elements/NatureCreatures";
import { Rainbow } from "./elements/Rainbow";
import { LightningSVG } from "./elements/LightningSVG";

export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeWrapper = ({
  children,
  showToggle = true,
  topRightActions = null,
}) => {
  // ĐỌC THEME TỪ BỘ NHỚ LÚC MỚI VÀO TRANG (Chống nhấp nháy chuyển màu)
  const [isNight, setIsNight] = useState(() => {
    const savedTheme = localStorage.getItem("eduspark_theme");
    return savedTheme === "dark"; // Nếu đã lưu dark thì trả về true, chưa có mặc định là false (Sáng)
  });

  // LƯU LẠI THEME MỖI KHI NGƯỜI DÙNG BẤM NÚT ĐỔI
  useEffect(() => {
    localStorage.setItem("eduspark_theme", isNight ? "dark" : "light");
  }, [isNight]);

  const toggleMode = () => setIsNight((p) => !p);

  const {
    weather,
    rainbowPhase,
    lightningBolts,
    shootingStar,
    isRaining,
    isStopping,
    showFog,
    cloudDark,
  } = useWeatherEngine(isNight);

  return (
    <ThemeContext.Provider value={{ isNight, toggleMode }}>
      <GlobalStyles />

      <div
        className="relative flex h-screen w-screen flex-col bg-cover bg-center bg-no-repeat font-sans overflow-hidden"
        style={{
          backgroundImage: `url(${isNight ? backgroundNight : backgroundDay})`,
          transition: "background-image 0.8s ease-in-out",
          color: isNight ? "#e2eaff" : "#1f2937",
        }}
      >
        {/* ── TẦNG 1: Bầu trời & Mây (Dưới cùng) ── */}
        <StarField visible={isNight && !isRaining} />

        {/* Đã FIX: Truyền object 'star' thay vì boolean 'visible' */}
        <ShootingStars star={shootingStar} />

        <MorningFog visible={showFog} />
        <DriftingClouds darkened={cloudDark} />

        {/* ── TẦNG 2: Cầu vồng ── */}
        {!isNight && <Rainbow phase={rainbowPhase} />}

        {/* ── TẦNG 3: Bóng tối khi trời mưa ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 4,
            background: isNight
              ? "linear-gradient(to bottom, rgba(5,10,30,0.62) 0%, rgba(10,20,55,0.3) 55%, transparent 100%)"
              : "linear-gradient(to bottom, rgba(20,35,75,0.58) 0%, rgba(30,50,100,0.25) 50%, transparent 100%)",
            opacity: cloudDark ? 1 : 0,
            transition: "opacity 4s ease-in-out",
          }}
        />

        {/* ── TẦNG 4: Sinh vật ── */}
        <Fireflies visible={isNight && !isRaining} />

        {!isNight && (
          <>
            <Butterflies visible={!isRaining} hide={cloudDark} />
            <FallingPetals visible={true} />
            <FallingLeaves
              visible={!isNight}
              cloudDark={cloudDark}
              isRaining={isRaining}
            />
            <GoldenDust visible={!isRaining} />
            <Bees visible={!isRaining} hide={cloudDark} />
          </>
        )}

        {/* ── TẦNG 5: Nước mưa ── */}
        <RainCanvas active={isRaining} stopping={isStopping} />
        <PuddleSplashes active={isRaining && !isStopping} />
        <PetrichorMist active={weather === "mist"} />

        {/* ── TẦNG 6: Sấm sét ── */}
        {isNight && <LightningSVG bolts={lightningBolts} />}

        {/* ── TẦNG UI: Nút chuyển đổi ── */}
        {showToggle && (
          <div className="absolute right-8 top-6 z-[100001] flex items-center gap-3">
            {topRightActions}
            <DayNightToggle isNight={isNight} onToggle={toggleMode} />
          </div>
        )}

        {/* ── TẦNG NỘI DUNG CHÍNH ── */}
        <div className="relative h-full w-full" style={{ zIndex: 20 }}>
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};
