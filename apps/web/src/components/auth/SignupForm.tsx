"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Button from "@/ui/Button";
import Loading from "@/components/loading/Loading";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { register } from "@/lib/auth";

export default function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    email.trim() !== "" &&
    password.trim() !== "" &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    accepted;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    let didRedirect = false;

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        orgName: orgName.trim() || undefined,
      });
      didRedirect = true;
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Signup failed");
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
        <h1 className="text-2xl font-semibold text-gray-900">Create your Evolvia account</h1>
        <p className="mt-2 text-sm text-gray-500">
          Start organizing appointments, client insights, and AI workflows in minutes.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>
              First name <span className="text-error-500">*</span>
            </Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ava"
              className="!bg-white !text-gray-900 !border-gray-200 focus:!border-brand-500"
            />
          </div>
          <div>
            <Label>
              Last name <span className="text-error-500">*</span>
            </Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Martinez"
              className="!bg-white !text-gray-900 !border-gray-200 focus:!border-brand-500"
            />
          </div>
        </div>
        <div>
          <Label>Salon name</Label>
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Glow Studio"
            className="!bg-white !text-gray-900 !border-gray-200 focus:!border-brand-500"
          />
        </div>
        <div>
          <Label>
            Work email <span className="text-error-500">*</span>
          </Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="owner@glowstudio.com"
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
              placeholder="Create a secure password"
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
        <div className="flex items-start gap-3">
          <Checkbox checked={accepted} onChange={setAccepted} className="mt-1" />
          <p className="text-sm text-gray-600">
            I agree to the <span className="text-brand-500">Terms</span> and
            <span className="text-brand-500"> Privacy Policy</span>.
          </p>
        </div>
        <Button type="submit" className="w-full" size="sm" disabled={!isFormValid || loading}>
          Create account
        </Button>
        {error && <p className="text-sm text-error-500">{error}</p>}
      </form>

      <p className="mt-5 text-sm text-gray-700">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-500 hover:text-brand-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
