import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, ExternalLink } from "lucide-react"

type MedicalRecord = {
  id: string
  date: string
  title: string
  provider: string
  type: string
  status: "complete" | "pending" | "shared"
}

const medicalRecords: MedicalRecord[] = [
  {
    id: "rec-001",
    date: "2025-03-28",
    title: "General Check-up",
    provider: "Dr. Sarah Johnson",
    type: "Examination",
    status: "complete",
  },
  {
    id: "rec-002",
    date: "2025-02-15",
    title: "Blood Test Results",
    provider: "Central Medical Lab",
    type: "Laboratory",
    status: "complete",
  },
  {
    id: "rec-003",
    date: "2025-01-20",
    title: "Vaccination - COVID-19 Booster",
    provider: "Community Health Center",
    type: "Vaccination",
    status: "complete",
  },
  {
    id: "rec-004",
    date: "2024-12-05",
    title: "Dental Examination",
    provider: "Dr. Michael Chen",
    type: "Dental",
    status: "complete",
  },
  {
    id: "rec-005",
    date: "2024-11-18",
    title: "Chest X-Ray",
    provider: "Regional Hospital",
    type: "Radiology",
    status: "complete",
  },
  {
    id: "rec-006",
    date: "2024-10-30",
    title: "Allergy Test",
    provider: "Allergy Specialists",
    type: "Laboratory",
    status: "complete",
  },
  {
    id: "rec-007",
    date: "2024-09-12",
    title: "Eye Examination",
    provider: "Vision Care Center",
    type: "Ophthalmology",
    status: "shared",
  },
]

type MedicalHistoryListProps = {
  limit?: number
}

export default function MedicalHistoryList({ limit }: MedicalHistoryListProps) {
  const displayRecords = limit ? medicalRecords.slice(0, limit) : medicalRecords

  return (
    <div className="space-y-4">
      {displayRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No medical records found</h3>
          <p className="text-sm text-muted-foreground">
            Your medical history will appear here once records are added to your profile.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{record.title}</span>
                  <Badge
                    variant={
                      record.status === "complete" ? "default" : record.status === "pending" ? "outline" : "secondary"
                    }
                    className={record.status === "complete" ? "bg-teal-600" : ""}
                  >
                    {record.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{new Date(record.date).toLocaleDateString()}</span>
                  <span>{record.provider}</span>
                  <span>{record.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">View</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

