'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-react';
import { FhirResourcesTable } from '@/components/fhir';
import type { PatientResourcesData } from '@/lib/fhir-storage/types';

interface UserProfile {
  id: string;
  resourceType: string;
  name: {
    full: string;
    given: string[];
    family: string;
  };
  email: string;
  phone: string;
  address: any;
  jobTitle: string;
  lastUpdated: string;
  source: string;
}

interface UserProfileResponse {
  profile: UserProfile;
  resources: any[];
  resourcesByType: Record<string, any[]>;
  totalResources: number;
  resourceTypes: string[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [resourcesData, setResourcesData] = useState<PatientResourcesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      if (!userId) return;

      try {
        setIsLoading(true);
        console.log('[User Detail] Loading profile for user:', userId);

        const response = await fetch(`http://localhost:7071/api/fhir-storage/users/${userId}/profile`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            setUserProfile(data.data.profile);
            
            // Transform data to match FhirResourcesTable format
            const transformedData: PatientResourcesData = {
              patientId: userId,
              resources: data.data.resources,
              resourcesByType: data.data.resourcesByType,
              totalCount: data.data.totalResources,
              resourceTypes: data.data.resourceTypes,
            };
            
            setResourcesData(transformedData);
            console.log('[User Detail] Profile loaded successfully');
          } else {
            setError('Failed to load user profile');
          }
        } else if (response.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load user profile');
        }
      } catch (error) {
        console.error('[User Detail] Error loading profile:', error);
        setError('Network error while loading user profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">{error || 'User not found'}</h2>
          <p className="mt-2 text-sm text-gray-500">
            Unable to load user profile. Please try again or contact support.
          </p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getResourceCount = (type: string) => {
    return resourcesData?.resourcesByType?.[type]?.length || 0;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{userProfile.name.full}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={userProfile.resourceType === 'Patient' ? 'default' : 'secondary'}>
                {userProfile.resourceType}
              </Badge>
              <span className="text-sm text-gray-500">ID: {userProfile.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourcesData?.totalCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Medical records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Observations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResourceCount('Observation')}</div>
            <p className="text-xs text-muted-foreground">
              Health observations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Assessments</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResourceCount('RiskAssessment')}</div>
            <p className="text-xs text-muted-foreground">
              Clinical assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="records">Medical Records</TabsTrigger>
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="assessments">Risk Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                User contact details and demographics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-lg">{userProfile.name.full}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-lg">{userProfile.email || 'Not provided'}</p>
                    </div>
                  </div>

                  {userProfile.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-lg">{userProfile.phone}</p>
                      </div>
                    </div>
                  )}

                  {userProfile.jobTitle && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Job Title</p>
                        <p className="text-lg">{userProfile.jobTitle}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {userProfile.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <div className="text-lg space-y-1">
                          {userProfile.address.line?.map((line: string, i: number) => (
                            <p key={i}>{line}</p>
                          ))}
                          <p>
                            {userProfile.address.city}, {userProfile.address.state} {userProfile.address.postalCode}
                          </p>
                          <p>{userProfile.address.country}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p className="text-lg">{formatDate(userProfile.lastUpdated)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Source</p>
                      <p className="text-lg">{userProfile.source || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Medical Records</CardTitle>
              <CardDescription>
                Complete medical history and records for {userProfile.name.full}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resourcesData ? (
                <FhirResourcesTable resourcesData={resourcesData} />
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This user doesn't have any medical records yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Observations</CardTitle>
              <CardDescription>
                Clinical observations and measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resourcesData?.resourcesByType?.Observation && resourcesData.resourcesByType.Observation.length > 0 ? (
                <div className="space-y-4">
                  {resourcesData.resourcesByType.Observation.map((obs: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{obs.code?.text || 'Observation'}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {obs.valueString || obs.valueQuantity?.value + ' ' + obs.valueQuantity?.unit || 'No value recorded'}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(obs.effectiveDateTime || obs.meta?.lastUpdated).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No observations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No health observations recorded for this user.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessments</CardTitle>
              <CardDescription>
                Clinical risk assessments and evaluations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resourcesData?.resourcesByType?.RiskAssessment && resourcesData.resourcesByType.RiskAssessment.length > 0 ? (
                <div className="space-y-4">
                  {resourcesData.resourcesByType.RiskAssessment.map((assessment: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{assessment.code?.text || 'Risk Assessment'}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Prediction: {assessment.prediction?.[0]?.outcome?.text || 'Not specified'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Probability: {assessment.prediction?.[0]?.probabilityDecimal ? 
                              (assessment.prediction[0].probabilityDecimal * 100).toFixed(1) + '%' : 'Not specified'}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(assessment.occurrenceDateTime || assessment.meta?.lastUpdated).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No risk assessments recorded for this user.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}