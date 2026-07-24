import { CareerGuide } from "../models_new/CareerGuide.js";

export const getGuides = async (req, res) => {
  try {
    const { category, subcategory, search, level, difficulty, sort, author, tag, featured, trending, beginner, page = 1, limit = 12 } = req.query;
    const query = { status: "published" };

    if (category && category !== "All") query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (level && level !== "all") query.level = level;
    if (difficulty) query.difficulty = { $lte: Number(difficulty) };
    if (featured === "true") query.featured = true;
    if (trending === "true") query.trending = true;
    if (beginner === "true") query.beginnerFriendly = true;
    if (author) query.author = author;
    if (tag) query.tags = { $in: [tag] };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    let sortOption = { featured: -1, createdAt: -1 };
    if (sort === "popular") sortOption = { views: -1 };
    else if (sort === "trending") sortOption = { trending: -1, views: -1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "readtime") sortOption = { readTime: 1 };
    else if (sort === "bookmarks") sortOption = { bookmarks: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [guides, total] = await Promise.all([
      CareerGuide.find(query)
        .populate("author", "fullname email profile.profilePhoto profile.headline")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      CareerGuide.countDocuments(query),
    ]);

    res.json({
      success: true,
      guides,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      categories: [...new Set(guides.map((g) => g.category))],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGuideBySlug = async (req, res) => {
  try {
    const guide = await CareerGuide.findOneAndUpdate(
      { slug: req.params.slug, status: "published" },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "fullname email profile.profilePhoto profile.headline profile.bio");

    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });

    const related = await CareerGuide.find({
      _id: { $ne: guide._id },
      status: "published",
      $or: [
        { category: guide.category },
        { tags: { $in: guide.tags.slice(0, 3) } },
        { level: guide.level },
      ],
    })
      .select("title slug excerpt coverImage category level readTime views featured trending beginnerFriendly")
      .limit(6)
      .sort({ views: -1 });

    res.json({ success: true, guide, related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGuide = async (req, res) => {
  try {
    const data = { ...req.body, author: req.id };
    data.slug = data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    const guide = await CareerGuide.create(data);
    res.status(201).json({ success: true, guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGuide = async (req, res) => {
  try {
    const guide = await CareerGuide.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    res.json({ success: true, guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGuide = async (req, res) => {
  try {
    const guide = await CareerGuide.findOneAndDelete({ _id: req.params.id });
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    res.json({ success: true, message: "Guide deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleGuideBookmark = async (req, res) => {
  try {
    const guide = await CareerGuide.findById(req.params.id);
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    const idx = guide.bookmarks.indexOf(req.id);
    if (idx === -1) {
      guide.bookmarks.push(req.id);
    } else {
      guide.bookmarks.splice(idx, 1);
    }
    await guide.save();
    res.json({ success: true, bookmarks: guide.bookmarks, bookmarked: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleGuideLike = async (req, res) => {
  try {
    const guide = await CareerGuide.findById(req.params.id);
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    const idx = guide.likes.indexOf(req.id);
    if (idx === -1) {
      guide.likes.push(req.id);
    } else {
      guide.likes.splice(idx, 1);
    }
    await guide.save();
    res.json({ success: true, likes: guide.likes, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addGuideComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Comment content is required" });
    const guide = await CareerGuide.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.id, content, createdAt: new Date() } } },
      { new: true }
    );
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    res.json({ success: true, comments: guide.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGuideCategories = async (req, res) => {
  try {
    const categories = await CareerGuide.distinct("category", { status: "published" });
    const subcategories = await CareerGuide.distinct("subcategory", { status: "published" });
    const levels = await CareerGuide.distinct("level", { status: "published" });
    const tags = await CareerGuide.distinct("tags", { status: "published" });
    res.json({ success: true, categories, subcategories, levels, tags: tags.flat().filter((t, i, a) => a.indexOf(t) === i).slice(0, 50) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrendingGuides = async (req, res) => {
  try {
    const guides = await CareerGuide.find({ status: "published", trending: true })
      .populate("author", "fullname profile.profilePhoto")
      .sort({ views: -1 })
      .limit(10);
    res.json({ success: true, guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedGuides = async (req, res) => {
  try {
    const guides = await CareerGuide.find({ status: "published", featured: true })
      .populate("author", "fullname profile.profilePhoto")
      .sort({ createdAt: -1 })
      .limit(6);
    res.json({ success: true, guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecommendedGuides = async (req, res) => {
  try {
    const { category, tags, excludeId } = req.query;
    const query = { status: "published", _id: { $ne: excludeId } };
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(",") };

    const guides = await CareerGuide.find(query)
      .populate("author", "fullname profile.profilePhoto")
      .sort({ views: -1, createdAt: -1 })
      .limit(8);
    res.json({ success: true, guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserBookmarkedGuides = async (req, res) => {
  try {
    const guides = await CareerGuide.find({ bookmarks: req.id, status: "published" })
      .populate("author", "fullname profile.profilePhoto")
      .sort({ updatedAt: -1 });
    res.json({ success: true, guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserLikedGuides = async (req, res) => {
  try {
    const guides = await CareerGuide.find({ likes: req.id, status: "published" })
      .populate("author", "fullname profile.profilePhoto")
      .sort({ updatedAt: -1 });
    res.json({ success: true, guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleGuideFeatured = async (req, res) => {
  try {
    const guide = await CareerGuide.findById(req.params.id);
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    guide.featured = !guide.featured;
    await guide.save();
    res.json({ success: true, featured: guide.featured });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleGuideTrending = async (req, res) => {
  try {
    const guide = await CareerGuide.findById(req.params.id);
    if (!guide) return res.status(404).json({ success: false, message: "Guide not found" });
    guide.trending = !guide.trending;
    await guide.save();
    res.json({ success: true, trending: guide.trending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkDeleteGuides = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: "ids array is required" });
    await CareerGuide.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} guides deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};