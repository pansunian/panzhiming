import React from 'react';

// 经典的半圆打孔，使用 bg-texture 确保与页面背景（噪声）完美融合
export const Notch = ({ className = "" }: { className?: string }) => (
  <div 
    className={`w-8 h-8 rounded-full absolute z-10 bg-texture ${className}`} 
  />
);

// 虚线装饰
export const DashedLine = ({ vertical = false, className = "" }: { vertical?: boolean, className?: string }) => (
  <div className={`${vertical ? 'h-full w-[1px] border-l-2' : 'w-full h-[1px] border-t-2'} border-dashed border-stone-300 ${className}`} />
);

// 票根基础容器
interface TicketBaseProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export const TicketBase: React.FC<TicketBaseProps> = ({ children, className = "", color = "bg-paper" }) => {
  return (
    <div className={`${color} text-ink relative ${className}`}>
      {children}
    </div>
  );
};

// 各种样式的条形码
export const BarcodeVertical = () => (
    <div className="flex flex-col gap-[2px] w-full h-full opacity-70">
        {[...Array(15)].map((_, i) => (
            <div key={i} className={`bg-ink w-full ${Math.random() > 0.6 ? 'h-2' : 'h-[2px]'}`} />
        ))}
    </div>
);

export const BarcodeHorizontal = ({ className = "" }: { className?: string }) => (
    <div className={`flex gap-[3px] h-8 ${className}`}>
        {[...Array(30)].map((_, i) => (
            <div key={i} className={`bg-ink h-full ${Math.random() > 0.5 ? 'w-[3px]' : 'w-[1px]'}`} />
        ))}
    </div>
);

export const BarcodeSmall = ({ className = "" }: { className?: string }) => (
    <div className={`flex justify-between w-full overflow-hidden ${className}`}>
        {[...Array(20)].map((_, i) => (
            <div key={i} className={`bg-ink h-full ${Math.random() > 0.5 ? 'w-[2px]' : 'w-[1px]'}`} />
        ))}
    </div>
);