import "dotenv/config";
import mongoose from "mongoose";
import { Company } from "../models/company.model.js";
import { CompanyProfile } from "../models_new/CompanyProfile.js";

const toFavicon = (logoUrl) => {
  const match = logoUrl.match(/logo\.clearbit\.com\/([^/?]+)/);
  if (!match) return null;
  return `https://www.google.com/s2/favicons?domain=${match[1]}&sz=128`;
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const companies = await Company.find({ logo: /logo\.clearbit\.com/ });
  for (const company of companies) {
    const next = toFavicon(company.logo);
    if (next) {
      company.logo = next;
      await company.save();
    }
  }
  console.log(`Migrated ${companies.length} Company logos off Clearbit`);

  const profiles = await CompanyProfile.find({ logo: /logo\.clearbit\.com/ });
  for (const profile of profiles) {
    const next = toFavicon(profile.logo);
    if (next) {
      profile.logo = next;
      await profile.save();
    }
  }
  console.log(`Migrated ${profiles.length} CompanyProfile logos off Clearbit`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
