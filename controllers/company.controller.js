import { Company } from "../models/company.model.js";

export const registerCompany = async (req, res) => {
    try {
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
        console.log("Error in registerCompany:", error);
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
        console.log("Error in getCompany:", error);
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
        console.log("Error in getCompanyById:", error);
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            { name, description, website, location },
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
        console.log("Error in updateCompany:", error);
    }
};
