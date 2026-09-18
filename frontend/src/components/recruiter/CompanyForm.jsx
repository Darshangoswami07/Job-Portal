import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Building2,
  ImagePlus,
  Loader2,
  MapPin,
  Globe,
  Send,
  Rocket,
  Sparkles,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

export default function CompanyForm({
  mode = "create",
  initial = {},
  onSubmit,
  submitting = false,
}) {
  const [name, setName] = useState(mode === "edit" ? initial.name || "" : "");
  const [description, setDescription] = useState(mode === "edit" ? initial.description || "" : "");
  const [website, setWebsite] = useState(mode === "edit" ? initial.website || "" : "");
  const [location, setLocation] = useState(mode === "edit" ? initial.location || "" : "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial.logo || "");
  const fileRef = useRef(null);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "create") {
      onSubmit(name);
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("website", website);
    formData.append("location", location);
    if (file) formData.append("file", file);
    onSubmit(formData);
  };

  const fade = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-indigo-500/5">
      <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-gradient-to-br from-indigo-500/15 to-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/5 blur-3xl" />

      <div className="relative flex flex-col gap-6 border-b border-border/70 bg-gradient-to-r from-indigo-500/10 via-transparent to-blue-600/10 px-6 py-7 sm:px-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/30">
          <Building2 className="size-7 text-white" />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-indigo-500">
            <Sparkles className="size-3.5" /> {mode === "create" ? "Step 1 of 2" : "Company Profile"}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {mode === "create" ? "Name your company" : "Set up your company"}
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            {mode === "create"
              ? "Start with a name — you can complete the full profile right after."
              : "Make your company stand out to top candidates with a complete profile."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-6 px-6 py-7 sm:px-8">
        {mode === "create" ? (
          <motion.div {...fade} transition={{ duration: 0.35 }} className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Company Name</Label>
            <Input
              autoFocus
              type="text"
              className="h-12 rounded-xl text-base"
              placeholder="e.g. Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">You can change this later from the setup page.</p>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-[auto_1fr]">
              <motion.div {...fade} transition={{ duration: 0.35 }}>
                <Label className="mb-2 block text-sm font-semibold text-foreground">Company Logo</Label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex size-32 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-muted/30 transition hover:border-indigo-400 hover:bg-indigo-500/5"
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="logo preview" className="size-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                          <ImagePlus className="size-4" /> Change
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="flex flex-col items-center gap-1.5 text-muted-foreground">
                      <ImagePlus className="size-8 transition group-hover:text-indigo-500" />
                      <span className="text-xs font-semibold">Upload logo</span>
                    </span>
                  )}
                </button>
                <Input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </motion.div>

              <div className="space-y-5">
                <motion.div {...fade} transition={{ duration: 0.35, delay: 0.05 }} className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Company Name</Label>
                  <Input
                    type="text"
                    name="name"
                    className="h-11 rounded-xl"
                    placeholder="Acme Corp"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </motion.div>
                <motion.div {...fade} transition={{ duration: 0.35, delay: 0.1 }} className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      name="website"
                      className="h-11 rounded-xl pl-9"
                      placeholder="https://acme.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </motion.div>
                <motion.div {...fade} transition={{ duration: 0.35, delay: 0.15 }} className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      name="location"
                      className="h-11 rounded-xl pl-9"
                      placeholder="New Delhi, India"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </motion.div>
                <motion.div {...fade} transition={{ duration: 0.35, delay: 0.2 }} className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">About the Company</Label>
                  <Textarea
                    name="description"
                    className="min-h-28 rounded-xl"
                    placeholder="Tell candidates what your company does, its mission, and culture..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </motion.div>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t border-border/70 pt-5">
          <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Rocket className="size-3.5 text-indigo-500" /> A complete profile gets 3x more applicants
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => window.history.back()}>
              <X className="size-4" /> Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (mode === "create" ? !name.trim() : false)}
              className="min-w-36 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Please wait
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {mode === "create" ? "Continue" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
