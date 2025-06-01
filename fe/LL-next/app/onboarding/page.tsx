'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, MapPin, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

// Full onboarding schema for Google users
const fullOnboardingSchema = z.object({
  givenName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Last name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  role: z.enum(['Patient', 'Practitioner'], {
    required_error: 'Please select your role',
  }),
  streetAddress: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country/Region is required'),
});

// Simple role selection schema for Azure B2C users
const roleOnlySchema = z.object({
  role: z.enum(['Patient', 'Practitioner'], {
    required_error: 'Please select your role',
  }),
});

type FullOnboardingFormData = z.infer<typeof fullOnboardingSchema>;
type RoleOnlyFormData = z.infer<typeof roleOnlySchema>;
type OnboardingFormData = FullOnboardingFormData | RoleOnlyFormData;

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('[ONBOARDING_DEBUG] User needs onboarding:', session.user?.needsOnboarding, 'Provider:', session.user?.provider);

  // Redirect if user doesn't need onboarding
  if (session?.user && !session.user.needsOnboarding) {
    console.log('[ONBOARDING_DEBUG] User does not need onboarding, redirecting...');
    router.push('/dashboard');
    return null;
  }

  // Redirect if not authenticated
  if (!session?.user) {
    console.log('[ONBOARDING_DEBUG] No authenticated user, redirecting to login...');
    router.push('/login');
    return null;
  }

  // Determine if user is Azure B2C (only needs role selection) or Google (needs full form)
  const isAzureB2C = session.user?.provider === 'azure-ad-b2c';
  const isGoogle = session.user?.provider === 'google';

  console.log('[ONBOARDING_DEBUG] Provider:', session.user?.provider, 'isAzureB2C:', isAzureB2C, 'isGoogle:', isGoogle);

  // Use appropriate schema and defaults based on provider
  const schema = isAzureB2C ? roleOnlySchema : fullOnboardingSchema;
  
  const defaultValues = isAzureB2C 
    ? {
        role: session.user.role || 'Patient' as 'Patient' | 'Practitioner',
      }
    : {
        givenName: session.user.givenName || '',
        surname: session.user.surname || '',
        displayName: session.user.displayName || session.user.name || '',
        jobTitle: session.user.jobTitle || '',
        role: session.user.role || 'Patient' as 'Patient' | 'Practitioner',
        streetAddress: session.user.streetAddress || '',
        city: session.user.city || '',
        state: session.user.state || '',
        postalCode: session.user.postalCode || '',
        country: session.user.country || '',
      };

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: OnboardingFormData) => {
    console.log('[ONBOARDING_DEBUG] Submitting onboarding for provider:', session.user?.provider, 'isAzureB2C:', isAzureB2C);
    setIsSubmitting(true);

    try {
      // For Azure B2C, merge session data with role selection
      // For Google, use the full form data
      const submissionData = isAzureB2C ? {
        // Get existing info from session for Azure B2C users
        givenName: session.user?.givenName || '',
        surname: session.user?.surname || '',
        displayName: session.user?.displayName || session.user?.name || '',
        jobTitle: session.user?.jobTitle || '',
        city: session.user?.city || '',
        country: session.user?.country || '',
        postalCode: session.user?.postalCode || '',
        state: session.user?.state || '',
        streetAddress: session.user?.streetAddress || '',
        // Only role comes from the form for Azure B2C
        role: (data as RoleOnlyFormData).role,
      } : data;

      console.log('[ONBOARDING_DEBUG] Submitting data with role:', submissionData.role);

      // Use existing onboarding completion API
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete onboarding');
      }

      const result = await response.json();
      console.log('[ONBOARDING_DEBUG] Onboarding response:', result);

      // Update session with new user data
      console.log('[ONBOARDING_DEBUG] Updating session with needsOnboarding: false');
      try {
        const sessionUpdateResult = await updateSession({
          user: {
            ...session.user,
            ...submissionData,
            needsOnboarding: false,
          },
        });
        console.log('[ONBOARDING_DEBUG] Session update result:', sessionUpdateResult);
      } catch (updateError) {
        console.error('[ONBOARDING_DEBUG] Session update failed:', updateError);
      }

      toast.success(
        isAzureB2C 
          ? 'Account setup completed successfully!' 
          : 'Profile completed successfully!'
      );
      
      // Force session refresh and redirect
      console.log('[ONBOARDING_DEBUG] Onboarding completed, redirecting...');
      
      // Use window.location for immediate redirect - the auth callback will detect the change
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('[ONBOARDING_DEBUG] Error completing onboarding:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl bg-white/95 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-teal-600 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            {isAzureB2C ? 'Select Your Role' : 'Complete Your Profile'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isAzureB2C 
              ? 'Please select your role in the healthcare system' 
              : 'We need a few more details to set up your LeLink healthcare account'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {isAzureB2C ? (
                /* Azure B2C Role-Only Form */
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Welcome back! We already have your information from Microsoft.
                      Just select your role to complete setup.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-lg font-semibold text-gray-800">
                      <Briefcase className="h-5 w-5 text-teal-600" />
                      <span>Healthcare Role</span>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select your role in the healthcare system</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Choose your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Patient">Patient - I am seeking healthcare services</SelectItem>
                              <SelectItem value="Practitioner">Healthcare Practitioner - I provide medical care</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : (
                /* Google Full Onboarding Form */
                <>
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-lg font-semibold text-gray-800">
                      <User className="h-5 w-5 text-teal-600" />
                      <span>Personal Information</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="givenName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="How should we display your name?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-lg font-semibold text-gray-800">
                      <Briefcase className="h-5 w-5 text-teal-600" />
                      <span>Professional Information</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Physician, Nurse, Patient" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role in Healthcare System</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Patient">Patient</SelectItem>
                                <SelectItem value="Practitioner">Healthcare Practitioner</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-lg font-semibold text-gray-800">
                      <MapPin className="h-5 w-5 text-teal-600" />
                      <span>Address Information</span>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your state or province" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your postal code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country/Region</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (isAzureB2C ? 'Setting up your account...' : 'Completing Profile...') 
                  : (isAzureB2C ? 'Continue' : 'Complete Profile')
                }
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}