import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Heart, Calendar, Plus } from 'lucide-react';
import { DUMMY_PHOTOS } from '../data/dummyData.ts';

export const MyPhotosView: React.FC = () => {
  // Toggle to easily switch between populated list view and empty state view
  const [isEmptyState, setIsEmptyState] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-4 py-4 px-4 pb-8">
      {/* 1. Sub-header & Empty State Review Switch */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#222222]">보관함</h2>
          <p className="text-xs text-[#222222]/50">내가 촬영하고 저장한 네컷 기록</p>
        </div>

        {/* State Toggle for previewing both List and Empty States */}
        <div className="flex items-center gap-1 bg-black/5 p-0.5 rounded-lg text-[10px] font-semibold text-[#222222]/60">
          <button
            type="button"
            onClick={() => setIsEmptyState(false)}
            className={`px-2 py-1 rounded-md transition-colors ${!isEmptyState ? 'bg-white text-[#FF5C8A] shadow-xs' : ''}`}
          >
            목록 (4)
          </button>
          <button
            type="button"
            onClick={() => setIsEmptyState(true)}
            className={`px-2 py-1 rounded-md transition-colors ${isEmptyState ? 'bg-white text-[#FF5C8A] shadow-xs' : ''}`}
          >
            빈 상태
          </button>
        </div>
      </div>

      {/* 2. Content: Either Grid of Photos or Empty State */}
      {!isEmptyState ? (
        /* Saved List Grid (저장 목록 그리드) */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {DUMMY_PHOTOS.map((photo) => (
              <a
                key={photo.id}
                href="#/result"
                className="bg-white rounded-[16px] border border-[#222222]/8 p-2.5 shadow-xs hover:border-[#FF5C8A]/50 active:scale-[0.98] transition-all flex flex-col justify-between group"
              >
                {/* 4-cut vertical strip representation */}
                <div
                  className="w-full h-[180px] rounded-xl p-1.5 flex flex-col justify-between mb-2 shadow-inner bg-[#FFEBF1] border"
                  style={{ borderColor: `${photo.frameColor}50` }}
                >
                  <div className="space-y-1">
                    <div className="w-full h-[32px] bg-white rounded-xs shadow-xs flex items-center justify-center text-xs">
                      ✌️
                    </div>
                    <div className="w-full h-[32px] bg-white rounded-xs shadow-xs flex items-center justify-center text-xs">
                      🫶
                    </div>
                    <div className="w-full h-[32px] bg-white rounded-xs shadow-xs flex items-center justify-center text-xs">
                      😎
                    </div>
                    <div className="w-full h-[32px] bg-white rounded-xs shadow-xs flex items-center justify-center text-xs">
                      🎉
                    </div>
                  </div>
                  <div
                    className="text-[7px] font-black text-center pt-1 tracking-wider"
                    style={{ color: photo.frameColor }}
                  >
                    LIFE 4 CUTS
                  </div>
                </div>

                {/* Photo info */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-[#222222]/40">
                    <span className="flex items-center gap-0.5 font-mono">
                      <Calendar className="w-2.5 h-2.5" />
                      {photo.date}
                    </span>
                    <span className="flex items-center gap-0.5 text-[#FF5C8A]">
                      <Heart className="w-2.5 h-2.5 fill-current" />
                      {photo.likes}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#222222] truncate group-hover:text-[#FF5C8A] transition-colors">
                    {photo.title}
                  </h4>
                  <p className="text-[10px] text-[#222222]/50 truncate">
                    {photo.frameName}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {/* Floating or bottom quick action */}
          <div className="pt-2">
            <a
              href="#/capture"
              className="w-full h-[52px] bg-[#FFEBF1] text-[#FF5C8A] hover:bg-[#FFD4E2] active:scale-[0.98] font-bold text-sm rounded-[16px] flex items-center justify-center gap-2 border border-[#FF5C8A]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>새로운 네컷 촬영하기</span>
            </a>
          </div>
        </div>
      ) : (
        /* Empty State (빈 상태 문구 및 액션) */
        <div className="rounded-[16px] border-2 border-dashed border-[#222222]/15 bg-white/50 p-8 flex flex-col items-center justify-center text-center my-6">
          <div className="w-16 h-16 rounded-full bg-[#FFEBF1] text-[#FF5C8A] flex items-center justify-center mb-3 shadow-xs">
            <ImageIcon className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-black text-[#222222]">
            아직 저장된 네컷 사진이 없어요
          </h3>
          <p className="text-xs text-[#222222]/55 mt-1.5 max-w-[240px] leading-relaxed">
            나만의 감성 프레임을 고르고 촬영하여 소중한 추억을 첫 사진으로 간직해보세요!
          </p>

          {/* Core Action in Empty State (52px height) */}
          <div className="w-full mt-6">
            <a
              href="#/capture"
              className="w-full h-[52px] bg-[#FF5C8A] hover:bg-[#E84575] active:scale-[0.98] text-white font-bold text-base rounded-[16px] flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C8A]/25 transition-all"
            >
              <Camera className="w-5 h-5 stroke-[2.2]" />
              <span>사진 찍으러 가기</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
