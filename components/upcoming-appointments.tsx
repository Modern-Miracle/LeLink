import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, X } from "lucide-react"

type Appointment = {
  id: string
  date: string
  time: string
  provider: string
  location: string
  type: string
}

const appointments: Appointment[] = [
  {
    id: "apt-001",
    date: "2025-04-10",
    time: "10:30 AM",
    provider: "Dr. Sarah Johnson",
    location: "Central Medical Center",
    type: "Follow-up",
  },
  {
    id: "apt-002",
    date: "2025-04-22",
    time: "2:15 PM",
    provider: "Dr. Michael Chen",
    location: "Dental Clinic",
    type: "Dental Check-up",
  },
]

type UpcomingAppointmentsProps = {
  showActions?: boolean
}

export default function UpcomingAppointments({ showActions = false }: UpcomingAppointmentsProps) {
  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No upcoming appointments</h3>
          <p className="text-sm text-muted-foreground">
            Schedule an appointment to get started with your healthcare journey.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-lg border p-3">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{appointment.type}</span>
                  {showActions && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  )}
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{new Date(appointment.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{appointment.time}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium mr-2">Provider:</span>
                    <span>{appointment.provider}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{appointment.location}</span>
                  </div>
                </div>
                {showActions && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

