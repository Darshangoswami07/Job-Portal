import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Loader2, Chrome, Github,
  Shield, CheckCircle, ArrowRight, AlertCircle
} from "lucide-react"
import { setLoading } from "@/store/slices/authSlice"
import { USER_API_END_POINT, BACKEND_URL } from "@/utils/constant"
import axios from "axios"
import { toast } from "sonner"
import AuthLayout from "./AuthLayout"
import ProfileAvatar from "./ProfileAvatar"

const strengthConfig = [
  { label: "Weak", color: "bg-red-500", textColor: "text-red-500", min: 0 },
  { label: "Fair", color: "bg-orange-500", textColor: "text-orange-500", min: 1 },
  { label: "Good", color: "bg-yellow-500", textColor: "text-yellow-500", min: 2 },
  { label: "Strong", color: "bg-green-500", textColor: "text-green-500", min: 3 },
  { label: "Excellent", color: "bg-emerald-500", textColor: "text-emerald-500", min: 4 },
]

const requirements = [
  { key: "min8", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { key: "symbol", label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

export default function Signup() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((store) => store.auth)

  const [input, setInput] = useState({
    fullname: "", email: "", phoneNumber: "",
    password: "", confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [focusedField, setFocusedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  const validate = () => {
    const errs = {}
    if (!input.fullname.trim()) errs.fullname = "Full name is required"
    if (!input.email) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errs.email = "Invalid email format"
    if (!input.password) errs.password = "Password is required"
    else if (input.password.length < 6) errs.password = "Password must be at least 6 characters"
    if (!input.confirmPassword) errs.confirmPassword = "Please confirm your password"
    else if (input.password !== input.confirmPassword) errs.confirmPassword = "Passwords do not match"
    return errs
  }

  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: "", score: 0 }
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    const config = strengthConfig[score] || strengthConfig[0]
    return { level: score, label: config.label, score }
  }

  const strength = getStrength(input.password)

  const changeHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }))
  }

  const submitHandler = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      setShakeKey((k) => k + 1)
      return
    }
    try {
      dispatch(setLoading(true))
      const res = await axios.post(`${USER_API_END_POINT}/register`, input, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      })
      if (res.data.success) {
        toast.success(res.data.message)
        setTimeout(() => navigate("/login"), 1200)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed")
      setShakeKey((k) => k + 1)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleSocialSignup = (provider) => {
    window.location.href = `${BACKEND_URL}/api/v1/user/${provider}`
  }

  const isFloating = (name) => focusedField === name || !!input[name]

  return (
    <AuthLayout>
      <div className="mb-10">
        {/* Header Section */}
        <div className="text-center">
          <ProfileAvatar />
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight"
          >
            Create Your Account
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
          >
            Join thousands of professionals on JobPilot Ai
          </motion.p>
        </div>
      </div>

      <motion.form key={shakeKey} onSubmit={submitHandler}
        animate={shakeKey > 0 ? { x: [0, -4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }} className="space-y-4" noValidate
      >
        <FloatingInput id="fullname" type="text" name="fullname" label="Full name" icon={User}
          value={input.fullname} error={errors.fullname} isFloating={isFloating("fullname")}
          onFocus={() => setFocusedField("fullname")} onBlur={() => setFocusedField(null)}
          onChange={changeHandler} autoComplete="name" placeholder="John Doe"
        />

        <FloatingInput id="email" type="email" name="email" label="Email" icon={Mail}
          value={input.email} error={errors.email} isFloating={isFloating("email")}
          onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
          onChange={changeHandler} autoComplete="email" placeholder="you@example.com"
        />

        <FloatingInput id="phone" type="tel" name="phoneNumber" label="Phone (optional)" icon={Phone}
          value={input.phoneNumber} error={errors.phoneNumber} isFloating={isFloating("phoneNumber")}
          onFocus={() => setFocusedField("phoneNumber")} onBlur={() => setFocusedField(null)}
          onChange={changeHandler} autoComplete="tel" placeholder="+1 (555) 000-0000"
        />

        <div className="relative">
          <input id="password" type={showPassword ? "text" : "password"}
            name="password" value={input.password} onChange={changeHandler}
            onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
            placeholder="Create a strong password" autoComplete="new-password"
            className={`w-full rounded-xl border bg-white dark:bg-[#161B22] pl-10 pr-12 py-3.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all duration-200 placeholder-transparent ${
              errors.password
                ? "border-red-400 dark:border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-gray-200 dark:border-gray-700 focus:border-[#0A66C2] dark:focus:border-[#2F81F7] focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(47,129,247,0.1)]"
            }`} aria-label="Password" aria-invalid={!!errors.password}
          />
          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
            errors.password ? "text-red-400" : isFloating("password") ? "text-[#0A66C2] dark:text-[#2F81F7]" : "text-gray-400 dark:text-gray-500"
          }`} />
          <label htmlFor="password" className={`absolute left-10 transition-all duration-200 pointer-events-none bg-white dark:bg-[#161B22] px-1 ${
            isFloating("password") ? "-top-2.5 text-xs text-[#0A66C2] dark:text-[#2F81F7]" : "top-3.5 text-sm text-gray-400 dark:text-gray-500"
          }`}>Password</label>
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
          {errors.password && <ErrorMsg msg={errors.password} />}
        </div>

        <AnimatePresence>
          {input.password && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"
            >
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.div key={level} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3, delay: level * 0.05 }}
                    className={`h-1.5 flex-1 rounded-full origin-left ${
                      level <= strength.score ? strengthConfig[strength.score]?.color || "bg-gray-200" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium mb-2 ${
                strength.score > 0 ? strengthConfig[strength.score]?.textColor || "text-gray-400" : "text-gray-400 dark:text-gray-500"
              }`}>{strength.label || "Enter a password"}</p>
              <div className="space-y-1">
                {requirements.map((req, i) => {
                  const met = req.test(input.password)
                  return (
                    <motion.div key={req.key} initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                      className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                        met ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <motion.div animate={met ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                        {met ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      </motion.div>
                      {req.label}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <input id="confirmPassword" type={showConfirm ? "text" : "password"}
            name="confirmPassword" value={input.confirmPassword} onChange={changeHandler}
            onFocus={() => setFocusedField("confirmPassword")} onBlur={() => setFocusedField(null)}
            placeholder="Confirm your password" autoComplete="new-password"
            className={`w-full rounded-xl border bg-white dark:bg-[#161B22] pl-10 pr-12 py-3.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all duration-200 placeholder-transparent ${
              errors.confirmPassword
                ? "border-red-400 dark:border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-gray-200 dark:border-gray-700 focus:border-[#0A66C2] dark:focus:border-[#2F81F7] focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(47,129,247,0.1)]"
            }`} aria-label="Confirm password" aria-invalid={!!errors.confirmPassword}
          />
          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
            errors.confirmPassword ? "text-red-400" : isFloating("confirmPassword") ? "text-[#0A66C2] dark:text-[#2F81F7]" : "text-gray-400 dark:text-gray-500"
          }`} />
          <label htmlFor="confirmPassword" className={`absolute left-10 transition-all duration-200 pointer-events-none bg-white dark:bg-[#161B22] px-1 ${
            isFloating("confirmPassword") ? "-top-2.5 text-xs text-[#0A66C2] dark:text-[#2F81F7]" : "top-3.5 text-sm text-gray-400 dark:text-gray-500"
          }`}>Confirm password</label>
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={showConfirm ? "Hide password" : "Show password"} tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
          {errors.confirmPassword && <ErrorMsg msg={errors.confirmPassword} />}
          {input.confirmPassword && input.password === input.confirmPassword && !errors.confirmPassword && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Passwords match
            </motion.p>
          )}
        </div>

        <motion.button type="submit" disabled={loading}
          whileHover={!loading ? { scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.99 } : {}}
          className="relative w-full h-14 rounded-xl bg-[#0A66C2] dark:bg-[#2F81F7] text-white text-sm font-semibold overflow-hidden transition-all duration-200 hover:bg-[#004182] dark:hover:bg-[#1F6FEB] disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2.5"><Loader2 className="h-5 w-5 animate-spin" /> Creating account...</span>
          ) : (
            <span className="inline-flex items-center gap-2">Create account <ArrowRight className="h-4 w-4" /></span>
          )}
        </motion.button>
      </motion.form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-[#0D1117] px-3 text-gray-400 dark:text-gray-500">or sign up with</span>
        </div>
      </div>

      <div className="space-y-3">
        <SocialButton icon={Chrome} label="Sign up with Google" onClick={() => handleSocialSignup("google")} />
        <SocialButton icon={Github} label="Sign up with GitHub" onClick={() => handleSocialSignup("github")} />
      </div>

      <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-[#0A66C2] dark:text-[#2F81F7] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-[#0A66C2] dark:after:bg-[#2F81F7] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">
          Log In
        </Link>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <TrustItem icon={Shield} text="Secure Signup" />
        <TrustItem icon={CheckCircle} text="Google OAuth" />
        <TrustItem icon={Github} text="GitHub OAuth" />
        <TrustItem icon={Lock} text="Encrypted Auth" />
      </div>
    </AuthLayout>
  )
}

