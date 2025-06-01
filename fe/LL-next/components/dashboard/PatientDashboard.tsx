'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Shield, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import TriageModal from '@/components/triage-modal';
import { FhirResourcesTable } from '@/components/fhir';
import { getCurrentUserResources, checkFHIRStorageHealth } from '@/lib/fhir-storage';
import { createResourcesSummary } from '@/lib/fhir-storage/utils';
import type { PatientResourcesData } from '@/lib/fhir-storage/types';
import { useSession } from 'next-auth/react';

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [triageOpen, setTriageOpen] = useState(false);
  const [resourcesData, setResourcesData] = useState<PatientResourcesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  useEffect(() => {
    async function loadPatientData() {
      try {
        console.log('🏥 [Patient Dashboard] Loading patient data...');

        // Load patient's FHIR resources
        const resourcesResult = await getCurrentUserResources();

        if (resourcesResult.success && resourcesResult.data) {
          setResourcesData(resourcesResult.data);
          console.log('✅ [Patient Dashboard] Resources loaded:', resourcesResult.data.resources.length);
        } else {
          console.log('❌ [Patient Dashboard] Failed to load resources:', resourcesResult.error);
        }

        // Check FHIR storage health
        const healthResult = await checkFHIRStorageHealth();
        if (healthResult.success) {
          setHealthStatus('healthy');
        } else {
          setHealthStatus('error');
        }
      } catch (error) {
        console.error('❌ [Patient Dashboard] Error loading data:', error);
        setHealthStatus('error');
      } finally {
        setIsLoading(false);
      }
    }

    loadPatientData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-teal-50/30">
        <main className="flex-1 space-y-8 p-6 md:p-10">
          <div className="container mx-auto max-w-7xl space-y-8">
            {/* Header Loading */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-72 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-40 animate-pulse"></div>
              </div>
              <div className="h-11 bg-gradient-to-r from-teal-200 to-teal-100 rounded-full w-52 animate-pulse"></div>
            </div>

            {/* Patient Statistics Cards Loading */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* My Records Card */}
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-200 to-teal-100 animate-pulse"></div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-32 animate-pulse"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-teal-200 to-teal-100 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-36 animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Health Status Card */}
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-200 to-teal-100 animate-pulse"></div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-40 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-28 animate-pulse"></div>
                        <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-8 animate-pulse"></div>
                      </div>
                      <div className="h-2 bg-gradient-to-r from-teal-200 to-teal-100 rounded-full w-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Privacy Card */}
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-22 animate-pulse"></div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-200 to-teal-100 animate-pulse"></div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-14 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-32 animate-pulse"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-200 to-green-100 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessments Card */}
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                  <div className="space-y-2">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-28 animate-pulse"></div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 animate-pulse"></div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-8 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-32 animate-pulse"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-teal-200 to-teal-100 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-28 animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FHIR Resources Table Loading */}
            <div className="space-y-6">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-teal-50 via-teal-50/50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-48 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="h-9 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full w-20 animate-pulse"></div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Tab Navigation Loading */}
                  <div className="flex gap-2 bg-white/50 p-1 rounded-full w-fit">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full w-24 animate-pulse"
                      ></div>
                    ))}
                  </div>

                  {/* Overview Cards Loading */}
                  <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="p-4 text-center">
                        <div className="h-8 w-8 mx-auto mb-2 bg-gradient-to-br from-gray-200 to-gray-100 rounded animate-pulse"></div>
                        <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-8 mx-auto mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-16 mx-auto animate-pulse"></div>
                      </Card>
                    ))}
                  </div>

                  {/* Table Loading */}
                  <Card>
                    <CardHeader>
                      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-32 animate-pulse"></div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-3 p-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse"></div>
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-20 animate-pulse"></div>
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-16 animate-pulse"></div>
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-28 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const summary = resourcesData ? createResourcesSummary(resourcesData.resources) : null;
  const patientName = session?.user?.name || 'Patient';
  const totalRecords = resourcesData?.totalCount || 0;
  const observationsCount = resourcesData?.resourcesByType?.Observation?.length || 0;
  const riskAssessmentsCount = resourcesData?.resourcesByType?.RiskAssessment?.length || 0;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-teal-50/30">
      <main className="flex-1 space-y-8 p-6 md:p-10 ">
        <div className="container mx-auto space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">
                My Health Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Welcome back, {patientName}</p>
            </div>
            <Button
              onClick={() => setTriageOpen(true)}
              className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all duration-300 h-11"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Health Assessment
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle className="text-sm font-medium">My Records</CardTitle>
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalRecords}</div>
                <p className="text-xs text-muted-foreground mt-1">Total medical records</p>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-teal-500 mr-1"></span>
                  <span>{observationsCount} observations recorded</span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{observationsCount > 0 ? 'Good' : 'Getting Started'}</div>
                <p className="text-xs text-muted-foreground mt-1">Based on your assessments</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Profile Completeness</span>
                    <span className="font-medium">{Math.min(100, totalRecords * 20)}%</span>
                  </div>
                  <Progress
                    // @ts-ignore
                    value={Math.min(100, totalRecords * 20)}
                    max={100}
                    className="h-1.5 bg-teal-100"
                    indicatorClassName="bg-gradient-to-r from-teal-500 to-teal-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle className="text-sm font-medium">Data Privacy</CardTitle>
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">Secure</div>
                <p className="text-xs text-muted-foreground mt-1">Blockchain protected</p>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <span
                    className={`inline-block h-2 w-2 rounded-full mr-1 ${
                      healthStatus === 'healthy'
                        ? 'bg-green-500'
                        : healthStatus === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  <span>
                    {healthStatus === 'healthy'
                      ? 'All systems operational'
                      : healthStatus === 'warning'
                      ? 'Some issues detected'
                      : 'System issues'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle className="text-sm font-medium">Risk Assessments</CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{riskAssessmentsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Clinical assessments</p>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-teal-500 mr-1"></span>
                  <span>
                    {resourcesData?.resources?.length
                      ? `Last updated: ${new Date(
                          Math.max(...resourcesData.resources.map((r) => new Date(r.meta?.lastUpdated || 0).getTime()))
                        ).toLocaleDateString()}`
                      : 'No recent activity'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {resourcesData ? (
              <FhirResourcesTable resourcesData={resourcesData} />
            ) : (
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start a health assessment to begin building your medical profile.
                    </p>
                    <div className="mt-6">
                      <Button
                        onClick={() => setTriageOpen(true)}
                        className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Start Assessment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Triage Modal */}
      <TriageModal open={triageOpen} onOpenChange={setTriageOpen} />
    </div>
  );
}
