"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/patients");
      const data = await res.json();
      setPatients(data);
    }
    fetchData();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patient Dashboard</h1>
      <ul className="space-y-4">
        {patients.map((patient) => (
          <li key={patient.id} className="p-4 border rounded shadow-sm">
            <div className="font-medium">
              {patient.name?.[0]?.given?.join(" ")} {patient.name?.[0]?.family}
            </div>
            <div className="text-sm text-gray-600">
              Gender: {patient.gender}, Birthdate: {patient.birthDate}
            </div>
            <a
              className="text-blue-500 hover:underline text-sm mt-2 block"
              href={`/dashboard/patient/${patient.id}`}
            >
              View Details →
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
