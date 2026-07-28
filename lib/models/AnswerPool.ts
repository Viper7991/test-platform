import { Schema, models, model } from "mongoose";

const AnswerPoolSchema = new Schema({
  value: { type: String, required: true },
  tags: [{ type: String, required: true }],   // e.g. ["female", "ceo", "indian"]
});

export default models.AnswerPool || model("AnswerPool", AnswerPoolSchema);