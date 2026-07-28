import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function run() {
  const uri = process.env.MONGODB_URI as string;
  await mongoose.connect(uri);

  const AdminSchema = new mongoose.Schema({
    email: String,
    passwordHash: String,
  });
  const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

  const email = "kykrogebe@gmail.com";      // <-- change this
  const plainPassword = "deogao274202"; // <-- change this

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log("Admin already exists for this email.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);
  await Admin.create({ email, passwordHash });

  console.log("Admin created:", email);
  process.exit(0);
}

run();