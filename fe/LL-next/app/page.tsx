import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Globe, Brain, Lock, Users, Activity, ChevronRight, Heart, Database, Zap, AlertTriangle, CheckCircle } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Background */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50 z-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
        </div>
        
        {/* Simple Header with Login */}
        <header className="relative z-10 w-full p-6 md:p-8">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/Logo.png" 
                alt="LeLink Logo" 
                className="h-10 w-10"
              />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-800">
                LeLink
              </span>
            </div>
            <Link href="/login">
              <Button
                variant="outline"
                className="rounded-full px-6 border-teal-200 hover:bg-teal-50 hover:border-teal-300 transition-all duration-300"
              >
                Login
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-20">
          <div className="container mx-auto text-center space-y-8 max-w-5xl">
            <div className="inline-flex items-center rounded-full border border-teal-200 bg-white/80 backdrop-blur px-4 py-2 text-sm font-medium text-teal-700 shadow-sm">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              Healthcare for Humanitarian Crisis
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-teal-900">
                Secure Healthcare Access
              </span>
              <br />
              <span className="text-gray-800">for Refugees Worldwide</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              LeLink provides immediate, secure access to medical services with 
              blockchain-protected data privacy for displaced individuals in crisis situations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/register">
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl transition-all duration-300 h-14 text-lg"
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 border-gray-300 hover:bg-gray-50 transition-all duration-300 h-14 text-lg"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-teal-600" />
                <span>HIPAA Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-teal-600" />
                <span>Multi-Language Support</span>
              </div>
            </div>
          </div>
        </main>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-teal-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-teal-600 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Problem & Solution Section */}
      <section className="py-20 md:py-32 bg-white" id="features">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-teal-900">
                Healthcare Crisis Solution
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              In humanitarian emergencies, accessing healthcare is critical. LeLink ensures 
              refugees and displaced individuals receive immediate, secure medical assistance.
            </p>
          </div>

          {/* Hero Images */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/lelinkimage1.png" 
                alt="Healthcare provider assisting refugee patient"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-xl font-semibold mb-2">Immediate Healthcare Access</h3>
                <p className="text-sm opacity-90">Providing medical assistance in crisis zones</p>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/lelinkimage2.png" 
                alt="Refugee family accessing healthcare via mobile"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-xl font-semibold mb-2">Mobile-First Design</h3>
                <p className="text-sm opacity-90">Healthcare access from any device, anywhere</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* The Problem */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-100 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">The Challenge</h3>
                  <p className="text-gray-600">
                    Millions of refugees lack access to their medical history and face barriers 
                    to healthcare in new locations, risking their health and well-being.
                  </p>
                </div>
              </div>
              <ul className="space-y-3 ml-14">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <span className="text-gray-600">Lost medical records during displacement</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <span className="text-gray-600">Language barriers with healthcare providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <span className="text-gray-600">Lack of privacy and data security</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                  <span className="text-gray-600">Limited access to immediate triage</span>
                </li>
              </ul>
            </div>

            {/* The Solution */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-teal-100 text-teal-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Our Solution</h3>
                  <p className="text-gray-600">
                    LeLink provides a comprehensive platform that ensures continuous, secure 
                    healthcare access regardless of location or circumstances.
                  </p>
                </div>
              </div>
              <ul className="space-y-3 ml-14">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2"></div>
                  <span className="text-gray-600">Blockchain-secured medical records</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2"></div>
                  <span className="text-gray-600">AI-powered triage in multiple languages</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2"></div>
                  <span className="text-gray-600">Complete data sovereignty for patients</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2"></div>
                  <span className="text-gray-600">24/7 access to medical assistance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-teal-900">
                Comprehensive Healthcare Platform
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Advanced technology meeting humanitarian needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Feature Cards */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 w-fit mb-6">
                <Brain className="h-8 w-8 text-teal-700" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">AI Medical Triage</h3>
              <p className="text-gray-600 mb-4">
                Real-time symptom assessment using advanced AI algorithms to prioritize urgent cases 
                and provide immediate healthcare guidance in crisis situations.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>24/7 availability</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Multi-language support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Evidence-based recommendations</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 w-fit mb-6">
                <Shield className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Blockchain Security</h3>
              <p className="text-gray-600 mb-4">
                Immutable, encrypted storage of medical records ensures complete data sovereignty 
                and prevents unauthorized access or tampering.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Zero-trust architecture</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Patient-controlled access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Audit trail transparency</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 w-fit mb-6">
                <Database className="h-8 w-8 text-purple-700" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">FHIR Integration</h3>
              <p className="text-gray-600 mb-4">
                Seamless integration with international health systems using FHIR standards 
                ensures continuity of care across borders and providers.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>EHR compatibility</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Real-time synchronization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Offline capability</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-green-200 w-fit mb-6">
                <Users className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Role-Based Access</h3>
              <p className="text-gray-600 mb-4">
                Multi-factor authentication and granular permissions ensure that sensitive 
                medical data is only accessible to authorized healthcare providers.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Biometric authentication</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Temporary access grants</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Access audit logs</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 w-fit mb-6">
                <Zap className="h-8 w-8 text-orange-700" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Crisis Response</h3>
              <p className="text-gray-600 mb-4">
                Designed for high-stress environments with offline functionality, rapid 
                deployment, and ability to handle 10,000+ concurrent users.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>99.9% uptime SLA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Auto-scaling infrastructure</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Disaster recovery</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="p-4 rounded-xl bg-gradient-to-br from-pink-100 to-pink-200 w-fit mb-6">
                <Activity className="h-8 w-8 text-pink-700" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Health Monitoring</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive tracking of health metrics, medication schedules, and 
                appointment history with real-time notifications and alerts.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Medication reminders</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Appointment scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                  <span>Health insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Standards */}
      <section className="py-20 md:py-32 bg-teal-900 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Built on Trust & Compliance
            </h2>
            <p className="text-xl text-teal-100">
              Meeting the highest international standards for healthcare data protection
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 hover:bg-white/20 transition-colors duration-300">
                <h3 className="text-2xl font-semibold mb-4">GDPR Compliant</h3>
                <p className="text-teal-100">
                  Full compliance with European data protection regulations, ensuring 
                  complete user control over personal information.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 hover:bg-white/20 transition-colors duration-300">
                <h3 className="text-2xl font-semibold mb-4">HIPAA Aligned</h3>
                <p className="text-teal-100">
                  Following US healthcare privacy standards for secure handling and 
                  transmission of protected health information.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-8 hover:bg-white/20 transition-colors duration-300">
                <h3 className="text-2xl font-semibold mb-4">PIPEDA Aligned</h3>
                <p className="text-teal-100">
                  Following Canadian privacy principles for responsible collection, 
                  use, and disclosure of personal information.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-xl text-teal-100 mb-8">
              Open-source commitment for transparency and community collaboration
            </p>
            <Button
              variant="outline"
              className="rounded-full px-8 border-white text-white hover:bg-white hover:text-teal-900 transition-all duration-300"
            >
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-teal-50">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-teal-900">
                Join the Healthcare Revolution
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Be part of the solution. Help us provide secure, accessible healthcare 
              to millions of displaced individuals worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/register">
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg hover:shadow-xl transition-all duration-300 h-14 text-lg"
                >
                  Get Started Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 border-gray-300 hover:bg-gray-50 transition-all duration-300 h-14 text-lg"
                >
                  Contact Our Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          {/* Organizations Section */}
          <div className="mb-12 pb-12 border-b border-gray-800">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-6">An Open Source Initiative</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                LeLink is proudly maintained as an open-source project by <a href="https://hora-ev.eu" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors">Hora e.V.</a> 
                in collaboration with Modern-Miracle.eu, dedicated to providing 
                secure healthcare access for displaced populations worldwide.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-6">
                <div className="text-center">
                  <h4 className="font-semibold text-teal-400 mb-1">Hora e.V.</h4>
                  <p className="text-sm text-gray-400">ZVR: 1335812639</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-teal-400 mb-1">Modern-Miracle.eu</h4>
                  <p className="text-sm text-gray-400">Technology Partner</p>
                </div>
              </div>
              <div className="flex justify-center mb-6">
                <img 
                  src="/Logo.png" 
                  alt="LeLink Logo" 
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-lg text-teal-100 mb-4">
                Open-source commitment for transparency and community collaboration
              </p>
              <a
                href="https://github.com/Modern-Miracle/LeLink"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white text-teal-600">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">LeLink</span>
            </div>
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Hora e.V. & Modern-Miracle.eu | Open Source Healthcare
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-teal-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-teal-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/compliance" className="hover:text-teal-400 transition-colors">
                Compliance
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}