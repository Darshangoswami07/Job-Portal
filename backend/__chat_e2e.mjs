import mongoose from "mongoose";
import "dotenv/config";
import { createRequire } from "module";
import { User } from "./models/user.model.js";
import { Company } from "./models/company.model.js";
import { Job } from "./models/job.model.js";
import { Application } from "./models/application.model.js";
import { ChatConversation } from "./models_new/ChatConversation.js";
import { ChatMessage } from "./models_new/ChatMessage.js";

const requireFront = createRequire("D:/Job-Pilot-web/frontend/package.json");
const { io: ioClient } = requireFront("socket.io-client");

const BASE = "http://localhost:8000/api/v1";
const SOCKET = "http://localhost:8000";

const results = [];
const ok = (name) => results.push({ name, pass: true });
const fail = (name, detail) => results.push({ name, pass: false, detail });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const http = async (method, path, { token, body, form } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data };
};

const makeSocket = (token) =>
  new Promise((resolve, reject) => {
    const s = ioClient(SOCKET, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
      timeout: 4000,
    });
    s.once("connect", () => resolve(s));
    s.once("connect_error", (err) => reject(err));
  });

const listen = (socket, event, timeout = 4000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`timeout waiting for ${event}`));
    }, timeout);
    const handler = (payload) => {
      clearTimeout(t);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });

