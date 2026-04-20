import React from 'react';

export const ConfidenceBadge = ({ confidence }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let dotColor = 'bg-gray-400';
  let text = 'Connecting...';

  if (confidence === 'high') {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
    dotColor = 'bg-green-500';
    text = 'Live data';
  } else if (confidence === 'medium') {
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-800';
    dotColor = 'bg-amber-500';
    text = 'Partial data';
  } else if (confidence === 'low') {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    dotColor = 'bg-red-500';
    text = 'Estimated';
  }

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border border-black/5 ${bgColor} ${textColor}`}>
      <span className={`w-2 h-2 rounded-full mr-1.5 ${dotColor} ${confidence === 'high' ? 'animate-pulse' : ''}`} aria-hidden="true"></span>
      {text}
    </div>
  );
};
