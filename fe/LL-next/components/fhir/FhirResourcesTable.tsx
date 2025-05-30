"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  User, 
  MessageSquare, 
  Activity, 
  Shield,
  Calendar,
  Hash,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { AnyFhirResource, Patient, Encounter, Observation, RiskAssessment } from "@/lib/types/fhir";

interface FhirResourcesTableProps {
  className?: string;
}

export function FhirResourcesTable({ className }: FhirResourcesTableProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientsRes, encountersRes, observationsRes, riskAssessmentsRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/ecounter'),
        fetch('/api/observations'),
        fetch('/api/risk-assessments')
      ]);

      if (!patientsRes.ok) throw new Error('Failed to fetch patients');
      if (!encountersRes.ok) throw new Error('Failed to fetch encounters');
      if (!observationsRes.ok) throw new Error('Failed to fetch observations');
      if (!riskAssessmentsRes.ok) throw new Error('Failed to fetch risk assessments');

      const [patientsData, encountersData, observationsData, riskAssessmentsData] = await Promise.all([
        patientsRes.json(),
        encountersRes.json(),
        observationsRes.json(),
        riskAssessmentsRes.json()
      ]);

      setPatients(patientsData);
      setEncounters(encountersData);
      setObservations(observationsData);
      setRiskAssessments(riskAssessmentsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'final':
      case 'finished':
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Final</Badge>;
      case 'preliminary':
      case 'in-progress':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Preliminary</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
      case 'moderate':
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge variant="default" className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">{risk || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading FHIR resources...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8 text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Error loading data: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-teal-600" />
                <span>FHIR Resources</span>
              </CardTitle>
              <CardDescription>
                Clinical data collected during triage assessments
              </CardDescription>
            </div>
            <Button 
              onClick={fetchData} 
              variant="outline" 
              size="sm"
              className="rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full h-12 border shadow-sm">
              <TabsTrigger value="overview" className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300">
                Overview ({patients.length + encounters.length + observations.length + riskAssessments.length})
              </TabsTrigger>
              <TabsTrigger value="patients" className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300">
                <User className="h-4 w-4 mr-1" />
                Patients ({patients.length})
              </TabsTrigger>
              <TabsTrigger value="encounters" className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300">
                <MessageSquare className="h-4 w-4 mr-1" />
                Encounters ({encounters.length})
              </TabsTrigger>
              <TabsTrigger value="observations" className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300">
                <Activity className="h-4 w-4 mr-1" />
                Observations ({observations.length})
              </TabsTrigger>
              <TabsTrigger value="risks" className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300">
                <Shield className="h-4 w-4 mr-1" />
                Risk Assessments ({riskAssessments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-4 text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{patients.length}</div>
                  <div className="text-sm text-muted-foreground">Patients</div>
                </Card>
                <Card className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{encounters.length}</div>
                  <div className="text-sm text-muted-foreground">Encounters</div>
                </Card>
                <Card className="p-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">{observations.length}</div>
                  <div className="text-sm text-muted-foreground">Observations</div>
                </Card>
                <Card className="p-4 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold">{riskAssessments.length}</div>
                  <div className="text-sm text-muted-foreground">Risk Assessments</div>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource Type</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ...patients.slice(0, 2).map(p => ({ type: 'Patient', id: p.id, status: 'Active', date: p.meta?.lastUpdated })),
                        ...encounters.slice(0, 2).map(e => ({ type: 'Encounter', id: e.id, status: e.status, date: e.meta?.lastUpdated })),
                        ...observations.slice(0, 2).map(o => ({ type: 'Observation', id: o.id, status: o.status, date: o.meta?.lastUpdated })),
                        ...riskAssessments.slice(0, 2).map(r => ({ type: 'RiskAssessment', id: r.id, status: r.status, date: r.meta?.lastUpdated }))
                      ].slice(0, 8).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.type}</TableCell>
                          <TableCell className="font-mono text-sm">
                            <Hash className="h-3 w-3 inline mr-1" />
                            {item.id || 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status || 'Unknown')}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(item.date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patients">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Birth Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-sm">
                        <Hash className="h-3 w-3 inline mr-1" />
                        {patient.id || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {patient.name?.[0] ? 
                          `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>{patient.gender || 'N/A'}</TableCell>
                      <TableCell>{patient.birthDate || 'N/A'}</TableCell>
                      <TableCell>
                        {patient.telecom?.[0]?.value || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(patient.meta?.lastUpdated)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {patients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="encounters">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {encounters.map((encounter) => (
                    <TableRow key={encounter.id}>
                      <TableCell className="font-mono text-sm">
                        <Hash className="h-3 w-3 inline mr-1" />
                        {encounter.id || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(encounter.status || 'Unknown')}</TableCell>
                      <TableCell>
                        {encounter.class?.display || encounter.class?.code || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {encounter.subject?.reference || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {encounter.period?.start ? formatDate(encounter.period.start) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(encounter.meta?.lastUpdated)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {encounters.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No encounters found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="observations">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Effective Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {observations.map((observation) => (
                    <TableRow key={observation.id}>
                      <TableCell className="font-mono text-sm">
                        <Hash className="h-3 w-3 inline mr-1" />
                        {observation.id || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(observation.status || 'Unknown')}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {observation.code?.text || observation.code?.coding?.[0]?.display || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {observation.valueString || 
                         (observation.valueQuantity ? `${observation.valueQuantity.value} ${observation.valueQuantity.unit || ''}` : '') ||
                         observation.valueCodeableConcept?.text ||
                         (observation.valueBoolean !== undefined ? (observation.valueBoolean ? 'Yes' : 'No') : '') ||
                         'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {observation.subject?.reference || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(observation.effectiveDateTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {observations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No observations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="risks">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Occurrence Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskAssessments.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell className="font-mono text-sm">
                        <Hash className="h-3 w-3 inline mr-1" />
                        {risk.id || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(risk.status || 'Unknown')}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {risk.code?.text || risk.code?.coding?.[0]?.display || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(
                          risk.prediction?.[0]?.qualitativeRisk?.text || 
                          risk.prediction?.[0]?.qualitativeRisk?.coding?.[0]?.display
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {risk.subject?.reference || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(risk.occurrenceDateTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {riskAssessments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No risk assessments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}