const uid = Date.now();
const suffix = uid % 100000;
const recruiterEmail = `chatr${suffix}@test.com`;
const applicantEmail = `chata${suffix}@test.com`;
const intruderEmail = `chati${suffix}@test.com`;
const PASSWORD = "Test@12345";

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });

  await User.deleteMany({ email: { $in: [recruiterEmail, applicantEmail, intruderEmail] } });

  // 1. Register users (register returns no token, so login after)
  const reg = (email) =>
    http("POST", "/user/register", {
      body: { fullname: email.split("@")[0], email, phoneNumber: 9999999000, password: PASSWORD },
    });
  const recR = await reg(recruiterEmail);
  const appR = await reg(applicantEmail);
  const intrR = await reg(intruderEmail);

  const login = (email) =>
    http("POST", "/user/login", { body: { email, password: PASSWORD } });
  const rec = await login(recruiterEmail);
  const app = await login(applicantEmail);
  const intr = await login(intruderEmail);

  const recruiterToken = rec.data.token;
  const applicantToken = app.data.token;
  const intruderToken = intr.data.token;
  const recruiterId = String(rec.data.user._id);
  const applicantId = String(app.data.user._id);
  const intruderId = String(intr.data.user._id);

  if (recruiterToken && applicantToken && intruderToken && recruiterId && applicantId && intruderId) {
    ok("register+login 3 users");
  } else {
    fail("register+login 3 users", JSON.stringify({ rec: rec.data, app: app.data, intr: intr.data }));
  }

  // 2. Create company + job (recruiter owns job)
  const company = await Company.create({
    name: "Chat Test Co",
    description: "test",
    userId: new mongoose.Types.ObjectId(recruiterId),
  });
  const job = await Job.create({
    title: "Chat Test Role",
    description: "testing chat",
    salary: 1200000,
    experienceLevel: 3,
    location: "Remote",
    jobType: "Full-time",
    workType: "Remote",
    position: 2,
    company: company._id,
    created_by: new mongoose.Types.ObjectId(recruiterId),
    isActive: true,
  });

  // 3. Applicant applies
  const applyRes = await http("GET", `/application/apply/${job._id}`, { token: applicantToken });
  const applicationId = applyRes.data?.application?._id;
  if (applicationId) {
    ok("applicant applies (application created)");
  } else {
    fail("applicant applies", JSON.stringify(applyRes.data));
    return;
  }

  // 4. Create conversation (applicant)
  const convRes = await http("POST", "/chat/conversations", {
    token: applicantToken,
    body: { applicationId },
  });
  const conversationId = convRes.data?.conversation?._id;
  if (conversationId) {
    ok(`create conversation (${conversationId})`);
  } else {
    fail("create conversation", JSON.stringify(convRes.data));
    return;
  }

  // Duplicate conversation must return the SAME one
  const dupRes = await http("POST", "/chat/conversations", {
    token: applicantToken,
    body: { applicationId },
  });
  if (dupRes.data?.conversation?._id === conversationId) {
    ok("duplicate conversation prevented (reuses existing)");
  } else {
    fail("duplicate conversation prevented", JSON.stringify(dupRes.data));
  }

  // 5. Connect sockets
  let recruiterSocket, applicantSocket, intruderSocket;
  try {
    recruiterSocket = await makeSocket(recruiterToken);
    applicantSocket = await makeSocket(applicantToken);
    intruderSocket = await makeSocket(intruderToken);
    ok("3 socket connections");
  } catch (e) {
    fail("socket connections", e.message);
  }

  // presence: applicant should see recruiter online once connected (both in "presence" room)
  const presenceP = listen(recruiterSocket, "chat:presence", 6000);
  const presence = await presenceP.catch(() => null);
  if (presence && presence.online === true) {
    ok("presence broadcast (online)");
  } else {
    fail("presence broadcast", JSON.stringify(presence));
  }

  // join conversation rooms
  const joinRoom = (s) =>
    new Promise((resolve) => s.emit("chat:join", conversationId, (r) => resolve(r)));
  const [r1, r2] = [await joinRoom(recruiterSocket), await joinRoom(applicantSocket)];
  if (r1?.ok && r2?.ok) {
    ok("both parties join conversation room");
  } else {
    fail("join conversation room", JSON.stringify({ r1, r2 }));
  }

  // 6. Applicant sends message -> recruiter receives via socket
  const recvMsgP = listen(recruiterSocket, "chat:message", 5000);
  const deliveredP = listen(applicantSocket, "message_delivered", 5000);
  const sendRes = await http("POST", `/chat/conversations/${conversationId}/messages`, {
    token: applicantToken,
    body: { body: "Hello recruiter, this is a test message", type: "text" },
  });
  if (sendRes.status === 201 && sendRes.data?.message?._id) {
    ok("applicant sends text message (201)");
  } else {
    fail("applicant sends text message", JSON.stringify({ status: sendRes.status, data: sendRes.data }));
  }
  const recvMsg = await recvMsgP.catch(() => null);
  if (recvMsg && String(recvMsg.body) === "Hello recruiter, this is a test message") {
    ok("recruiter receives message via socket instantly");
  } else {
    fail("recruiter receives message via socket", JSON.stringify(recvMsg));
  }

  // 6b. Delivery status: sender gets message_delivered (recipient online) and deliveredTo includes recipient
  let firstMsgId = sendRes.data?.message?._id;
  const deliveredEvt = await deliveredP.catch(() => null);
  const deliveredInResponse = (sendRes.data?.message?.deliveredTo || []).some(
    (r) => String(r?._id || r) === recruiterId
  );
  if (deliveredEvt && deliveredEvt.messageIds?.includes(String(firstMsgId)) && deliveredInResponse) {
    ok("message delivered (double gray tick) - deliveredTo updated + message_delivered emitted");
  } else {
    fail("message delivered", JSON.stringify({ evt: deliveredEvt, deliveredInResponse }));
  }

  // 6c. Reply message: replyTo populated
  const replyMsg = await http("POST", `/chat/conversations/${conversationId}/messages`, {
    token: applicantToken,
    body: { body: "A reply referencing you", type: "text", replyTo: firstMsgId },
  });
  if (replyMsg.status === 201 && replyMsg.data?.message?.replyTo?._id === firstMsgId) {
    ok("replyTo message populated");
  } else {
    fail("replyTo message", JSON.stringify({ status: replyMsg.status, data: replyMsg.data?.message }));
  }

  // 6d. Message pin toggle
  if (firstMsgId) {
    const pinOn = await http("POST", `/chat/messages/${firstMsgId}/pin`, { token: applicantToken });
    const pinned = (pinOn.data?.message?.pinnedBy || []).some((p) => String(p?._id || p) === applicantId);
    const pinOff = await http("POST", `/chat/messages/${firstMsgId}/pin`, { token: applicantToken });
    const unpinned = !(pinOff.data?.message?.pinnedBy || []).some((p) => String(p?._id || p) === applicantId);
    if (pinOn.status === 200 && pinned && unpinned) {
      ok("message pin toggle");
    } else {
      fail("message pin toggle", JSON.stringify({ pinOn: pinOn.status, pinned, unpinned }));
    }
  }

  // 7. Recruiter replies -> applicant receives
  const recvReplyP = listen(applicantSocket, "chat:message", 5000);
  const replyRes = await http("POST", `/chat/conversations/${conversationId}/messages`, {
    token: recruiterToken,
    body: { body: "Thanks for applying!", type: "text" },
  });
  if (replyRes.status === 201) {
    ok("recruiter sends reply (201)");
  } else {
    fail("recruiter sends reply", JSON.stringify(replyRes.data));
  }
  const recvReply = await recvReplyP.catch(() => null);
  if (recvReply && String(recvReply.body) === "Thanks for applying!") {
    ok("applicant receives reply via socket instantly");
  } else {
    fail("applicant receives reply via socket", JSON.stringify(recvReply));
  }

  // 8. Empty message blocked
  const emptyRes = await http("POST", `/chat/conversations/${conversationId}/messages`, {
    token: applicantToken,
    body: { body: "   ", type: "text" },
  });
  if (emptyRes.status === 400) {
    ok("empty message blocked (400)");
  } else {
    fail("empty message blocked", JSON.stringify({ status: emptyRes.status, data: emptyRes.data }));
  }

  // 9. Typing indicator
  const typingP = listen(recruiterSocket, "chat:typing", 4000);
  applicantSocket.emit("chat:typing", { conversationId, isTyping: true });
  const typing = await typingP.catch(() => null);
  if (typing && typing.isTyping === true && String(typing.userId) === applicantId) {
    ok("typing indicator delivered");
  } else {
    fail("typing indicator", JSON.stringify(typing));
  }

  // 10. PDF upload
  const pdfBytes = Buffer.from("%PDF-1.4 test chat attachment".repeat(40));
  const pdfForm = new FormData();
  pdfForm.append("files", new Blob([pdfBytes], { type: "application/pdf" }), "test-doc.pdf");
  const upRes = await http("POST", "/chat/upload", { token: applicantToken, form: pdfForm });
  const pdfFile = upRes.data?.files?.[0];
  if (upRes.status === 201 && pdfFile?.url && pdfFile?.mimeType === "application/pdf") {
    ok(`PDF upload -> ${pdfFile.resourceType}/${pdfFile.url.split("/").pop()}`);
  } else {
    fail("PDF upload", JSON.stringify({ status: upRes.status, data: upRes.data }));
  }

  // 11. ZIP upload (application/zip)
  const zipBytes = Buffer.from("PK\x03\x04 test zip");
  const zipForm = new FormData();
  zipForm.append("files", new Blob([zipBytes], { type: "application/zip" }), "bundle.zip");
  const zipRes = await http("POST", "/chat/upload", { token: applicantToken, form: zipForm });
  if (zipRes.status === 201) {
    ok("ZIP upload accepted");
  } else {
    fail("ZIP upload", JSON.stringify({ status: zipRes.status, data: zipRes.data }));
  }

  // 11b. Extension fallback: .zip with generic octet-stream mimetype must still pass
  const zipForm2 = new FormData();
  zipForm2.append("files", new Blob([zipBytes], { type: "application/octet-stream" }), "fallback.zip");
  const zipRes2 = await http("POST", "/chat/upload", { token: applicantToken, form: zipForm2 });
  if (zipRes2.status === 201) {
    ok("extension-based MIME fallback accepted");
  } else {
    fail("extension-based MIME fallback", JSON.stringify({ status: zipRes2.status, data: zipRes2.data }));
  }

  // 11c. .svg must be rejected (script injection risk)
  const svgForm = new FormData();
  svgForm.append("files", new Blob([Buffer.from("<svg onload=alert(1)></svg>")], { type: "image/svg+xml" }), "bad.svg");
  const svgRes = await http("POST", "/chat/upload", { token: applicantToken, form: svgForm });
  if (svgRes.status === 400) {
    ok("svg rejected (XSS guard)");
  } else {
    fail("svg rejected (XSS guard)", JSON.stringify({ status: svgRes.status, data: svgRes.data }));
  }

  // 12. Disallowed type (.exe)
  const exeForm = new FormData();
  exeForm.append("files", new Blob([Buffer.from("MZ....")], { type: "application/octet-stream" }), "virus.exe");
  const exeRes = await http("POST", "/chat/upload", { token: applicantToken, form: exeForm });
  if (exeRes.status === 400 && /Unsupported/i.test(exeRes.data?.message || "")) {
    ok("disallowed .exe rejected");
  } else {
    fail("disallowed .exe rejected", JSON.stringify({ status: exeRes.status, data: exeRes.data }));
  }

  // 13. Oversized file (>20MB)
  const bigForm = new FormData();
  bigForm.append("files", new Blob([Buffer.alloc(21 * 1024 * 1024)], { type: "application/pdf" }), "big.pdf");
  const bigRes = await http("POST", "/chat/upload", { token: applicantToken, form: bigForm });
  if (bigRes.status === 413 || bigRes.status === 400) {
    ok(`oversized file rejected (${bigRes.status})`);
  } else {
    fail("oversized file rejected", JSON.stringify({ status: bigRes.status, data: bigRes.data }));
  }

  // 14. Message with attachment
  if (pdfFile) {
    const attachMsg = await http("POST", `/chat/conversations/${conversationId}/messages`, {
      token: applicantToken,
      body: { type: "file", attachment: pdfFile },
    });
    if (attachMsg.status === 201 && attachMsg.data?.message?.attachment?.url) {
      ok("send message with attachment");
    } else {
      fail("send message with attachment", JSON.stringify(attachMsg.data));
    }
  }

  // 15. Invalid conversation id -> should NOT be 500
  const badIdRes = await http("GET", "/chat/conversations/not-a-valid-id", { token: applicantToken });
  if (badIdRes.status === 404 || badIdRes.status === 400) {
    ok("invalid conversation id handled (not 500)");
  } else {
    fail("invalid conversation id", JSON.stringify({ status: badIdRes.status, data: badIdRes.data }));
  }

  // 16. Permissions: intruder
  const intrConv = await http("GET", `/chat/conversations/${conversationId}`, { token: intruderToken });
  const intrMsg = await http("POST", `/chat/conversations/${conversationId}/messages`, {
    token: intruderToken,
    body: { body: "hack", type: "text" },
  });
  const intrConvCreate = await http("POST", "/chat/conversations", {
    token: intruderToken,
    body: { applicationId },
  });
  if (intrConv.status === 403 && intrMsg.status === 403 && intrConvCreate.status === 403) {
    ok("intruder blocked (403) on all chat access");
  } else {
    fail("intruder blocked", JSON.stringify({ conv: intrConv.status, msg: intrMsg.status, create: intrConvCreate.status }));
  }

  // 17. markRead -> readBy + unread cleared + message_seen to sender
  const seenP = listen(applicantSocket, "message_seen", 5000);
  const readRes = await http("POST", `/chat/conversations/${conversationId}/read`, { token: recruiterToken });
  const msgsRes = await http("GET", `/chat/conversations/${conversationId}/messages`, { token: recruiterToken });
  const anyRead = (msgsRes.data?.messages || []).some((m) =>
    (m.readBy || []).some((r) => String(r?._id || r) === recruiterId)
  );
  const seenEvt = await seenP.catch(() => null);
  if (readRes.status === 200 && anyRead) {
    ok("markRead updates readBy");
  } else {
    fail("markRead updates readBy", JSON.stringify({ status: readRes.status, readCount: msgsRes.data?.messages?.length }));
  }
  if (seenEvt && seenEvt.userId === recruiterId && seenEvt.messageIds?.length) {
    ok("message_seen emitted to sender (double blue tick)");
  } else {
    fail("message_seen emitted to sender", JSON.stringify(seenEvt));
  }

  // 18. Reaction toggle
  firstMsgId = msgsRes.data?.messages?.[0]?._id || firstMsgId;
  if (firstMsgId) {
    const reactRes = await http("POST", `/chat/messages/${firstMsgId}/reactions`, {
      token: recruiterToken,
      body: { emoji: "👍" },
    });
    if (reactRes.status === 200 && (reactRes.data?.message?.reactions || []).length > 0) {
      ok("reaction toggled");
    } else {
      fail("reaction toggle", JSON.stringify(reactRes.data));
    }
  }

  // 19. Edit message (sender-only: recruiter edits own reply)
  const recruiterMsg = (msgsRes.data?.messages || []).find((m) => String(m.body) === "Thanks for applying!");
  const recruiterMsgId = recruiterMsg?._id;
  if (recruiterMsgId) {
    const editRes = await http("PATCH", `/chat/messages/${recruiterMsgId}`, {
      token: recruiterToken,
      body: { body: "Edited reply" },
    });
    if (editRes.status === 200 && editRes.data?.message?.isEdited) {
      ok("message edit (own message)");
    } else {
      fail("message edit (own message)", JSON.stringify(editRes.data));
    }

    // editing someone else's message must fail
    const otherEdit = await http("PATCH", `/chat/messages/${firstMsgId}`, {
      token: recruiterToken,
      body: { body: "should not work" },
    });
    if (otherEdit.status === 404) {
      ok("editing others' message blocked");
    } else {
      fail("editing others' message blocked", JSON.stringify({ status: otherEdit.status, data: otherEdit.data }));
    }
  }

  // 20. Delete message (soft)
  if (firstMsgId) {
    const delRes = await http("DELETE", `/chat/messages/${firstMsgId}`, { token: recruiterToken });
    const afterDel = await http("GET", `/chat/conversations/${conversationId}/messages`, { token: recruiterToken });
    const stillThere = (afterDel.data?.messages || []).some((m) => String(m._id) === String(firstMsgId));
    if (delRes.status === 200 && !stillThere) {
      ok("message soft-deleted for sender");
    } else {
      fail("message soft-delete", JSON.stringify({ status: delRes.status, stillThere }));
    }
  }

  // 21. Pin / Archive / Mute (frontend action format: pin:add)
  const pinRes = await http("PATCH", `/chat/conversations/${conversationId}`, {
    token: recruiterToken,
    body: { action: "pin:add" },
  });
  const archRes = await http("PATCH", `/chat/conversations/${conversationId}`, {
    token: recruiterToken,
    body: { action: "archive:add" },
  });
  const muteRes = await http("PATCH", `/chat/conversations/${conversationId}`, {
    token: recruiterToken,
    body: { action: "mute:add" },
  });
  if (pinRes.status === 200 && pinRes.data?.conversation?.isPinned && archRes.data?.conversation?.isArchived && muteRes.data?.conversation?.isMuted) {
    ok("pin/archive/mute");
  } else {
    fail("pin/archive/mute", JSON.stringify({ pin: pinRes.data, arch: archRes.data, mute: muteRes.data }));
  }

  // 21b. unpin
  const unpinRes = await http("PATCH", `/chat/conversations/${conversationId}`, {
    token: recruiterToken,
    body: { action: "pin:remove" },
  });
  if (unpinRes.status === 200 && unpinRes.data?.conversation?.isPinned === false) {
    ok("unpin");
  } else {
    fail("unpin", JSON.stringify(unpinRes.data));
  }

  // 22. Unauthenticated -> 401
  const unauthRes = await http("GET", "/chat/conversations");
  if (unauthRes.status === 401) {
    ok("unauthenticated -> 401");
  } else {
    fail("unauthenticated -> 401", String(unauthRes.status));
  }

  // 23. Reconnect: disconnect applicant, reconnect, still receives + delivery on connect
  applicantSocket.disconnect();
  await wait(300);
  const offlineDeliveredP = listen(recruiterSocket, "message_delivered", 5000);
  const applicantSocket2 = await makeSocket(applicantToken).catch(() => null);
  if (applicantSocket2) {
    await new Promise((res) => applicantSocket2.emit("chat:join", conversationId, () => res()));
    const reP = listen(applicantSocket2, "chat:message", 5000);
    await http("POST", `/chat/conversations/${conversationId}/messages`, {
      token: recruiterToken,
      body: { body: "After reconnect", type: "text" },
    });
    const reMsg = await reP.catch(() => null);
    const offlineDelivered = await offlineDeliveredP.catch(() => null);
    if (reMsg && String(reMsg.body) === "After reconnect") {
      ok("socket reconnect still receives messages");
    } else {
      fail("socket reconnect still receives messages", JSON.stringify(reMsg));
    }
    if (offlineDelivered && offlineDelivered.conversationId === conversationId) {
      ok("delivery marked when recipient reconnects (offline -> delivered)");
    } else {
      fail("delivery marked when recipient reconnects", JSON.stringify(offlineDelivered));
    }
  } else {
    fail("socket reconnect", "could not reconnect");
  }

  // 24. Conversation list includes conversation (for recruiter)
  const listRes = await http("GET", "/chat/conversations", { token: recruiterToken });
  if (listRes.status === 200 && (listRes.data?.conversations || []).some((c) => String(c._id) === String(conversationId))) {
    ok("conversation list includes conversation");
  } else {
    fail("conversation list", JSON.stringify({ status: listRes.status, count: listRes.data?.conversations?.length }));
  }

  // 25. Delete conversation (soft, for applicant)
  const delConvRes = await http("DELETE", `/chat/conversations/${conversationId}`, { token: applicantToken });
  const listAfter = await http("GET", "/chat/conversations", { token: applicantToken });
  const stillListed = (listAfter.data?.conversations || []).some((c) => String(c._id) === String(conversationId));
  if (delConvRes.status === 200 && !stillListed) {
    ok("delete conversation (soft) hides from list");
  } else {
    fail("delete conversation (soft)", JSON.stringify({ status: delConvRes.status, stillListed }));
  }

  // cleanup
  try { recruiterSocket?.disconnect(); } catch {}
  try { applicantSocket2?.disconnect(); } catch {}
  try { intruderSocket?.disconnect(); } catch {}
  await Application.deleteMany({ _id: applicationId });
  await ChatMessage.deleteMany({ conversation: conversationId });
  await ChatConversation.deleteMany({ _id: conversationId });
  await Job.deleteMany({ _id: job._id });
  await Company.deleteMany({ _id: company._id });
  await User.deleteMany({ email: { $in: [recruiterEmail, applicantEmail, intruderEmail] } });
  await mongoose.disconnect();

  const passed = results.filter((r) => r.pass).length;
  console.log("\n===== CHAT E2E RESULTS =====");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  => ${r.detail}` : ""}`);
  }
  console.log(`\n${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
};

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
