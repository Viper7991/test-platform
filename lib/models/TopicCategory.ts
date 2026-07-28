import { Schema, models, model } from "mongoose";

const TopicCategorySchema = new Schema({
  subject: { type: String, required: true },   // e.g. "current-affairs"
  name: { type: String, required: true },        // slug, e.g. "sports"
  label: { type: String, required: true },       // display name, e.g. "Sports"
});

export default models.TopicCategory || model("TopicCategory", TopicCategorySchema);