function FloatingInput({ id, type, name, label, icon: Icon, value, error, isFloating, onFocus, onBlur, onChange, autoComplete, placeholder }) {
  return (
    <div className="relative">
      <input id={id} type={type} name={name} value={value} onChange={onChange}
        onFocus={onFocus} onBlur={onBlur} placeholder={placeholder} autoComplete={autoComplete}
        className={`w-full rounded-xl border bg-white dark:bg-[#161B22] pl-10 pr-4 py-3.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all duration-200 placeholder-transparent ${
          error ? "border-red-400 dark:border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
            : "border-gray-200 dark:border-gray-700 focus:border-[#0A66C2] dark:focus:border-[#2F81F7] focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(47,129,247,0.1)]"
        }`} aria-label={label} aria-invalid={!!error}
      />
      <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
        error ? "text-red-400" : isFloating ? "text-[#0A66C2] dark:text-[#2F81F7]" : "text-gray-400 dark:text-gray-500"
      }`} />
      <label htmlFor={id} className={`absolute left-10 transition-all duration-200 pointer-events-none bg-white dark:bg-[#161B22] px-1 ${
        isFloating ? "-top-2.5 text-xs text-[#0A66C2] dark:text-[#2F81F7]" : "top-3.5 text-sm text-gray-400 dark:text-gray-500"
      }`}>{label}</label>
      {error && <ErrorMsg msg={error} />}
    </div>
  )
}

function SocialButton({ icon: Icon, label, onClick }) {
  return (
    <motion.button onClick={onClick} whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161B22] px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
    >
      <Icon className="h-5 w-5" /> {label}
    </motion.button>
  )
}

function ErrorMsg({ msg }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
      <span className="inline-block w-1 h-1 rounded-full bg-red-500 dark:bg-red-400" /> {msg}
    </motion.p>
  )
}

function TrustItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
      <Icon className="h-3 w-3 shrink-0" /> {text}
    </div>
  )
}
