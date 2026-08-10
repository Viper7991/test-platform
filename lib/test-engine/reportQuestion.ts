export async function reportQuestion(params: {
  questionId?: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  source: "test" | "review";
}) {
  const reason = window.prompt(
    "What's wrong with this question? (optional — leave blank to just flag it)"
  );
  if (reason === null) return false; // user clicked Cancel

  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, reason }),
  });

  return res.ok;
}