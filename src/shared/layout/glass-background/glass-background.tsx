import React from 'react';

interface GlassBackgroundProps {

}

export const GlassBackground = () => {
  return (
    <div className="absolute top-[288.72px] left-[-114.09px] h-[413.272px] w-[1033.17px]">
        <div className="absolute inset-[-48.39%_-19.36%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1434 814"
          >
            <g filter="url(#filter0_f_5_659_2)" id="Ellipse 3330" opacity="0.3">
              <ellipse
                cx="716.586"
                cy="406.636"
                fill="url(#paint0_radial_5_659_2)"
                rx="516.586"
                ry="206.636"
              />
            </g>
            <defs>
              <filter
                colorInterpolationFilters="sRGB"
                filterUnits="userSpaceOnUse"
                height="813.272"
                id="filter0_f_5_659_2"
                width="1433.17"
                x="0"
                y="0"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_5_659_2" stdDeviation="100" />
              </filter>
              <radialGradient
                cx="0"
                cy="0"
                gradientTransform="translate(716.586 406.636) rotate(90) scale(206.636 516.586)"
                gradientUnits="userSpaceOnUse"
                id="paint0_radial_5_659_2"
                r="1"
              >
                <stop stopColor="#0BB57F" />
                <stop offset="1" stopColor="#0BB57F" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
  );
};