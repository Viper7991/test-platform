import { Schema, models, model } from "mongoose";

const AdminSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

export default models.Admin || model("Admin", AdminSchema);