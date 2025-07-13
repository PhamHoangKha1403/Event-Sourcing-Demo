import { EventStoreDBClient } from "@eventstore/db-client";


const client = EventStoreDBClient.connectionString(
  "esdb://eventstore.db:2113?tls=false"
);

export default client;