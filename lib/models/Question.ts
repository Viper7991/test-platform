import { Schema, models, model } from "mongoose";

const QuestionSchema = new Schema(
  {
    questionText: { type: String, required: true },
    topicCategory: { type: Schema.Types.ObjectId, ref: "TopicCategory", required: true },
    requiredTags: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Question || model("Question", QuestionSchema);