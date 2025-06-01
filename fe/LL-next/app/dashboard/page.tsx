'use client';

import { useSession } from 'next-auth/react';
import DashboardHeaderWithModal from '@/components/dashboard-header-with-modal';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import PractitionerDashboard from '@/components/dashboard/PractitionerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 ">
        <DashboardHeaderWithModal />
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please sign in to access your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = session.user?.role;

  // Route to appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (userRole) {
      case 'Patient':
        return <PatientDashboard />;
      case 'Practitioner':
      case 'Admin':
        return <PractitionerDashboard />;
      default:
        return (
          <div className="container mx-auto p-6">
            <Card>
              <CardHeader className="text-center">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <CardTitle>Role Not Assigned</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Your account doesn't have a role assigned. Please contact an administrator.
                </p>
                <p className="text-sm text-gray-500">User ID: {session.user?.id}</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeaderWithModal />
      {renderDashboard()}
    </div>
  );
}
