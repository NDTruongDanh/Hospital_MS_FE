"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";
import { landingContent } from "@/lib/constants/landing-content";

import { Loading } from "@/components/ui/loading";

const redirectMap: Record<UserRole, string> = {
  ADMIN: "/admin",
  DOCTOR: "/doctor",
  PATIENT: "/patient",
  RECEPTIONIST: "/admin/appointments",
  NURSE: "/admin/patients",
  UNKNOWN: "/admin",
};

const fallbackRedirect = "/admin";

export default function LandingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const { appointmentPath, loginPath, signupPath } = useMemo(() => {
    const appointmentPath = "/patient/appointments/new";
    const encoded = encodeURIComponent(appointmentPath);
    return {
      appointmentPath,
      loginPath: `/login?returnUrl=${encoded}`,
      signupPath: `/signup?returnUrl=${encoded}`,
    };
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role) {
      const destination = redirectMap[user.role] || fallbackRedirect;
      router.replace(destination);
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleBookAppointment = () => {
    if (isAuthenticated && user?.role === "PATIENT") {
      router.push(appointmentPath);
      return;
    }
    router.push(loginPath);
  };

  const handleLogin = () => {
    router.push(loginPath);
  };

  const handleSignup = () => {
    router.push(signupPath);
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated && user?.role) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="bg-background text-foreground">
      <Header
        logoText={(landingContent.hospitalName || "HMS")
          .slice(0, 3)
          .toUpperCase()}
      />
      <main className="pt-16">
        <HeroSection
          hospitalName={landingContent.hospitalName}
          slogan={landingContent.slogan}
          logoSrc={landingContent.logoSrc}
          backgroundImage={landingContent.heroBackground}
          onBookAppointment={handleBookAppointment}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
        <FeaturesSection features={landingContent.features} />
      </main>
      <Footer
        hospitalName={landingContent.hospitalName}
        contact={landingContent.contact}
        hours={landingContent.hours}
        links={[
          { label: "Dang nhap", href: loginPath },
          { label: "Dang ky", href: signupPath },
        ]}
      />
    </div>
  );
}
