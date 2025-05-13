import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Activity, AlertTriangle, Heart, Thermometer, TreesIcon as Lungs, Droplet } from "lucide-react"

type Patient = {
  id: string
  name: string
  age: number
  gender: string
  chiefComplaint: string
  waitTime: number
  severity: "critical" | "urgent" | "standard" | "non-urgent"
  status: "waiting" | "in-progress" | "completed" | "no-show"
  vitalSigns: {
    bloodPressure: string
    heartRate: number
    respiratoryRate: number
    temperature: number
    oxygenSaturation: number
  }
  triageNotes: string
  medicalHistory: string[]
  allergies: string[]
  medications: string[]
  lastUpdated: string
  avatar?: string
}

type PatientDetailsProps = {
  patient: Patient
}

export default function PatientDetails({ patient }: PatientDetailsProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get severity color
  const getSeverityColor = (severity: Patient["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-600"
      case "urgent":
        return "text-orange-600"
      case "standard":
        return "text-blue-600"
      case "non-urgent":
        return "text-green-600"
    }
  }

  // Get vital sign status
  const getVitalSignStatus = (type: string, value: number) => {
    switch (type) {
      case "heartRate":
        if (value > 100) return "text-red-600"
        if (value < 60) return "text-amber-600"
        return "text-green-600"
      case "respiratoryRate":
        if (value > 20) return "text-red-600"
        if (value < 12) return "text-amber-600"
        return "text-green-600"
      case "temperature":
        if (value > 38) return "text-red-600"
        if (value < 36) return "text-amber-600"
        return "text-green-600"
      case "oxygenSaturation":
        if (value < 92) return "text-red-600"
        if (value < 95) return "text-amber-600"
        return "text-green-600"
      default:
        return "text-green-600"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Chief Complaint</h3>
          <p className="text-muted-foreground">{patient.chiefComplaint}</p>

          <h3 className="text-lg font-medium mt-6 mb-2">Triage Notes</h3>
          <p className="text-muted-foreground">{patient.triageNotes}</p>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium mb-1">Wait Time</h3>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-amber-600" />
                <span className="font-medium">{patient.waitTime} minutes</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-1">Last Updated</h3>
              <div className="text-muted-foreground text-sm">{formatDate(patient.lastUpdated)}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Vital Signs</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                <span>Heart Rate</span>
              </div>
              <span className={`font-medium ${getVitalSignStatus("heartRate", patient.vitalSigns.heartRate)}`}>
                {patient.vitalSigns.heartRate} bpm
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-500" />
                <span>Blood Pressure</span>
              </div>
              <span className="font-medium">{patient.vitalSigns.bloodPressure} mmHg</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lungs className="h-5 w-5 mr-2 text-teal-500" />
                <span>Respiratory Rate</span>
              </div>
              <span
                className={`font-medium ${getVitalSignStatus("respiratoryRate", patient.vitalSigns.respiratoryRate)}`}
              >
                {patient.vitalSigns.respiratoryRate} bpm
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Thermometer className="h-5 w-5 mr-2 text-orange-500" />
                <span>Temperature</span>
              </div>
              <span className={`font-medium ${getVitalSignStatus("temperature", patient.vitalSigns.temperature)}`}>
                {patient.vitalSigns.temperature}°C
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Droplet className="h-5 w-5 mr-2 text-blue-500" />
                <span>Oxygen Saturation</span>
              </div>
              <span
                className={`font-medium ${getVitalSignStatus("oxygenSaturation", patient.vitalSigns.oxygenSaturation)}`}
              >
                {patient.vitalSigns.oxygenSaturation}%
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Severity Assessment</h3>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${getSeverityColor(patient.severity)}`} />
              <span className={`font-medium ${getSeverityColor(patient.severity)}`}>
                {patient.severity.charAt(0).toUpperCase() + patient.severity.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="history" className="mt-8">
        <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-full h-12 border shadow-sm">
          <TabsTrigger
            value="history"
            className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
          >
            Medical History
          </TabsTrigger>
          <TabsTrigger
            value="allergies"
            className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
          >
            Allergies
          </TabsTrigger>
          <TabsTrigger
            value="medications"
            className="rounded-full h-10 px-6 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-300"
          >
            Medications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Patient's previous medical conditions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {patient.medicalHistory.length > 0 ? (
                <ul className="space-y-2">
                  {patient.medicalHistory.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No medical history recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allergies" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle>Allergies</CardTitle>
              <CardDescription>Known allergies and reactions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {patient.allergies.length > 0 ? (
                <ul className="space-y-2">
                  {patient.allergies.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{item}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No known allergies</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-transparent">
              <CardTitle>Current Medications</CardTitle>
              <CardDescription>Medications the patient is currently taking</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {patient.medications.length > 0 ? (
                <ul className="space-y-2">
                  {patient.medications.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No current medications</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

