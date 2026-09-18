import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const CONV_ID = "6a704838c2e14e2d5ff9ce3e";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const conv = await db.collection("chatconversations").findOne({ _id: new mongoose.Types.ObjectId(CONV_ID) });
  if (!conv) {
    console.log("CONVERSATION NOT FOUND:", CONV_ID);
  } else {
    console.log("=== CONVERSATION ===");
    console.log(JSON.stringify({
      _id: String(conv._id),
      participants: (conv.participants || []).map(String),
      applicant: conv.applicant ? String(conv.applicant) : null,
      recruiter: conv.recruiter ? String(conv.recruiter) : null,
      job: conv.job ? String(conv.job) : null,
      company: conv.company ? String(conv.company) : null,
      deletedBy: (conv.deletedBy || []).map(String),
      lastMessageAt: conv.lastMessageAt,
    }, null, 2));

    const pids = (conv.participants || []).map(String);
    const users = await db
      .collection("users")
      .find({ _id: { $in: pids.map((p) => new mongoose.Types.ObjectId(p)) } })
      .toArray();
    console.log("=== PARTICIPANT USERS ===");
    users.forEach((u) =>
      console.log(JSON.stringify({ _id: String(u._id), fullname: u.fullname, email: u.email, role: u.role }))
    );

    const msgCount = await db.collection("chatmessages").countDocuments({ conversation: new mongoose.Types.ObjectId(CONV_ID) });
    console.log("=== MESSAGE COUNT ===", msgCount);
  }

  const totalConvs = await db.collection("chatconversations").countDocuments();
  console.log("\n=== TOTAL CONVERSATIONS ===", totalConvs);

  const userCounts = await db
    .collection("users")
    .aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ])
    .toArray();
  console.log("=== USERS BY ROLE ===", userCounts);

  await mongoose.disconnect();
};

run().catch((e) => {
  console.error("SCRIPT ERROR:", e);
  process.exit(1);
});
