import { DefaultAzureCredential } from "@azure/identity";

export async function getAzureCliAccessToken(): Promise<string> {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken(
    "https://azurehealthcareapis.com/.default"
  );
  return token.token;
}
