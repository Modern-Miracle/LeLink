'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  FileText,
  Activity,
  MessageSquare,
  Stethoscope,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { FhirResourcesTable } from '@/components/fhir/FhirResourcesTable';
import TriageModal from '@/components/triage-modal';
import { getCurrentUserResources, getAllUsers, getUserProfile } from '@/lib/fhir-storage/actions';

interface UserData {
  id: string;
  resourceType: string;
  name: string;
  email: string;
  lastUpdated: string;
  resourceCount: number;
}

interface UserProfile {
  profile: {
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
  };
  resources: any[];
  resourcesByType: Record<string, any[]>;
  totalResources: number;
  resourceTypes: string[];
}

export default function PractitionerDashboard() {
  const { data: session } = useSession();
  const [triageOpen, setTriageOpen] = useState(false);
  const [practitionerData, setPractitionerData] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalPractitioners: 0,
    totalRecords: 0,
    activeToday: 0,
  });

  // Load practitioner's own data
  useEffect(() => {
    async function loadPractitionerData() {
      try {
        console.log('🩺 [Practitioner Dashboard] Loading practitioner data...');

        const resourcesResult = await getCurrentUserResources();
        if (resourcesResult.success && resourcesResult.data) {
          setPractitionerData(resourcesResult.data);
          console.log('✅ [Practitioner Dashboard] Resources loaded:', resourcesResult.data.resources.length);
        } else {
          console.log('❌ [Practitioner Dashboard] Failed to load resources:', resourcesResult.error);
        }
      } catch (error) {
        console.error('❌ [Practitioner Dashboard] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPractitionerData();
  }, []);

  // Load users list
  const loadUsers = async (page = 1, searchTerm = '') => {
    try {
      setIsUsersLoading(true);
      console.log('👥 [Practitioner Dashboard] Loading users...', { page, searchTerm });

      const usersResult = await getAllUsers(page, pagination.limit, searchTerm);

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data.users);
        setPagination(usersResult.data.pagination);

        // Calculate stats
        const patients = usersResult.data.users.filter((u) => u.resourceType === 'Patient').length;
        const practitioners = usersResult.data.users.filter((u) => u.resourceType === 'Practitioner').length;
        const totalRecords = usersResult.data.users.reduce((sum, u) => sum + u.resourceCount, 0);
        const today = new Date().toDateString();
        const activeToday = usersResult.data.users.filter(
          (u) => new Date(u.lastUpdated).toDateString() === today
        ).length;

        setStats({
          totalPatients: patients,
          totalPractitioners: practitioners,
          totalRecords,
          activeToday,
        });

        console.log('✅ [Practitioner Dashboard] Users loaded:', usersResult.data.users.length);
      } else {
        console.error('❌ [Practitioner Dashboard] Failed to load users:', usersResult.error);
      }
    } catch (error) {
      console.error('❌ [Practitioner Dashboard] Error loading users:', error);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, search);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1, search);
  };

  const handlePageChange = (newPage: number) => {
    loadUsers(newPage, search);
  };

  const handleViewUser = async (userId: string) => {
    try {
      console.log('👤 [Practitioner Dashboard] Loading user profile:', userId);

      const profileResult = await getUserProfile(userId);
      if (profileResult.success && profileResult.data) {
        setSelectedUser(profileResult.data);
        setUserModalOpen(true);
        console.log('✅ [Practitioner Dashboard] User profile loaded');
      } else {
        console.error('❌ [Practitioner Dashboard] Failed to load user profile:', profileResult.error);
      }
    } catch (error) {
      console.error('❌ [Practitioner Dashboard] Error loading user profile:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-teal-50/30">
        <main className="flex-1 space-y-8 p-6 md:p-10">
          <div className="container mx-auto max-w-7xl space-y-8">
            {/* Header Loading */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-80 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-11 bg-gradient-to-r from-teal-200 to-teal-100 rounded-full w-48 animate-pulse"></div>
            </div>

            {/* Profile Card Loading */}
            <Card className="overflow-hidden border-none shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-50 via-teal-50/50 to-white">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-200 to-teal-100 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-48 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-36 animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-gradient-to-br from-gray-200 to-gray-100 rounded animate-pulse"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-20 animate-pulse"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards Loading */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-none shadow-md bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                    <div className="space-y-2">
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-20 animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-200 to-teal-100 animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-16 animate-pulse"></div>
                          <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-10 animate-pulse"></div>
                        </div>
                        <div className="h-2 bg-gradient-to-r from-teal-200 to-teal-100 rounded-full w-full animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* User Management Loading */}
            <Card className="overflow-hidden border-none shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-50 via-teal-50/50 to-white">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-200 to-teal-100 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-36 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-48 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-64 animate-pulse"></div>
                    <div className="h-10 w-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-200 to-teal-100 animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-32 animate-pulse"></div>
                              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full w-16 animate-pulse"></div>
                            </div>
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-48 animate-pulse"></div>
                            <div className="flex gap-4">
                              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-20 animate-pulse"></div>
                              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-28 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div className="h-9 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const practitionerProfile = practitionerData?.resources?.find((r: any) => r.resourceType === 'Practitioner');

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-teal-50/30">
      <main className="flex-1 space-y-8 p-6 md:p-10">
        <div className="container mx-auto space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">
                Practitioner Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, Dr. {practitionerProfile?.name?.[0]?.given?.join(' ')}{' '}
                {practitionerProfile?.name?.[0]?.family || session?.user?.name || 'Practitioner'}
              </p>
            </div>
            <Button
              onClick={() => setTriageOpen(true)}
              className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all duration-300 h-11"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Clinical Assessment
            </Button>
          </div>

          {/* Practitioner Profile Overview */}
          {practitionerProfile && (
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-50 via-teal-50/50 to-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">My Professional Profile</div>
                    <div className="text-sm text-muted-foreground">Healthcare Provider Information</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Full Name</div>
                        <div className="text-sm text-muted-foreground">
                          {practitionerProfile.name?.[0]?.text ||
                            `${practitionerProfile.name?.[0]?.given?.join(' ')} ${
                              practitionerProfile.name?.[0]?.family
                            }`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">
                          {practitionerProfile.telecom?.find((t: any) => t.system === 'email')?.value || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Phone</div>
                        <div className="text-sm text-muted-foreground">
                          {practitionerProfile.telecom?.find((t: any) => t.system === 'phone')?.value || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Specialization</div>
                        <div className="text-sm text-muted-foreground">
                          {practitionerProfile.qualification?.[0]?.code?.text || 'General Practitioner'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Address</div>
                        <div className="text-sm text-muted-foreground">
                          {practitionerProfile.address?.[0]
                            ? `${practitionerProfile.address[0].line?.join(', ') || ''} ${
                                practitionerProfile.address[0].city || ''
                              } ${practitionerProfile.address[0].state || ''}`.trim() || 'Not provided'
                            : 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Last Updated</div>
                        <div className="text-sm text-muted-foreground">
                          {practitionerProfile.meta?.lastUpdated
                            ? formatDate(practitionerProfile.meta.lastUpdated)
                            : 'Not available'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered patients</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Patient Load</span>
                    <span className="font-medium">{Math.min(100, stats.totalPatients * 5)}%</span>
                  </div>
                  <Progress
                    // @ts-ignore
                    value={Math.min(100, stats.totalPatients * 5)}
                    max={100}
                    className="h-1.5 bg-teal-100"
                    indicatorClassName="bg-gradient-to-r from-teal-500 to-teal-600"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalRecords}</div>
                <p className="text-xs text-muted-foreground mt-1">Total medical records</p>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-teal-500 mr-1"></span>
                  <span>{stats.activeToday} updated today</span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                <CardTitle className="text-sm font-medium">Healthcare Team</CardTitle>
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalPractitioners}</div>
                <p className="text-xs text-muted-foreground mt-1">Healthcare providers</p>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  <span>All systems operational</span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 via-teal-50/30 to-white">
                <CardTitle className="text-sm font-medium">Activity Today</CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.activeToday}</div>
                <p className="text-xs text-muted-foreground mt-1">Recent activity</p>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-teal-500 mr-1"></span>
                  <span>Active sessions monitored</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management Section */}
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-teal-50 via-teal-50/50 to-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Patient Management</div>
                      <div className="text-sm text-muted-foreground">Monitor and manage patient profiles</div>
                    </div>
                  </CardTitle>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Search patients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                  />
                  <Button type="submit" variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isUsersLoading ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                            <User className="h-6 w-6 text-teal-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                              <Badge
                                variant={user.resourceType === 'Patient' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {user.resourceType}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-400">
                                {user.resourceCount} record{user.resourceCount !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-gray-400">Updated: {formatDate(user.lastUpdated)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleViewUser(user.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No users found</p>
                      {search && <p className="text-sm">Try adjusting your search criteria</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                  <div className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm font-medium px-3">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      variant="outline"
                      size="sm"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* User Profile Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <div>Patient Profile</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {selectedUser?.profile?.name?.full || 'Patient Information'}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Profile Information */}
              <Card className="border-none shadow-md bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-teal-50 via-teal-50/50 to-white">
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Full Name</div>
                      <div className="text-sm text-muted-foreground">{selectedUser.profile.name.full}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">{selectedUser.profile.email}</div>
                    </div>
                  </div>
                  {selectedUser.profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Phone</div>
                        <div className="text-sm text-muted-foreground">{selectedUser.profile.phone}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Last Updated</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(selectedUser.profile.lastUpdated)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Records with FHIR Resources Table */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medical Records ({selectedUser.totalResources})
                </h3>
                {selectedUser.resources && selectedUser.resources.length > 0 ? (
                  <FhirResourcesTable 
                    resourcesData={{
                      resources: selectedUser.resources,
                      totalCount: selectedUser.totalResources,
                      resourcesByType: selectedUser.resourcesByType,
                      resourceTypes: selectedUser.resourceTypes,
                      patientId: selectedUser.profile.id
                    }}
                    loading={false}
                  />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No medical records available</p>
                      <p className="text-sm text-gray-400 mt-1">
                        This patient hasn't completed any health assessments yet
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Triage Modal */}
      <TriageModal open={triageOpen} onOpenChange={setTriageOpen} />
    </div>
  );
}
