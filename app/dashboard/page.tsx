import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, MessageSquare, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import MedicalHistoryList from "@/components/medical-history-list"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-teal-50/30">
      <DashboardHeader />
      <main className="flex-1 space-y-8 p-6 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-600">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, John Doe</p>
          </div>
          <Link href="/dashboard/triage">
            <Button className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all duration-300 h-11">
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Triage Chat
            </Button>
          </Link>
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
              <p className="text-xs text-muted-foreground mt-1">
                Based on your last check-up
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Overall Health</span>
                  <span className="font-medium">85%</span>
                </div>
                <Progress value={85} className="h-1.5 bg-teal-100" indicatorClassName="bg-gradient-to-r from-teal-500 to-teal-600" />
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
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: March 28, 2025
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Blockchain protected
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Action required
              </p>
              <div className="mt-4 flex items-center text-xs text-amber-600">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
                <span>Medication refill needed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full h-12 border shadow-sm">
            <TabsTrigger value="overview" className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300">Overview</TabsTrigger>
            <TabsTrigger value="history" className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300">Medical History</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-7">
              <Card className="md:col-span-4 border-none shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                  <CardTitle>Recent Medical History</CardTitle>
                  <CardDescription>
                    Your last 5 medical records
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <MedicalHistoryList limit={5} />
                </CardContent>
              </Card>
              
              <Card className="md:col-span-3 border-none shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                  <CardTitle>Health Insights</CardTitle>
                  <CardDescription>
                    AI-generated health recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-teal-600"
                          >
                            <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.743-.95l.09-.73c.145-1.192-.585-2.334-1.761-2.551l-1.551-.288c-.57-.107-1.066-.385-1.429-.814L11.634 8.6c-.802-.95-2.272-.95-3.074 0l-1.77 2.098c-.363.429-.859.707-1.429.814l-1.55.288c-1.177.217-1.907 1.359-1.761 2.552l.232 1.906c.033.272-.108.538-.346.65a.89.89 0 0 1-.754.072l-1.428-.454a.644.644 0 0 1-.07-.03c-.683-.31-1.115-.99-1.115-1.72 0-.256.053-.512.156-.75l.707-1.613c.324-.736.148-1.6-.443-2.16l-1.568-1.568c-.47-.47-.706-1.087-.706-1.704s.235-1.233.706-1.704l1.568-1.568c.591-.591.767-1.454.443-2.16l-.707-1.613a1.95 1.95 0 0 1-.156-.75c0-.73.432-1.41 1.115-1.72.683-.31 1.483-.177 2.03.341l1.568 1.568c.59.59 1.453.767 2.16.443l1.613-.707a1.95 1.95 0 0 1 .75-.156c.73 0 1.41.432 1.72 1.115.31.683.177 1.483-.341 2.03l-1.568 1.568c-.59.59-.767 1.453-.443 2.16l.707 1.613a1.95 1.95 0 0 1 .156.75c0 .73-.432 1.41-1.115 1.72z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">Exercise Recommendation</h4>
                          <p className="text-xs text-muted-foreground">Based on your recent check-up results, incorporating 30 minutes of moderate aerobic activity 3-4 times per week could help improve your overall cardiovascular health.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-teal-600"
                          >
                            <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8Z" />
                            <path d="M9.5 9A2.5 2.5 0 0 1 12 6.5" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">Dietary Suggestion</h4>
                          <p className="text-xs text-muted-foreground">Your lab results show slightly elevated cholesterol. Consider increasing intake of omega-3 fatty acids through foods like fatty fish, flaxseeds, and walnuts.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-amber-600"
                          >
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">Medication Reminder</h4>
                          <p className="text-xs text-muted-foreground">Your prescription for Lisinopril needs to be refilled within the next 5 days. Contact your provider or use our medication refill feature.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle>Complete Medical History</CardTitle>
                <CardDescription>
                  All your medical records in one place
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <MedicalHistoryList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Manage your personal and medical details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Name</h3>
                      <p className="text-sm">John Doe</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Date of Birth</h3>
                      <p className="text-sm">January 15, 1985</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Gender</h3>
                      <p className="text-sm">Male</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Blood Type</h3>
                      <p className="text-sm">O+</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Contact Number</h3>
                      <p className="text-sm">+1 (555) 123-4567</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Email</h3>
                      <p className="text-sm">john.doe@example.com</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Address</h3>
                      <p className="text-sm">123 Main Street, Apt 4B<br />New York, NY 10001</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Emergency Contact</h3>
                      <p className="text-sm">Jane Doe<br />+1 (555) 987-6543</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button className="rounded-full px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all duration-300">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}