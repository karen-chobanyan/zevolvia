"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Button from "@/ui/Button";
import Loading from "@/components/loading/Loading";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { login } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    let didRedirect = false;

    try {
      await login({ email, password });
      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") ? next : "/dashboard";
      didRedirect = true;
      router.replace(safeNext);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      if (!didRedirect) {
        setLoading(false);
      }
    }
  }

  return loading ? (
    <Loading />
  ) : (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to manage your salon operations and AI workflows.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label>
            Email <span className="text-error-500">*</span>
          </Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@zevolvia.com"
            className="!bg-white !text-gray-900 !border-gray-200 focus:!border-brand-500"
          />
        </div>
        <div>
          <Label>
            Password <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="!bg-white !text-gray-900 !border-gray-200 focus:!border-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeIcon className="fill-gray-500" />
              ) : (
                <EyeCloseIcon className="fill-gray-500" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox checked={remember} onChange={setRemember} />
            <span className="text-sm text-gray-700">Keep me logged in</span>
          </div>
          <Link href="/signup" className="text-sm text-brand-500 hover:text-brand-600">
            Need an account?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="sm" disabled={!isFormValid || loading}>
          Sign in
        </Button>
        {error && <p className="text-sm text-error-500">{error}</p>}
      </form>
    </div>
  );
}
