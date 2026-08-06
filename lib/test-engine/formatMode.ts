type Category = { _id: string; label: string };

export function formatModeLabel(mode: string, categories: Category[]): string {
  if (mode === "mixed") return "Mixed Test";
  if (mode === "marked") return "Marked Questions Test";
  if (mode.startsWith("topic:")) {
    const id = mode.slice("topic:".length);
    const cat = categories.find((c) => c._id === id);
    return cat ? `Topic: ${cat.label}` : "Topic Test";
  }
  return mode;
}