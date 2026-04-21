// University Admin - AI Counselling Page

import React from 'react';
import { CounsellingChat } from '@/features/counselling';

export default function AICounselling() {
  return (
    <div className="h-[calc(100vh-80px)]">
      <CounsellingChat />
    </div>
  );
}