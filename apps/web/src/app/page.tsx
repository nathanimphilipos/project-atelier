"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hexagon, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<"credentials" | "sso">("credentials");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    ssoEmail: "",
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
    });
    router.push("/dashboard");
  };

  const handleSSO = (e: React.FormEvent) => {
    e.preventDefault();
    const emailName = form.ssoEmail.split("@")[0] || "User";
    login({
      firstName: emailName,
      lastName: "",
      username: form.ssoEmail,
    });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f7f7] via-white to-[#eef3f3] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy shadow-elevated mx-auto">
            <Hexagon className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-navy">
            Project Atelier
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your compliance workspace
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elevated border-0">
          <CardContent className="p-6">
            {/* Mode Toggle */}
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode("credentials")}
                className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-all ${
                  mode === "credentials"
                    ? "bg-white text-navy shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Username
              </button>
              <button
                type="button"
                onClick={() => setMode("sso")}
                className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-all ${
                  mode === "sso"
                    ? "bg-white text-navy shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                SSO
              </button>
            </div>

            {mode === "credentials" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-foreground">
                      First Name
                    </label>
                    <Input
                      placeholder="Nathan"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-foreground">
                      Last Name
                    </label>
                    <Input
                      placeholder="Simpson"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">
                    Username
                  </label>
                  <Input
                    placeholder="nsimpson"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" variant="cta" className="w-full mt-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSSO} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">
                    Work Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={form.ssoEmail}
                    onChange={(e) =>
                      setForm({ ...form, ssoEmail: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" variant="cta" className="w-full mt-2">
                  <KeyRound className="h-4 w-4 mr-1.5" />
                  Continue with SSO
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-muted-foreground">
                      or continue with
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-[13px]"
                    onClick={() => {
                      login({ firstName: "User", lastName: "", username: "google-sso" });
                      router.push("/dashboard");
                    }}
                  >
                    <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-[13px]"
                    onClick={() => {
                      login({ firstName: "User", lastName: "", username: "microsoft-sso" });
                      router.push("/dashboard");
                    }}
                  >
                    <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none">
                      <path d="M11.5 3v8.5H3V3h8.5zm1 0H21v8.5h-8.5V3zM3 12.5h8.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z" fill="#00A4EF" />
                    </svg>
                    Microsoft
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground">
          v1.0 — with love, SaltyCloud GRC Team 💙
        </p>
      </div>
    </div>
  );
}
