import { User } from "../models/user.model.js";
import { SocialPost } from "../models_new/SocialPost.js";
import { SocialHashtag } from "../models_new/SocialHashtag.js";

const USER_SELECT = "fullname currentRole profile.profilePhoto profile.headline profile.companyName profile.skills profile.verificationStatus";

export const globalSearch = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "all");
    if (!q) {
      return res.json({ success: true, results: { posts: [], people: [], companies: [], hashtags: [], projects: [], certificates: [] } });
    }

    const query = q.toLowerCase();
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 10)));
    const results = { posts: [], people: [], companies: [], hashtags: [], projects: [], certificates: [] };

    const userFound = await User.findOne({
      $or: [
        { fullname: { $regex: `^${escaped(query)}`, $options: "i" } },
        { email: { $regex: `^${escaped(query)}`, $options: "i" } },
      ],
    });

    const [people, hashtags, companies] = await Promise.all([
      User.find({
        $or: [
          { fullname: { $regex: escaped(query), $options: "i" } },
          { "profile.headline": { $regex: escaped(query), $options: "i" } },
          { "profile.companyName": { $regex: escaped(query), $options: "i" } },
          { "profile.skills": { $regex: escaped(query), $options: "i" } },
        ],
        profileCompleted: true,
      })
        .limit(limit)
        .select(USER_SELECT)
        .lean(),
      SocialHashtag.find({ name: { $regex: `^${escaped(query)}`, $options: "i" } })
        .sort({ postCount: -1 })
        .limit(limit)
        .lean(),
      User.find({ "profile.companyName": { $regex: escaped(query), $options: "i" }, currentRole: "recruiter" })
        .limit(limit)
        .select("fullname profile.companyName profile.companyLogo profile.industry profile.companySize")
        .lean(),
    ]);

    results.people = people;
    results.hashtags = hashtags;
    results.companies = companies.filter((c) => c.profile?.companyName);

    if (["all", "posts", "projects", "certificates"].includes(type)) {
      const postFilter = {
        status: "active",
        $or: [
          { contentText: { $regex: escaped(query), $options: "i" } },
          { hashtags: { $regex: `^${escaped(query)}`, $options: "i" } },
          { "project.name": { $regex: escaped(query), $options: "i" } },
          { "project.techStack": { $regex: escaped(query), $options: "i" } },
          { hiring: { title: { $regex: escaped(query), $options: "i" } } },
          { "certificate.name": { $regex: escaped(query), $options: "i" } },
        ],
      };

      if (userFound) {
        postFilter.$or.push({ author: userFound._id });
      }

      const posts = await SocialPost.find(postFilter)
        .sort({ createdAt: -1 })
        .limit(limit * 3)
        .populate({ path: "author", select: USER_SELECT })
        .lean();

      if (type === "posts" || type === "all") results.posts = posts.slice(0, limit);
      if (type === "projects") results.projects = posts.filter((p) => p.type === "project" || p.type === "portfolio" || p.type === "github").slice(0, limit);
      if (type === "certificates") results.certificates = posts.filter((p) => p.type === "certificate").slice(0, limit);
    }

    return res.json({ success: true, query: q, results });
  } catch (error) {
    console.error("Error in globalSearch:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

function escaped(q) {
  return String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}