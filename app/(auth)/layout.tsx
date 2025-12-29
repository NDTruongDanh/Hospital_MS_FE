"use client";

import { ReactNode, useEffect, useState } from "react";

// Floating Particle component
function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  return (
    <div
      className="absolute rounded-full bg-white/10 animate-float"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${6 + Math.random() * 4}s`,
      }}
    />
  );
}

// Generate random particles
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    size: 4 + Math.random() * 12,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);

  useEffect(() => {
    setParticles(generateParticles(20));
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex">
      {/* Left Side - Branding with Animated Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(173,58%,35%)] via-[hsl(173,58%,30%)] to-[hsl(173,58%,25%)] p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent animate-pulse-slow" />
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <FloatingParticle key={p.id} {...p} />
          ))}
        </div>
        
        {/* Decorative Circles with Animation */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full animate-float" />
        
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 group">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
              HMS
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">CarePoint</h1>
              <p className="text-white/70 text-sm">Hospital Management System</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <h2 className="text-5xl font-bold text-white leading-tight">
            Quản lý bệnh viện<br />
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              thông minh & hiệu quả
            </span>
          </h2>
          <p className="text-white/80 text-lg max-w-md leading-relaxed">
            Nền tảng quản lý toàn diện giúp tối ưu hóa quy trình khám chữa bệnh, 
            quản lý bệnh nhân và vận hành bệnh viện.
          </p>
          
          {/* Features with Hover Effect */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { icon: "📅", text: "Đặt lịch hẹn online" },
              { icon: "🏥", text: "Quản lý phòng khám" },
              { icon: "💊", text: "Kê đơn điện tử" },
              { icon: "📊", text: "Báo cáo thống kê" },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 text-white/90 p-3 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-default group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </span>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            © 2025 CarePoint HMS. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Auth Form with Glassmorphism */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(210,17%,88%)]">
        <div className="w-full max-w-md">
          {/* Glassmorphism Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
