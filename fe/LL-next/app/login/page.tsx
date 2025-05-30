'use client';

import { signIn } from 'next-auth/react';
import { Shield, Heart, Lock, ArrowRight, Mail, Globe, Apple, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 flex flex-col lg:flex-row">
      {/* Left Side - Branding */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="max-w-md mx-auto lg:mx-0">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-teal-600 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">LeLink</h1>
              <p className="text-sm text-teal-600 font-medium">Healthcare Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Secure Healthcare
            <span className="text-teal-600"> Access</span>
          </h2>

          <p className="text-lg text-gray-600 mb-8">
            Connect to your medical data with enterprise-grade security and blockchain-verified audit trails.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lock className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-gray-700">End-to-end encryption</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-gray-700">FHIR-compliant data</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-gray-700">Blockchain audit trails</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 bg-white/70 backdrop-blur-sm">
        <div className="max-w-md mx-auto w-full">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access your secure healthcare dashboard
              </CardDescription>
              <div className="flex justify-center pt-2">
                <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                  ✨ PWA Enabled - Works Offline
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Primary Sign In */}
              <Button
                onClick={() => signIn('azure-ad-b2c', { callbackUrl: '/dashboard' })}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg group"
              >
                <Mail className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                Sign in with Email
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social Sign In Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => signIn('azure-ad-b2c', { callbackUrl: '/dashboard' })}
                  className="h-12 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                >
                  <svg className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#00BCF2" d="M0 0h11.33v11.33H0z" />
                    <path fill="#0078D4" d="M12.67 0H24v11.33H12.67z" />
                    <path fill="#00BCF2" d="M0 12.67h11.33V24H0z" />
                    <path fill="#40E0D0" d="M12.67 12.67H24V24H12.67z" />
                  </svg>
                  Microsoft
                </Button>

                <Button
                  variant="outline"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="h-12 border-gray-200 hover:border-red-300 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                >
                  <Chrome className="h-5 w-5 mr-2 text-red-500 group-hover:scale-110 transition-transform" />
                  Google
                </Button>
              </div>

              {/* Additional Options */}
              <Button
                variant="outline"
                onClick={() => signIn('azure-ad-b2c', { callbackUrl: '/dashboard' })}
                className="w-full h-12 border-gray-200 hover:border-gray-800 hover:bg-gray-900 hover:text-white rounded-xl transition-all duration-200 group"
              >
                <Apple className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                Continue with Apple
              </Button>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => signIn('azure-ad-b2c', { callbackUrl: '/dashboard' })}
                    className="font-medium text-teal-600 hover:text-teal-500 hover:underline transition-colors"
                  >
                    Create one now
                  </button>
                </p>
                <p className="text-center text-xs text-gray-500 mt-2">Protected by Azure AD B2C</p>
              </div>
            </CardContent>
          </Card>

          {/* Features Footer */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center">
                <Lock className="h-4 w-4 mr-1" />
                Secure
              </span>
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                HIPAA Ready
              </span>
              <span className="flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                Blockchain
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
