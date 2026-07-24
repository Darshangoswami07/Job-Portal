import { Blog } from "../models_new/Blog.js";

export const createBlog = async (req, res) => {
  try {
    const data = { ...req.body, author: req.id };
    data.slug = data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    const blog = await Blog.create(data);
    res.status(201).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogs = async (req, res) => {
  try {
    let { category, search, tag, page = 1, limit = 9, featured } = req.query;
    const query = { status: "published" };

    if (category && category !== "All") {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { "author.fullname": { $regex: search, $options: "i" } },
      ];
    }
    if (tag) {
      query.tags = { $in: [tag] };
    }
    if (featured === "true") query.featured = true;

    const skip = (Number(page) - 1) * Number(limit);
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate("author", "fullname email profile.profilePhoto")
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments(query),
    ]);

    const allCategories = await Blog.distinct("category", { status: "published" });

    res.json({
      success: true,
      blogs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      categories: allCategories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("author", "fullname email profile.profilePhoto")
      .populate("comments.user", "fullname profile.profilePhoto");

    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    let prev = null;
    let next = null;
    if (blog.status === "published") {
      [prev, next] = await Promise.all([
        Blog.findOne({ status: "published", createdAt: { $lt: blog.createdAt } })
          .sort({ createdAt: -1 })
          .select("title slug"),
        Blog.findOne({ status: "published", createdAt: { $gt: blog.createdAt } })
          .sort({ createdAt: 1 })
          .select("title slug"),
      ]);
    }

    res.json({ success: true, blog, prev, next });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRelatedBlogs = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: "published" });
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    const related = await Blog.find({
      _id: { $ne: blog._id },
      status: "published",
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } },
      ],
    })
      .populate("author", "fullname profile.profilePhoto")
      .sort({ createdAt: -1 })
      .limit(4)
      .select("title slug excerpt coverImage category readTime views createdAt author");

    res.json({ success: true, blogs: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrendingBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .populate("author", "fullname profile.profilePhoto")
      .sort({ views: -1, likes: -1 })
      .limit(6)
      .select("title slug excerpt coverImage category readTime views likes createdAt author");
    res.json({ success: true, blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecommendedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published", featured: true })
      .populate("author", "fullname profile.profilePhoto")
      .sort({ createdAt: -1 })
      .limit(6)
      .select("title slug excerpt coverImage category readTime views createdAt author");
    res.json({ success: true, blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, author: req.id },
      { $set: req.body },
      { new: true }
    );
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found or not authorized" });
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({ _id: req.params.id, author: req.id });
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found or not authorized" });
    res.json({ success: true, message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBlogLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    const idx = blog.likes.indexOf(req.id);
    idx === -1 ? blog.likes.push(req.id) : blog.likes.splice(idx, 1);
    await blog.save();
    res.json({ success: true, likes: blog.likes.length, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBlogBookmark = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    const idx = blog.bookmarks.indexOf(req.id);
    idx === -1 ? blog.bookmarks.push(req.id) : blog.bookmarks.splice(idx, 1);
    await blog.save();
    res.json({ success: true, bookmarks: blog.bookmarks.length, bookmarked: idx === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Content is required" });
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.id, content } } },
      { new: true }
    ).populate("comments.user", "fullname profile.profilePhoto");
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct("category", { status: "published" });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "fullname email");
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBlogsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate("author", "fullname email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments(query),
    ]);
    res.json({ success: true, blogs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminDeleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};