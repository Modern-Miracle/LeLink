import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, MessageSquare, Lock, Database } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-teal-50">
      <header className="border-b backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-800">
              LeLink
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600 after:scale-x-100"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-teal-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              About
            </Link>
            <Link
              href="/services"
              className="text-sm font-medium text-muted-foreground hover:text-teal-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              Services
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-teal-700 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-teal-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-4 hover:bg-teal-100 hover:text-teal-700 transition-all duration-300"
              >
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-24 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700">
                  <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2"></span>
                  Healthcare for Refugees
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">
                  Secure Healthcare Access
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  LeLink provides secure, immediate access to medical services with robust data privacy for refugees and
                  displaced individuals.
                </p>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="rounded-full px-8 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl transition-all duration-300 h-14"
                    >
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full px-8 border-teal-200 hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 h-14"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[600px] aspect-video rounded-3xl overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-teal-700/20 backdrop-blur-sm z-10"></div>
                  <img
                    src="/ai_healthcare.png"
                    alt="LeLink healthcare platform interface"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8 z-20">
                    <h3 className="text-white text-xl font-medium">AI-Powered Healthcare</h3>
                    <p className="text-white/80 mt-2">Secure, private, and accessible</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 md:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 mb-4">
                <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2"></span>
                Our Technology
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">
                How LeLink Works
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform combines blockchain security with AI-powered healthcare to ensure you receive the care you
                need.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-12 lg:grid-cols-3 lg:gap-16">
              <div className="flex flex-col items-center space-y-4 text-center group">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <MessageSquare className="h-10 w-10 text-teal-600 group-hover:text-teal-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold">AI Triage Chatbot</h3>
                <p className="text-muted-foreground">
                  Our AI-powered chatbot helps assess your medical needs and connects you with appropriate care.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center group">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <Lock className="h-10 w-10 text-teal-600 group-hover:text-teal-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold">Secure Data Privacy</h3>
                <p className="text-muted-foreground">
                  Blockchain technology ensures your medical data remains private, secure, and under your control.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center group">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <Database className="h-10 w-10 text-teal-600 group-hover:text-teal-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold">Medical Records</h3>
                <p className="text-muted-foreground">
                  Access and manage your complete medical history securely from anywhere in the world.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-24 md:py-32 bg-gradient-to-b from-teal-50 to-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative w-full max-w-[600px] aspect-square rounded-3xl overflow-hidden shadow-2xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-teal-700/10 backdrop-blur-sm z-10"></div>
                  <img
                    src="/placeholder.svg?height=800&width=800"
                    alt="LeLink mobile app interface"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
              <div className="space-y-8 order-1 lg:order-2">
                <div className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700">
                  <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2"></span>
                  Accessible Everywhere
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">
                  Healthcare Without Borders
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Access your medical records, chat with our AI triage system, and manage your healthcare journey from
                  anywhere in the world.
                </p>
                <ul className="space-y-4">
                  {[
                    "Secure access to your complete medical history",
                    "AI-powered symptom assessment and triage",
                    "Data sovereignty and privacy protection",
                    "Seamless integration with healthcare providers",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3 text-teal-600"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="rounded-full px-8 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl transition-all duration-300 h-14"
                    >
                      Join Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-white">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-800">
                  LeLink
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Secure healthcare access for refugees and displaced individuals worldwide.
              </p>
              <div className="flex space-x-4">
                {["twitter", "facebook", "instagram", "linkedin"].map((social) => (
                  <a
                    key={social}
                    href={`#${social}`}
                    className="text-muted-foreground hover:text-teal-600 transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-4">Platform</h3>
              <ul className="space-y-3">
                {["Features", "Security", "Pricing", "Resources"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-teal-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-4">Company</h3>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Press", "Partners"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-teal-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-4">Legal</h3>
              <ul className="space-y-3">
                {["Privacy", "Terms", "Cookie Policy", "Compliance"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-teal-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} LeLink. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

