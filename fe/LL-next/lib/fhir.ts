import axios from 'axios';
import { getAzureCliAccessToken } from './azure-cli-auth';

const baseUrl = process.env.NEXT_PUBLIC_FHIR_BASE_URL!;

export async function useFHIRApi<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  route: string,
  body?: any
): Promise<T> {
  const token = await getAzureCliAccessToken();
  const config = {
    method,
    url: `${baseUrl}${route}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/fhir+json',
    },
    ...(body && { data: body }),
  };
  const res = await axios(config);
  return res.data;
}

export async function getPatient(id: string) {
  return useFHIRApi('GET', `/Patient/${id}`);
}

export async function createPatient(data: any) {
  return useFHIRApi('POST', `/Patient`, data);
}

export async function getAllPatients() {
  try {
    const result = await useFHIRApi('GET', `/Patient`);
    return result.entry?.map((e: any) => e.resource) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getAllEncounters() {
  try {
    const result = await useFHIRApi('GET', `/Encounter`);
    return result.entry?.map((e: any) => e.resource) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}
export async function getAllAppointments() {
  try {
    const result = await useFHIRApi('GET', `/Encounter`);
    return result.entry?.map((e: any) => e.resource) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getAllObservations() {
  try {
    const result = await useFHIRApi('GET', `/Observation`);
    return result.entry?.map((e: any) => e.resource) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getAllRiskAssessments() {
  try {
    const result = await useFHIRApi('GET', `/RiskAssessment`);
    return result.entry?.map((e: any) => e.resource) || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}
