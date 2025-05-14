import { AzureCliCredential } from "@azure/identity";
import { DefaultAzureCredential } from "@azure/identity";

export async function getAzureCliAccessToken(): Promise<string> {
  const credential = new AzureCliCredential();
  const token = await credential.getToken(process.env.FHIR_BASE_URL + "");
  return token.token;
}
