import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, ChevronDown, Star, Sparkles, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SUBSCRIPTION_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useSelector } from "react-redux";

const testimonials = [
  { name: "Rahul S.", role: "Software Engineer at Google", text: "The Pro plan was a game-changer. The AI resume optimization helped me land interviews at top tech companies." },
  { name: "Priya M.", role: "Product Manager at Amazon", text: "JobHub's tools are incredible. The cover letter generator alone saved me hours of work." },
  { name: "Arun K.", role: "Data Scientist at Microsoft", text: "From resume building to interview prep, JobHub has everything you need for a successful job search." },
];

const faqs = [
  { q: "Can I upgrade or downgrade my plan anytime?", a: "Yes, you can change your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes apply at the next billing cycle." },
  { q: "Is there a free trial for paid plans?", a: "Yes! We offer a 14-day free trial for the Pro plan with no credit card required. You can cancel anytime." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, debit cards, UPI, Net Banking, and popular wallets like Paytm and Google Pay." },
  { q: "Can I get a refund?", a: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team for a full refund." },
  { q: "Is my data secure?", a: "Absolutely. We use 256-bit encryption and follow industry best practices for data security. Your information is never shared with third parties." },
];

const freePlan = {
  _id: "free",
  name: "Free",
  slug: "free",
  monthlyPrice: 0,
  annualPrice: 0,
  description: "Perfect for getting started with your job search.",
  features: ["Browse 500+ jobs", "Create basic profile", "Save up to 10 jobs", "Email alerts", "Basic resume builder"],
  isPopular: false,
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${SUBSCRIPTION_API_END_POINT}/plans`);
        if (res.data.success) {
          setPlans(res.data.plans);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load pricing plans");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchMySubscription = async () => {
      try {
        const res = await axios.get(`${SUBSCRIPTION_API_END_POINT}/my`, { withCredentials: true });
        if (res.data.success && res.data.subscription) {
          setMySubscription(res.data.subscription);
        }
      } catch {
        // no subscription
      }
    };
    fetchMySubscription();
  }, [user]);

  const allPlans = [freePlan, ...plans];

  const allFeatures = [...new Set(allPlans.flatMap(p => p.features))];
  const features = allFeatures.map(feature => {
    const row = { name: feature };
    allPlans.forEach(p => {
      row[p.slug] = p.features.includes(feature);
    });
    return row;
  });

  const handleSubscribe = async (plan) => {
    if (plan.slug === "free") {
      if (!user) navigate("/signup");
      return;
    }
    if (!user) {
      navigate("/signup");
      return;
    }
    if (mySubscription && mySubscription.status === "active") {
      const subPlanId = typeof mySubscription.plan === "object" ? mySubscription.plan._id : mySubscription.plan;
      if (subPlanId === plan._id) {
        toast.info("You are already subscribed to this plan");
        return;
      }
    }
    try {
      setSubscribing(plan._id);
      const res = await axios.post(
        `${SUBSCRIPTION_API_END_POINT}/subscribe`,
        { planId: plan._id, billingCycle: billing },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success("Subscription successful!");
        const subRes = await axios.get(`${SUBSCRIPTION_API_END_POINT}/my`, { withCredentials: true });
        if (subRes.data.success && subRes.data.subscription) {
          setMySubscription(subRes.data.subscription);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to subscribe");
    } finally {
      setSubscribing(null);
    }
  };

  const getPrice = (plan) => {
    if (plan.monthlyPrice === 0) return "₹0";
    if (billing === "annual") return `₹${plan.annualPrice?.toLocaleString("en-IN")}`;
    return `₹${plan.monthlyPrice.toLocaleString("en-IN")}`;
  };

  const getPeriod = (plan) => {
    if (plan.monthlyPrice === 0) return "forever";
    return billing === "annual" ? "/year" : "/month";
  };

  const isSubscribed = (plan) => {
    if (!mySubscription || mySubscription.status !== "active") return false;
    const subPlanId = typeof mySubscription.plan === "object" ? mySubscription.plan._id : mySubscription.plan;
    return subPlanId === plan._id;
  };

  const getCtaText = (plan) => {
    if (plan.slug === "free") return "Get Started";
    if (isSubscribed(plan)) return "Current Plan";
    return "Start Free Trial";
  };

  const getGradient = (plan) => {
    if (plan.slug === "free") return "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750";
    if (plan.isPopular) return "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20";
    return "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20";
  };

  const getAccent = (plan) => {
    if (plan.slug === "free") return "text-gray-600 dark:text-gray-300";
    if (plan.isPopular) return "text-[#0A66C2] dark:text-blue-400";
    return "text-purple-600 dark:text-purple-400";
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
      {[1, 2, 3].map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 card-shadow overflow-hidden animate-pulse">
          <div className="p-6 space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          </div>
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            ))}
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mt-4" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12 mb-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
        <X className="h-8 w-8 text-red-500" />
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
      <Button onClick={() => window.location.reload()} variant="outline">
        Try Again
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <div className="text-center py-12 mb-16">
      <p className="text-gray-600 dark:text-gray-400">No pricing plans available at the moment.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#002244]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">Simple, transparent pricing</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Choose Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">Success Plan</span>
            </h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">Invest in your career with the tools and resources you need to land your dream job.</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F3F2EF] dark:from-[#0D1117] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 card-shadow">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${billing === "monthly" ? "bg-[#0A66C2] text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${billing === "annual" ? "bg-[#0A66C2] text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
            >
              Annual
              <span className="ml-1.5 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {loading ? (
          renderSkeleton()
        ) : error ? (
          renderError()
        ) : plans.length === 0 ? (
          renderEmpty()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {allPlans.map((plan, i) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className={cn(
                  "relative rounded-2xl border card-shadow overflow-hidden transition-all duration-300 hover:shadow-xl",
                  plan.isPopular
                    ? "border-[#0A66C2] dark:border-blue-500 scale-105 md:scale-110 z-10"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                )}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#0A66C2] to-blue-600 text-white text-center text-xs font-semibold py-2">
                    Most Popular
                  </div>
                )}
                <div className={cn("p-6", plan.isPopular ? "pt-10" : "pt-6", getGradient(plan))}>
                  <h3 className={cn("text-lg font-bold", getAccent(plan))}>{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{getPrice(plan)}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{getPeriod(plan)}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
                </div>
                <div className="p-6 space-y-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{f}</span>
                    </div>
                  ))}
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isSubscribed(plan) || subscribing === plan._id}
                    className={cn(
                      "w-full rounded-xl py-5 mt-4 font-semibold",
                      isSubscribed(plan)
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 cursor-not-allowed"
                        : plan.isPopular
                          ? "btn-primary"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    )}
                  >
                    {subscribing === plan._id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Subscribing...
                      </span>
                    ) : (
                      getCtaText(plan)
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 sm:p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-700 dark:text-gray-300">Feature</th>
                    {allPlans.map((plan) => (
                      <th
                        key={plan._id}
                        className={cn(
                          "text-center py-3 px-4 font-semibold",
                          plan.slug === "free" && "text-gray-700 dark:text-gray-300",
                          plan.isPopular && "text-[#0A66C2]",
                          !plan.isPopular && plan.slug !== "free" && "text-purple-600"
                        )}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((f) => (
                    <tr key={f.name} className="border-b border-gray-50 dark:border-gray-750">
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{f.name}</td>
                      {allPlans.map((plan) => (
                        <td key={plan._id} className="text-center py-3 px-4">
                          {f[plan.slug] === true ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">{faq.q}</span>
                  <ChevronDown className={cn("h-5 w-5 text-gray-400 shrink-0 transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
