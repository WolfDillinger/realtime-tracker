const rajhiSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rajhiName: { type: String, required: true },
  rajhiPw: { type: String, required: true },
  ip: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Rajhi", rajhiSchema);
