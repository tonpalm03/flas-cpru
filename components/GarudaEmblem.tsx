"use client";

import React from "react";

interface GarudaEmblemProps {
  className?: string;
  size?: number; // size in pixels or Tailwind classes
  heightCm?: 3 | 1.5; // Official standard height in centimeters: 3cm or 1.5cm
}

/**
 * Official Royal Thai Government Garuda Emblem (ตราครุฑ)
 * Based on the Office of the Prime Minister Regulations on Correspondence Work B.E. 2526
 * Standard heights: 3 cm (standard memo) or 1.5 cm (corner/small memo)
 */
export default function GarudaEmblem({ className = "", size = 64 }: GarudaEmblemProps) {
  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
        aria-label="ตราครุฑ (Garuda Emblem)"
      >
        {/* Crown (ชฎา / มงกุฎ) */}
        <path
          d="M100 8 L104 22 L110 32 L105 35 L108 45 L100 48 L92 45 L95 35 L90 32 L96 22 Z"
          fill="#8B0000"
          stroke="#5C0000"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="12" r="2.5" fill="#D4AF37" />
        <circle cx="100" cy="25" r="2" fill="#D4AF37" />
        <circle cx="100" cy="38" r="2.5" fill="#D4AF37" />

        {/* Head & Face (เศียรและพระพักตร์) */}
        <path
          d="M93 46 C93 46 91 56 94 62 C96 66 100 68 100 68 C100 68 104 66 106 62 C109 56 107 46 107 46 Z"
          fill="#A30000"
          stroke="#5C0000"
          strokeWidth="1.5"
        />
        {/* Beak (จะงอยปาก) */}
        <path
          d="M97 54 Q100 63 100 65 Q100 63 103 54 Q100 56 97 54 Z"
          fill="#D4AF37"
          stroke="#8B7500"
          strokeWidth="1"
        />
        {/* Eyes & Ears */}
        <circle cx="96" cy="51" r="1.5" fill="#FFFFFF" />
        <circle cx="96" cy="51" r="0.8" fill="#000000" />
        <circle cx="104" cy="51" r="1.5" fill="#FFFFFF" />
        <circle cx="104" cy="51" r="0.8" fill="#000000" />
        {/* Ear Ornaments (กุณฑล) */}
        <path d="M91 50 Q88 55 90 60 Q92 56 93 52 Z" fill="#D4AF37" />
        <path d="M109 50 Q112 55 110 60 Q108 56 107 52 Z" fill="#D4AF37" />

        {/* Neck Collar & Torso Jewelry (กรองศอ / ทับทรวง) */}
        <path
          d="M92 64 Q100 70 108 64 Q105 72 100 75 Q95 72 92 64 Z"
          fill="#D4AF37"
          stroke="#8B7500"
          strokeWidth="1"
        />
        <polygon points="100,68 103,73 100,77 97,73" fill="#8B0000" />

        {/* Left Wing (ปีกซ้าย) */}
        <g fill="#A30000" stroke="#5C0000" strokeWidth="1.2" strokeLinejoin="round">
          {/* Main wing curves & layered feathers */}
          <path d="M88 66 C75 50 55 35 30 30 C38 42 48 56 60 70 C48 60 36 50 18 48 C28 62 42 78 56 90 C42 80 28 72 10 72 C24 88 42 104 62 112 C48 106 32 102 18 102 C34 116 54 126 74 130 C62 126 48 124 35 126 C52 138 72 142 88 140 Z" />
          {/* Inner feather featherings */}
          <path d="M85 75 C72 65 58 55 45 52 C52 64 62 76 74 88" fill="none" stroke="#D4AF37" strokeWidth="1" />
          <path d="M82 92 C68 84 52 78 38 78 C48 90 60 102 75 110" fill="none" stroke="#D4AF37" strokeWidth="1" />
          <path d="M80 110 C68 105 52 104 40 106 C52 116 66 122 78 126" fill="none" stroke="#D4AF37" strokeWidth="1" />
        </g>

        {/* Right Wing (ปีกขวา) */}
        <g fill="#A30000" stroke="#5C0000" strokeWidth="1.2" strokeLinejoin="round">
          {/* Main wing curves & layered feathers */}
          <path d="M112 66 C125 50 145 35 170 30 C162 42 152 56 140 70 C152 60 164 50 182 48 C172 62 158 78 144 90 C158 80 172 72 190 72 C176 88 158 104 138 112 C152 106 168 102 182 102 C166 116 146 126 126 130 C138 126 152 124 165 126 C148 138 128 142 112 140 Z" />
          {/* Inner feather featherings */}
          <path d="M115 75 C128 65 142 55 155 52 C148 64 138 76 126 88" fill="none" stroke="#D4AF37" strokeWidth="1" />
          <path d="M118 92 C132 84 148 78 162 78 C152 90 140 102 125 110" fill="none" stroke="#D4AF37" strokeWidth="1" />
          <path d="M120 110 C132 105 148 104 160 106 C148 116 134 122 122 126" fill="none" stroke="#D4AF37" strokeWidth="1" />
        </g>

        {/* Chest & Body (พระอุระ / ลำตัว) */}
        <path
          d="M92 74 C86 82 85 96 88 108 C90 116 95 122 100 125 C105 122 110 116 112 108 C115 96 114 82 108 74 Z"
          fill="#B80000"
          stroke="#5C0000"
          strokeWidth="1.5"
        />
        {/* Chest lines & muscles */}
        <path d="M93 88 Q100 92 107 88" fill="none" stroke="#8B0000" strokeWidth="1.2" />
        <path d="M94 100 Q100 104 106 100" fill="none" stroke="#8B0000" strokeWidth="1.2" />
        <path d="M100 75 L100 124" fill="none" stroke="#8B0000" strokeWidth="1.2" />

        {/* Left Arm & Claws (กรซ้าย) */}
        <g fill="#A30000" stroke="#5C0000" strokeWidth="1.2">
          <path d="M90 74 C78 72 65 74 55 82 C62 86 70 88 78 86 C82 92 86 98 88 104 C92 94 92 84 90 74 Z" />
          {/* Armband (รัดแขน) */}
          <path d="M72 80 L76 86" stroke="#D4AF37" strokeWidth="2" />
          {/* Hand/Claw */}
          <path d="M55 82 Q48 84 46 88 Q52 89 56 87" fill="#D4AF37" />
          <path d="M53 80 Q45 80 43 83 Q49 86 54 83" fill="#D4AF37" />
        </g>

        {/* Right Arm & Claws (กรขวา) */}
        <g fill="#A30000" stroke="#5C0000" strokeWidth="1.2">
          <path d="M110 74 C122 72 135 74 145 82 C138 86 130 88 122 86 C118 92 114 98 112 104 C108 94 108 84 110 74 Z" />
          {/* Armband (รัดแขน) */}
          <path d="M128 80 L124 86" stroke="#D4AF37" strokeWidth="2" />
          {/* Hand/Claw */}
          <path d="M145 82 Q152 84 154 88 Q148 89 144 87" fill="#D4AF37" />
          <path d="M147 80 Q155 80 157 83 Q151 86 146 83" fill="#D4AF37" />
        </g>

        {/* Belt & Waist Garment (ปั้นเหน่ง / รัดเอว / สนับเพลา) */}
        <path
          d="M86 122 Q100 128 114 122 L116 135 Q100 140 84 135 Z"
          fill="#D4AF37"
          stroke="#8B7500"
          strokeWidth="1.2"
        />
        <circle cx="100" cy="128" r="3" fill="#8B0000" />
        {/* Central Hanging Cloth (ชายแครง / ชายไหว) */}
        <path
          d="M96 135 L94 158 L100 164 L106 158 L104 135 Z"
          fill="#D4AF37"
          stroke="#8B7500"
          strokeWidth="1"
        />
        <polygon points="100,138 103,148 100,156 97,148" fill="#8B0000" />

        {/* Tail Feathers (หางครุฑ) */}
        <g fill="#A30000" stroke="#5C0000" strokeWidth="1.2">
          <path d="M96 140 Q88 165 72 188 Q88 178 98 165 Z" />
          <path d="M104 140 Q112 165 128 188 Q112 178 102 165 Z" />
          <path d="M98 145 Q100 175 100 196 Q102 175 102 145 Z" fill="#8B0000" />
          <path d="M94 155 Q80 182 60 192 Q78 184 92 168 Z" />
          <path d="M106 155 Q120 182 140 192 Q122 184 108 168 Z" />
        </g>

        {/* Left Thigh & Leg (แข้งและเล็บเท้าซ้าย) */}
        <g fill="#A30000" stroke="#5C0000" strokeWidth="1.2">
          <path d="M84 132 C78 142 75 155 78 166 C82 168 88 162 90 152 C92 142 90 135 84 132 Z" />
          {/* Claws (กรงเล็บเท้า) */}
          <path d="M78 166 Q70 175 66 182 Q75 178 82 170" fill="#D4AF37" />
          <path d="M80 168 Q75 180 72 188 Q80 182 85 172" fill="#D4AF37" />
          <path d="M83 170 Q80 184 82 192 Q86 183 87 172" fill="#D4AF37" />
        </g>

        {/* Right Thigh & Leg (แข้งและเล็บเท้าขวา) */}
        <g fill="#A30000" stroke="#5C0000" strokeWidth="1.2">
          <path d="M116 132 C122 142 125 155 122 166 C118 168 112 162 110 152 C108 142 110 135 116 132 Z" />
          {/* Claws (กรงเล็บเท้า) */}
          <path d="M122 166 Q130 175 134 182 Q125 178 118 170" fill="#D4AF37" />
          <path d="M120 168 Q125 180 128 188 Q120 182 115 172" fill="#D4AF37" />
          <path d="M117 170 Q120 184 118 192 Q114 183 113 172" fill="#D4AF37" />
        </g>
      </svg>
    </div>
  );
}
