import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import { USER_API_END_POINT } from "@/utils/constant";

export default function UpdateProfileDialogue({ open, setOpen }) {
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const [input, setInput] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    bio: "",
    skills: "",
    file: null,
    profilePhoto: null,
  });

  const [preview, setPreview] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    if (!open) return;
    setInput({
      fullname: user?.fullname || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      bio: user?.profile?.bio || "",
      skills: user?.profile?.skills?.join(", ") || "",
      file: null,
      profilePhoto: null,
    });
    setPreview(null);
    setPhotoPreview(null);
  }, [open, user]);

  const changeEventHandler = useCallback((e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setInput((prev) => ({ ...prev, file }));
      setPreview(URL.createObjectURL(file));
    } else if (file) {
      toast.error("Please upload a PDF file");
    }
  }, []);

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput((prev) => ({ ...prev, profilePhoto: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, []);

  const removeResume = useCallback(() => {
    setInput((prev) => ({ ...prev, file: null }));
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePhoto = useCallback(() => {
    setInput((prev) => ({ ...prev, profilePhoto: null }));
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("fullname", input.fullname);
    formData.append("email", input.email);
    formData.append("phoneNumber", input.phoneNumber);
    formData.append("bio", input.bio);
    formData.append("skills", input.skills);
    if (input.file instanceof File) {
      formData.append("resume", input.file);
    }
    if (input.profilePhoto instanceof File) {
      formData.append("profilePhoto", input.profilePhoto);
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${USER_API_END_POINT}/updateprofile`,
        formData,
        { withCredentials: true }
      );
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success(res.data.message);
        setOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-900">
            Update Profile
          </DialogTitle>
          <p className="text-center text-sm text-gray-500">
            Make your profile stand out to recruiters
          </p>
        </DialogHeader>

        <form onSubmit={submitHandler} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              name="fullname"
              value={input.fullname}
              onChange={changeEventHandler}
              placeholder="John Doe"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={input.email}
              onChange={changeEventHandler}
              placeholder="john@example.com"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input
              name="phoneNumber"
              value={input.phoneNumber}
              onChange={changeEventHandler}
              placeholder="+1 (555) 123-4567"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={input.bio}
              onChange={changeEventHandler}
              rows={3}
              placeholder="A short description about yourself..."
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Skills</label>
            <input
              name="skills"
              value={input.skills}
              onChange={changeEventHandler}
              placeholder="React, Node.js, TypeScript, ..."
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 focus:outline-none"
            />
            <p className="text-xs text-gray-400">Separate skills with commas</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Profile Photo</label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative h-16 w-16 shrink-0">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-16 w-16 rounded-full border-2 border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                  >
                    <span className="text-xs font-bold">x</span>
                  </button>
                </div>
              ) : user?.profile?.profilePhoto ? (
                <div className="relative h-16 w-16 shrink-0">
                  <img
                    src={user.profile.profilePhoto}
                    alt="Current"
                    className="h-16 w-16 rounded-full border-2 border-gray-200 object-cover"
                  />
                </div>
              ) : null}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Resume (PDF)</label>
            <div
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 transition-colors hover:border-[#0A66C2] hover:bg-blue-50/30"
            >
              {preview || input.file ? (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Upload className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {input.file?.name || user?.profile?.resumeOriginalName || "Resume"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {input.file ? `${(input.file.size / 1024).toFixed(0)} KB` : "Uploaded"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeResume(); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500 transition-colors hover:bg-red-200"
                  >
                    <span className="text-xs font-bold">x</span>
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">
                    Drop your resume here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-400">PDF only, max 10MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileDrop}
                className="hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-lg px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
