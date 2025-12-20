import React from 'react';

// 扁平化半圆打孔，移除任何阴影，实现纯粹的切割感
export const Notch = ({ className = "" }: { className?: string }) => (
  <div 
    className={`w-8 h-8 rounded-full absolute z-30 bg-texture pointer-events-none ${className}`} 
  />
);

// 虚线装饰
export const DashedLine = ({ vertical = false, className = "" }: { vertical?: boolean, className?: string }) => (
  <div className={`${vertical ? 'h-full w-[0px] border-l-2' : 'w-full h-[0px] border-t-2'} border-dashed border-stone-300 ${className}`} />
);

export const TicketBase: React.FC<{ children: React.ReactNode; className?: string; color?: string; }> = ({ children, className = "", color = "bg-paper" }) => {
  return <div className={`${color} text-ink relative ${className}`}>{children}</div>;
};

export const BarcodeHorizontal = ({ className = "" }: { className?: string }) => (
    <div className={`flex justify-center gap-[3px] h-8 ${className}`}>
        {[...Array(30)].map((_, i) => (
            <div key={i} className={`bg-ink h-full ${Math.random() > 0.5 ? 'w-[3px]' : 'w-[1px]'}`} />
        ))}
    </div>
);

export const BarcodeVertical = () => (
    <div className="flex flex-col gap-[2px] w-full h-full opacity-70">
        {[...Array(15)].map((_, i) => (
            <div key={i} className={`bg-ink w-full ${Math.random() > 0.6 ? 'h-2' : 'h-[2px]'}`} />
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