'use server';

import { redirect } from 'next/navigation';

export async function signInAction(prevState: string | undefined, formData: FormData): Promise<string | undefined> {
  try {
    // For server actions with NextAuth v4, redirect to the NextAuth signin page
    // The provider id matches what's configured in your auth.ts
    const callbackUrl = encodeURIComponent('/dashboard');
    redirect(`/api/auth/signin/azure-ad-b2c?callbackUrl=${callbackUrl}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Check if it's a redirect error (which is expected behavior)
      if (error.message.includes('NEXT_REDIRECT')) {
        throw error; // Re-throw redirect errors
      }
      return 'Something went wrong with Azure AD B2C authentication.';
    }
    throw error;
  }
}
