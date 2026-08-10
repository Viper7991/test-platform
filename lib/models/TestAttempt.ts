import { Schema, models, model } from "mongoose";

const AnswerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    selected: { type: String, default: null },
    isCorrect: { type: Boolean, required: true },
    options: [{ type: String }],
  },
  { _id: false }
);

const TestAttemptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    testId: { type: String, required: true }, // matches the client-generated testId, used to prevent duplicate sync
    mode: { type: String, required: true },
    reattemptOf: { type: String, default: null },
    startedAt: { type: Number, required: true },
    submittedAt: { type: Number },
    autoSubmitted: { type: Boolean, default: false },
    answers: [AnswerSchema],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    timeTakenSeconds: { type: Number, required: true },
  },
  { timestamps: true }
);

TestAttemptSchema.index({ user: 1, testId: 1 }, { unique: true }); // prevents double-sync of the same attempt

export default models.TestAttempt || model("TestAttempt", TestAttemptSchema);