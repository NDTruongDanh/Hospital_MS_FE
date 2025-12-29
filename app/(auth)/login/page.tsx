"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      setLoginSuccess(true);
      toast.success("Đăng nhập thành công!");
      // Wait for success animation before redirect
      setTimeout(() => {
        // Redirect based on role will be handled by AuthContext
      }, 1000);
    } catch (error: any) {
      const message = error.response?.data?.message || "Email hoặc mật khẩu không đúng";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Mobile Logo */}
      <div className="lg:hidden text-center mb-6">
        <div className="inline-flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[hsl(173,58%,35%)] to-[hsl(173,58%,28%)] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
            HMS
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">CarePoint</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Hospital Management</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Chào mừng trở lại!</h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Đăng nhập để tiếp tục vào hệ thống
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field with Floating Label */}
        <div className="space-y-1.5">
          <label 
            className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
              focusedField === "email" ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
            }`}
          >
            Email
          </label>
          <div className={`relative group transition-transform duration-200 ${focusedField === "email" ? "scale-[1.02]" : ""}`}>
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
              focusedField === "email" ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
            }`}>
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-[hsl(var(--border))] bg-white/50 backdrop-blur-sm
                focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary))]/10 focus:bg-white
                transition-all duration-200 outline-none text-[hsl(var(--foreground))]"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label 
              className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                focusedField === "password" ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
              }`}
            >
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[hsl(var(--primary))] hover:underline font-medium"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className={`relative group transition-transform duration-200 ${focusedField === "password" ? "scale-[1.02]" : ""}`}>
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
              focusedField === "password" ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full h-12 pl-12 pr-12 rounded-xl border-2 border-[hsl(var(--border))] bg-white/50 backdrop-blur-sm
                focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary))]/10 focus:bg-white
                transition-all duration-200 outline-none text-[hsl(var(--foreground))]"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="remember"
            className="w-4 h-4 rounded border-2 border-[hsl(var(--border))] text-[hsl(var(--primary))] 
              focus:ring-[hsl(var(--primary))] focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="remember" className="text-sm text-[hsl(var(--muted-foreground))] cursor-pointer select-none">
            Ghi nhớ đăng nhập
          </label>
        </div>

        {/* Submit Button with Loading/Success States */}
        <button
          type="submit"
          disabled={isLoading || loginSuccess}
          className={`w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2
            transition-all duration-300 relative overflow-hidden
            ${loginSuccess 
              ? "bg-green-500 scale-105" 
              : "bg-gradient-to-r from-[hsl(173,58%,35%)] to-[hsl(173,58%,28%)] hover:from-[hsl(173,58%,30%)] hover:to-[hsl(173,58%,23%)] hover:shadow-lg hover:scale-[1.02]"
            }
            disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {/* Shimmer Effect when loading */}
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
          
          {loginSuccess ? (
            <>
              <CheckCircle className="w-5 h-5 animate-bounce-in" />
              <span>Thành công!</span>
            </>
          ) : isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[hsl(var(--border))]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4 bg-white/70 text-[hsl(var(--muted-foreground))]">
            Hoặc
          </span>
        </div>
      </div>

      {/* Register Link */}
      <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="text-[hsl(var(--primary))] font-semibold hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>

      {/* Demo Accounts */}
      <div className="pt-4 border-t border-[hsl(var(--border))]">
        <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mb-3 font-medium">
          Tài khoản demo:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { role: "Admin", email: "admin@hms.com" },
            { role: "Doctor", email: "doctor1@hms.com" },
            { role: "Nurse", email: "nurse1@hms.com" },
            { role: "Reception", email: "reception1@hms.com" },
          ].map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => setFormData({ email: acc.email, password: "Admin123!@" })}
              className="px-3 py-2.5 rounded-xl border-2 border-[hsl(var(--border))] 
                hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))] 
                transition-all duration-200 text-left group hover:scale-[1.02]"
            >
              <span className="font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">
                {acc.role}
              </span>
              <br />
              <span className="text-[hsl(var(--muted-foreground))] text-[10px]">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
