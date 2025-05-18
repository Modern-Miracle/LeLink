"use client";

import { signIn } from "next-auth/react";
import { Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex justify-center">
            <Shield className="h-10 w-10 text-teal-600" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
            Sign in to LeLink
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Access your secure healthcare platform
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm space-y-4 text-center">
          <button
            onClick={() => signIn("microsoft-entra-id")}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition"
          >
            Sign in with Email & Password
          </button>

          <button
            onClick={() => signIn("microsoft-entra-id", { idp: "Google" })}
            className="w-full bg-white text-black border px-4 py-2 rounded hover:bg-gray-100 transition"
          >
            Sign in with Google
          </button>

          <button
            onClick={() => signIn("microsoft-entra-id", { idp: "Apple" })}
            className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-900 transition"
          >
            Sign in with Apple
          </button>

          <button
            onClick={() => signIn("microsoft-entra-id", { idp: "Microsoft" })}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Sign in with Microsoft
          </button>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <span className="font-semibold text-teal-600">
              Register via Entra
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
