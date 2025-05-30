import { ServiceBusClient } from "@azure/service-bus";

export async function sendToQueue(payload: any) {
  const client = new ServiceBusClient(
    process.env.SERVICE_BUS_CONNECTION_STRING!
  );
  const sender = client.createSender("triage-hashes");

  await sender.sendMessages({ body: payload });
  await sender.close();
  await client.close();
}
