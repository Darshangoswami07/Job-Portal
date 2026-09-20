import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../config/cloudinary.js";

export const registerCompany = async (req, res) => {
    try {
        const user = await User.findById(req.id);
        if (!user) {
            return res.status(401).json({
                message: "User not found, please login again",
                success: false,
            });
        }
        if (!user.roles?.recruiter) {
            return res.status(403).json({
                message: "Enable recruiter mode in profile settings to register a company",
                success: false,
            });
        }

        const { companyName } = req.body;

        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required",
                success: false,
            });
        }

        const existingCompany = await Company.findOne({ name: companyName });
        if (existingCompany) {
            return res.status(400).json({
                message: "Company already exists",
                success: false,
            });
        }

        const newCompany = await Company.create({
            name: companyName,
            userId: req.id,
        });

        return res.status(201).json({
            message: "Company registered successfully",
            success: true,
            company: newCompany,
        });
    } catch (error) {
        console.error("Error in registerCompany:", error);
        return res.status(500).json({
            message: "Server error while registering company",
            success: false,
        });
    }
};

export const getCompany = async (req, res) => {
    try {
        const userId = req.id;
        const companies = await Company.find({ userId });

        return res.status(200).json({
            message: "Companies fetched successfully",
            success: true,
            companies,
        });
    } catch (error) {
        console.error("Error in getCompany:", error);
        return res.status(500).json({
            message: "Server error while fetching companies",
            success: false,
        });
    }
};

export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false,
            });
        }

        return res.status(200).json({
            message: "Company fetched successfully",
            success: true,
            company,
        });
    } catch (error) {
        console.error("Error in getCompanyById:", error);
        return res.status(500).json({
            message: "Server error while fetching company",
            success: false,
        });
    }
};

export const getAllCompanies = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    const companies = await Company.find(query).sort({ createdAt: -1 });

    const companiesWithJobs = await Promise.all(
      companies.map(async (company) => {
        const jobCount = await Job.countDocuments({ company: company._id, isActive: true });
        return { ...company.toObject(), openJobs: jobCount };
      })
    );

    return res.status(200).json({
      success: true,
      companies: companiesWithJobs,
    });
  } catch (error) {
    console.error("Error in getAllCompanies:", error);
    return res.status(500).json({
      message: "Server error while fetching companies",
      success: false,
    });
  }
};

export const getCompanyJobs = async (req, res) => {
  try {
    const companyId = req.params.id;
    const jobs = await Job.find({ company: companyId, isActive: true })
      .populate({ path: "company" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Error in getCompanyJobs:", error);
    return res.status(500).json({
      message: "Server error while fetching company jobs",
      success: false,
    });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { name, description, website, location } = req.body;

    let updateData = { name, description, website, location };

    const uploadedFile = req.file || req.files?.find((file) => file.fieldname === "file");

    if (uploadedFile) {
      const fileUri = getDataUri(uploadedFile);

      const cloudResponse = await cloudinary.uploader.upload(
        fileUri.content,
        {
          resource_type: "image",
          format: "jpg",
          quality: "auto",
        }
      );

      updateData.logo = cloudResponse.secure_url;
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({
        message: "Company not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Company updated successfully",
      success: true,
      company: updatedCompany,
    });

  } catch (error) {
    console.error("Error in updateCompany:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};