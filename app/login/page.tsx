import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex justify-center">
            <Shield className="h-10 w-10 text-teal-600" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">Sign in to LeLink</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Access your secure healthcare platform</p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" action="#" method="POST">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6">
                Email address
              </label>
              <div className="mt-2">
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6">
                  Password
                </label>
                <div className="text-sm">
                  <Link href="/forgot-password" className="font-semibold text-teal-600 hover:text-teal-500">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="mt-2">
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
            </div>

            <div>
              <Link href="/dashboard">
                <Button className="w-full bg-teal-600 hover:bg-teal-700">Sign in</Button>
              </Link>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-500">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

