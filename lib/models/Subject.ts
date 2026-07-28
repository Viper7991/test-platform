import mongoose, { Schema, models, model } from "mongoose";

const SubjectSchema = new Schema({
  name: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  questionCount: { type: Number, default: 50 },
  timerSeconds: { type: Number, default: 3000 },
  autoSubmitOnExpiry: { type: Boolean, default: true },
});

export default models.Subject || model("Subject", SubjectSchema);