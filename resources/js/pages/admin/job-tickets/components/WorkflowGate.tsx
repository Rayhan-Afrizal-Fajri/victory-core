import React from 'react';
// import { Button } from '@/components/ui/button';

export const WorkflowGate: React.FC<{ reason: string }> = ({ reason }) => {
  return (
    <div className="border border-dashed border-gray-200 rounded-md p-4 text-center">
      <p className="text-sm text-gray-600">{reason}</p>
      <div className="mt-3">
        {/* <Button variant="ghost" onClick={() => {}}>
          Minta Akses
        </Button> */}
      </div>
    </div>
  );
};

export default WorkflowGate;
