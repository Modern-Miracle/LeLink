import axios from "axios";

export async function getAzureAccessToken(): Promise<string> {
  const res = await axios.post(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      scope: "https://azurehealthcareapis.com/.default",
      grant_type: "client_credentials",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return res.data.access_token;
}
export async function getManagedIdentityToken(): Promise<string> {
  const resource = "https://azurehealthcareapis.com";
  const res = await axios.get(
    `http://169.254.169.254/metadata/identity/oauth2/token`,
    {
      headers: { Metadata: "true" },
      params: {
        "api-version": "2018-02-01",
        resource,
      },
    }
  );
  return res.data.access_token;
}
