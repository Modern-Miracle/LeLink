import axios from "axios";
import { getAzureCliAccessToken } from "./azure-cli-auth";

const baseUrl = process.env.FHIR_BASE_URL!;

export async function getPatient(id: string) {
  const token = await getAzureCliAccessToken();
  const res = await axios.get(`${baseUrl}/Patient/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/fhir+json",
    },
  });
  return res.data;
}

export async function createPatient(data: any) {
  const token = await getAzureCliAccessToken();
  const res = await axios.post(`${baseUrl}/Patient`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/fhir+json",
    },
  });
  return res.data;
}

export async function getAllPatients() {
  const token = await getAzureCliAccessToken();
  try {
    const res = await fetch(`${process.env.FHIR_BASE_URL}/Patient`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/fhir+json",
      },
      cache: "no-store",
    });
    const fhir = await res.json();
    console.log(fhir);
    return fhir.entry?.map((e: any) => e.resource);
  } catch (e) {
    console.log(e);
    return [];
  }
}
