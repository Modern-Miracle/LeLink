'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import DashboardHeaderWithModal from '@/components/dashboard-header-with-modal';
import { Progress } from '@/components/ui/progress';
import TriageModal from '@/components/triage-modal';
import { FhirResourcesTable } from '@/components/fhir';

export default function DashboardPage() {
  const [triageOpen, setTriageOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-teal-50/30">
      <DashboardHeaderWithModal triageOpen={triageOpen} onTriageOpenChange={setTriageOpen} />
      <main className="flex-1 space-y-8 p-6 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back, John Doe</p>
          </div>
          <Button
            onClick={() => setTriageOpen(true)}
            className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all duration-300 h-11"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Start Triage Chat
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Health Status</CardTitle>
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">Good</div>
              <p className="text-xs text-muted-foreground mt-1">Based on your last check-up</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Overall Health</span>
                  <span className="font-medium">85%</span>
                </div>
                <Progress
                  // @ts-ignore
                  value={85}
                  max={100}
                  className="h-1.5 bg-teal-100"
                  indicatorClassName="bg-gradient-to-r from-teal-500 to-teal-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground mt-1">Last updated: March 28, 2025</p>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-teal-500 mr-1"></span>
                <span>2 new records in the last month</span>
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
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                <span>All systems operational</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground mt-1">Action required</p>
              <div className="mt-4 flex items-center text-xs text-amber-600">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
                <span>Medication refill needed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <FhirResourcesTable />
        </div>
      </main>

      <TriageModal open={triageOpen} onOpenChange={setTriageOpen} />
    </div>
  );
}
