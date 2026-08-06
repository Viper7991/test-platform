import { Schema, models, model } from "mongoose";

const MarkedQuestionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  questionIds: [{ type: Schema.Types.ObjectId, ref: "Question" }],
});

export default models.MarkedQuestion || model("MarkedQuestion", MarkedQuestionSchema);