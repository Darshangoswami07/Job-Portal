import React, { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import {
  Mail, Lock, Eye, EyeOff, Loader2, Chrome, Github,
  Shield, CheckCircle, ArrowRight
} from "lucide-react"
import { setCredentials, setLoading } from "@/store/slices/authSlice"
import { USER_API_END_POINT, BACKEND_URL } from "../../utils/constant"
import axios from "axios"
import { toast } from "sonner"
import AuthLayout from "./AuthLayout"
import ProfileAvatar from "./ProfileAvatar"

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading } = useSelector((store) => store.auth)

  const [input, setInput] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [focusedField, setFocusedField] = useState(null)
  const [shakeKey, setShakeKey] = useState(0)
  const Motion = motion
  void Motion

  const validate = () => {
    const errs = {}
    if (!input.email) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errs.email = "Invalid email format"
    if (!input.password) errs.password = "Password is required"
    return errs
  }

  const changeHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }))
    }
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
      const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      })
      if (res.data.success) {
        dispatch(setCredentials({ user: res.data.user, token: res.data.token }))
        const redirectTo = searchParams.get("redirect") || "/"
        navigate(redirectTo, { replace: true })
        toast.success(res.data.message)
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed"
      toast.error(msg)
      setShakeKey((k) => k + 1)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleSocialLogin = (provider) => {
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
            Welcome back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
          >
            Sign in to your account to continue
          </motion.p>
        </div>
      </div>

      <motion.form
        key={shakeKey}
        onSubmit={submitHandler}
        animate={shakeKey > 0 ? { x: [0, -4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="space-y-4"
        noValidate
      >
        <FloatingInput
          id="email" type="email" name="email" label="Email"
          icon={Mail} value={input.email} error={errors.email}
          isFloating={isFloating("email")}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
          onChange={changeHandler}
          autoComplete="email"
          placeholder="you@example.com"
        />

        <div className="relative">
          <input
            id="password" type={showPassword ? "text" : "password"}
            name="password" value={input.password} onChange={changeHandler}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)} placeholder="Enter your password"
            autoComplete="current-password"
            className={`w-full rounded-xl border bg-white dark:bg-[#161B22] pl-10 pr-12 py-3.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all duration-200 placeholder-transparent ${
              errors.password
                ? "border-red-400 dark:border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-gray-200 dark:border-gray-700 focus:border-[#0A66C2] dark:focus:border-[#2F81F7] focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(47,129,247,0.1)]"
            }`}
            aria-label="Password" aria-invalid={!!errors.password}
          />
          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
            errors.password ? "text-red-400" : isFloating("password") ? "text-[#0A66C2] dark:text-[#2F81F7]" : "text-gray-400 dark:text-gray-500"
          }`} />
          <label htmlFor="password" className={`absolute left-10 transition-all duration-200 pointer-events-none bg-white dark:bg-[#161B22] px-1 ${
            isFloating("password")
              ? "-top-2.5 text-xs text-[#0A66C2] dark:text-[#2F81F7]"
              : "top-3.5 text-sm text-gray-400 dark:text-gray-500"
          }`}>
            Password
          </label>
          <button
            type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
          {errors.password && <ErrorMsg msg={errors.password} />}
        </div>

        <motion.button
          type="submit" disabled={loading}
          whileHover={!loading ? { scale: 1.01 } : {}}
          whileTap={!loading ? { scale: 0.99 } : {}}
          className="relative w-full h-14 rounded-xl bg-[#0A66C2] dark:bg-[#2F81F7] text-white text-sm font-semibold overflow-hidden transition-all duration-200 hover:bg-[#004182] dark:hover:bg-[#1F6FEB] disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </motion.button>
      </motion.form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-[#0D1117] px-3 text-gray-400 dark:text-gray-500">
            or continue with
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <SocialButton icon={Chrome} label="Continue with Google" onClick={() => handleSocialLogin("google")} />
        <SocialButton icon={Github} label="Continue with GitHub" onClick={() => handleSocialLogin("github")} />
      </div>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-medium text-[#0A66C2] dark:text-[#2F81F7] hover:text-[#004182] dark:hover:text-[#58A6FF] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-[#0A66C2] dark:after:bg-[#2F81F7] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">
          Sign Up
        </Link>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <TrustItem icon={Shield} text="Secure Login" />
        <TrustItem icon={CheckCircle} text="Google OAuth" />
        <TrustItem icon={Github} text="GitHub OAuth" />
        <TrustItem icon={Lock} text="Encrypted Auth" />
      </div>
    </AuthLayout>
  )
}

function FloatingInput({ id, type, name, label, icon: Icon, value, error, isFloating, onFocus, onBlur, onChange, autoComplete, placeholder }) {
  const IconComponent = Icon
  void IconComponent
  return (
    <div className="relative">
      <input
        id={id} type={type} name={name} value={value} onChange={onChange}
        onFocus={onFocus} onBlur={onBlur} placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-xl border bg-white dark:bg-[#161B22] pl-10 pr-4 py-3.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all duration-200 placeholder-transparent ${
          error
            ? "border-red-400 dark:border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
            : "border-gray-200 dark:border-gray-700 focus:border-[#0A66C2] dark:focus:border-[#2F81F7] focus:shadow-[0_0_0_3px_rgba(10,102,194,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(47,129,247,0.1)]"
        }`}
        aria-label={label} aria-invalid={!!error}
      />
      <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
        error ? "text-red-400" : isFloating ? "text-[#0A66C2] dark:text-[#2F81F7]" : "text-gray-400 dark:text-gray-500"
      }`} />
      <label htmlFor={id} className={`absolute left-10 transition-all duration-200 pointer-events-none bg-white dark:bg-[#161B22] px-1 ${
        isFloating ? "-top-2.5 text-xs text-[#0A66C2] dark:text-[#2F81F7]" : "top-3.5 text-sm text-gray-400 dark:text-gray-500"
      }`}>
        {label}
      </label>
      {error && <ErrorMsg msg={error} />}
    </div>
  )
}

function SocialButton({ icon: Icon, label, onClick }) {
  const IconComponent = Icon
  void IconComponent
  return (
    <motion.button
      onClick={onClick} whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161B22] px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
    >
      <Icon className="h-5 w-5" />
      {label}
    </motion.button>
  )
}

function ErrorMsg({ msg }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
      <span className="inline-block w-1 h-1 rounded-full bg-red-500 dark:bg-red-400" />
      {msg}
    </motion.p>
  )
}

function TrustItem({ icon: Icon, text }) {
  const IconComponent = Icon
  void IconComponent
  return (
    <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
      <Icon className="h-3 w-3 shrink-0" />
      {text}
    </div>
  )
}
