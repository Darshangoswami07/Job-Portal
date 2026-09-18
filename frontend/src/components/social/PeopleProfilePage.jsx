import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin, Link2, Github, Linkedin as LinkedinIcon, Globe, Loader2,
  ArrowLeft, BadgeCheck, Award, Briefcase, GraduationCap, Code2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { fetchPublicProfile, fetchUserPosts } from "@/api/socialApi";
import { useSelector } from "react-redux";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FollowButton from "./FollowButton";
import PostList from "./PostList";
import Navbar from "@/components/shared/Navbar";

export default function PeopleProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const me = useSelector((s) => s.auth.user);
  const viewerId = me ? String(me._id) : "";
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("posts");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchPublicProfile(userId).then((res) => {
      if (mounted && res.data?.success) setProfile(res.data.profile);
    }).catch((err) => {
      toast.error(err.response?.data?.message || "Profile not found");
      navigate("/feed");
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [userId, navigate]);

  useEffect(() => {
    let mounted = true;
    fetchUserPosts(userId, { limit: 10 }).then((res) => {
      if (mounted && res.data?.success) setPosts(res.data.posts || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="size-8 animate-spin text-[#0A66C2]" /></div>;
  }

  if (!profile) return null;

  const p = profile.profile || {};
  const isSelf = String(profile._id) === viewerId;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="rounded-full ring-4 ring-card">
                <Avatar className="size-24">
                  <AvatarImage src={p.profilePhoto} alt={profile.fullname} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-3xl">
                    {(profile.fullname || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{profile.fullname}</h1>
                  {p.verificationStatus === "verified" && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#0A66C2] text-white" title="Verified"><BadgeCheck className="size-3.5" /></span>
                  )}
                  {profile.currentRole === "recruiter" && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">RECRUITER</span>}
                </div>
                <p className="text-sm text-muted-foreground">{p.headline}</p>
                {p.companyName && <p className="mt-0.5 text-xs font-semibold text-[#0A66C2]">{p.companyName}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {p.location && <span className="flex items-center gap-1"><MapPin className="size-3" /> {p.location}</span>}
                  {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground"><Globe className="size-3" /> Website</a>}
                  {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground"><Github className="size-3" /> GitHub</a>}
                  {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground"><LinkedinIcon className="size-3" /> LinkedIn</a>}
                  {p.portfolio && <a href={p.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground"><Link2 className="size-3" /> Portfolio</a>}
                </div>
              </div>
            </div>
            {!isSelf && <FollowButton userId={String(profile._id)} viewerId={viewerId} className="mb-2" />}
          </div>

          <div className="mt-4 flex gap-6 border-t border-border/60 pt-4">
            <div><p className="text-lg font-bold text-foreground">{profile.followerCount}</p><p className="text-xs text-muted-foreground">Followers</p></div>
            <div><p className="text-lg font-bold text-foreground">{profile.followingCount}</p><p className="text-xs text-muted-foreground">Following</p></div>
            <div><p className="text-lg font-bold text-foreground">{profile.connectionCount}</p><p className="text-xs text-muted-foreground">Connections</p></div>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 flex gap-1 rounded-full border border-border/60 bg-card p-1">
        {["posts", "skills", "experience", "projects"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition ${tab === t ? "bg-[#0A66C2] text-white" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "posts" && <PostList posts={posts} loading={false} viewerId={viewerId} emptyTitle="No posts yet" />}

        {tab === "skills" && (
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            {p.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {p.skills.map((s) => <span key={s} className="rounded-full bg-blue-500/10 px-3 py-1.5 text-sm font-semibold text-[#0A66C2]">{s}</span>)}
              </div>
            ) : <p className="text-sm text-muted-foreground">No skills listed.</p>}
          </div>
        )}

        {tab === "experience" && (
          <div className="space-y-3">
            {p.experience?.length ? p.experience.map((e, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-border/70 bg-card p-4">
                <Briefcase className="mt-1 size-4 shrink-0 text-[#0A66C2]" />
                <div>
                  <p className="text-sm font-bold text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.company}{e.current && " · Current"}</p>
                  {e.description && <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>}
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No experience listed.</div>
            )}
          </div>
        )}

        {tab === "projects" && (
          <div className="space-y-3">
            {p.certifications?.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground"><Award className="size-4 text-amber-500" /> Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {p.certifications.map((c) => <span key={c} className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600">{c}</span>)}
                </div>
              </div>
            )}
            {p.education?.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground"><GraduationCap className="size-4 text-violet-500" /> Education</p>
                {p.education.map((e, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-sm font-semibold text-foreground">{e.degree}{e.field ? `, ${e.field}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{e.institution}</p>
                  </div>
                ))}
              </div>
            )}
            {(!p.certifications?.length && !p.education?.length) && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No academic or credential info listed.</div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}