import { Schema, models, model } from "mongoose";

const ReportSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question" },
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    selectedAnswer: { type: String, default: null },
    source: { type: String, enum: ["test", "review"], required: true },
    reason: { type: String, default: "" },
    reporterEmail: { type: String, default: null },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

export default models.Report || model("Report", ReportSchema);