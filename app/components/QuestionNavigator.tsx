type Props = {
  totalQuestions: number;
  currentIndex: number;
  visitedIds: Set<string>;
  answeredIds: Set<string>;
  markedIds: Set<string>;
  questionIds: string[]; // ordered list, index matches question position
  onJump: (index: number) => void;
};

export default function QuestionNavigator({
  totalQuestions,
  currentIndex,
  visitedIds,
  answeredIds,
  markedIds,
  questionIds,
  onJump,
}: Props) {
  function getStatus(index: number) {
    const id = questionIds[index];
    const visited = visitedIds.has(id);
    const answered = answeredIds.has(id);
    const marked = markedIds.has(id);

    if (marked && answered) return "marked-answered";
    if (marked) return "marked";
    if (answered) return "answered";
    if (visited) return "skipped";
    return "not-visited";
  }

  const statusStyles: Record<string, string> = {
    "not-visited": "bg-white border-gray-400 text-gray-700",
    skipped: "bg-red-600 border-red-600 text-white",
    answered: "bg-green-600 border-green-600 text-white",
    marked: "bg-purple-600 border-purple-600 text-white",
    "marked-answered": "bg-blue-600 border-blue-600 text-white",
  };

  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm font-medium mb-3">Question Navigator</p>

      <div className="grid grid-cols-10 gap-2 mb-4">
        {Array.from({ length: totalQuestions }).map((_, i) => {
          const status = getStatus(i);
          const isCurrent = i === currentIndex;
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={`aspect-square text-xs rounded border flex items-center justify-center ${statusStyles[status]} ${
                isCurrent ? "ring-2 ring-offset-1 ring-black" : ""
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-white border border-gray-400 inline-block" /> Not Visited</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-600 inline-block" /> Skipped</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-600 inline-block" /> Answered</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-purple-600 inline-block" /> Marked for Review</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Marked & Answered</div>
      </div>
    </div>
  );
}