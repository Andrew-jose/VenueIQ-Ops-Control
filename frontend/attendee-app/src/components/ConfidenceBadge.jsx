import React from 'react';

export const ConfidenceBadge = ({ confidence }) => {
  let bgColor = 'bg-[#152124]';
  let textColor = 'text-[#6B8A8D]';
  let dotColor = 'bg-[#6B8A8D]';
  let text = 'Connecting...';

  if (confidence === 'high') {
    bgColor = 'bg-[#0A1A12]';
    textColor = 'text-[#10B981]';
    dotColor = 'bg-[#10B981]';
    text = 'Live data';
  } else if (confidence === 'medium') {
    bgColor = 'bg-[#1A1208]';
    textColor = 'text-[#F59E0B]';
    dotColor = 'bg-[#F59E0B]';
    text = 'Partial data';
  } else if (confidence === 'low') {
    bgColor = 'bg-[#1A0808]';
    textColor = 'text-[#EF4444]';
    dotColor = 'bg-[#EF4444]';
    text = 'Estimated';
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border border-[#1A2E30] ${bgColor} ${textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${dotColor} animate-pulse`} aria-hidden="true"></span>
      {text}
    </div>
  );
};
