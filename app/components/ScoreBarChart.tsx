type Props = {
  correct: number;
  wrong: number;
};

export default function ScoreBarChart({ correct, wrong }: Props) {
  const total = correct + wrong;
  const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongPct = total > 0 ? Math.round((wrong / total) * 100) : 0;
  const maxCount = Math.max(correct, wrong, 1);

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-green-700 font-medium">Correct</span>
          <span>{correct} ({correctPct}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded h-4">
          <div
            className="bg-green-600 h-4 rounded"
            style={{ width: `${(correct / maxCount) * 100}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-red-700 font-medium">Wrong</span>
          <span>{wrong} ({wrongPct}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded h-4">
          <div
            className="bg-red-600 h-4 rounded"
            style={{ width: `${(wrong / maxCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}