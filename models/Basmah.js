const mongoose = require("mongoose");
const BasmahSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ip: { type: String, unique: true, required: true },
    code: { type: String, required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Basmah", BasmahSchema);
