import React from 'react';

interface Criterion {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

interface CriteriaBreakdownProps {
  criteria: Criterion[];
  scores?: Record<string, number>;
  totalScore?: number;
}

export function CriteriaBreakdown({
  criteria,
  scores = {},
  totalScore,
}: CriteriaBreakdownProps) {
  if (criteria.length === 0) {
    return null;
  }

  const computedTotal = criteria.reduce((sum, criterion) => sum + (scores[criterion.id] || 0), 0);
  const displayTotal = typeof totalScore === 'number' ? totalScore : computedTotal;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">Breakdown tiÃªu chÃ­</p>
        <p className="text-sm font-semibold text-gray-700">Tá»•ng: {displayTotal.toFixed(2)}</p>
      </div>
      <div className="space-y-3">
        {criteria.map((criterion) => {
          const score = scores[criterion.id] || 0;

          return (
            <div key={criterion.id} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-8">
                <p className="text-sm font-medium text-gray-800">{criterion.label}</p>
                {criterion.description && (
                  <p className="text-xs text-gray-500">{criterion.description}</p>
                )}
              </div>
              <div className="col-span-2 text-right text-xs text-gray-500">
                Max {criterion.maxScore}
              </div>
              <div className="col-span-2">
                <div className="rounded-md border border-gray-200 bg-white px-2 py-1 text-right text-sm font-medium text-gray-700">
                  {score.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
