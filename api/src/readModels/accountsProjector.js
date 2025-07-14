import client from '../services/eventStoreClient.js';
import pool from '../services/postgresClient.js';

console.log('Starting standalone projector...');

// Main function to run the projection
async function runProjection() {
  try {
    // Subscribe to all events from the beginning of time
    const subscription = client.subscribeToAll({ fromPosition: 'start' });

    for await (const { event } of subscription) {
      // We only care about events from our bankAccount streams
      if (!event || !event.streamId.startsWith('bankAccount-')) {
        continue;
      }

      await projectEvent(event);
    }
  } catch (error) {
    console.error('🚨 Projection subscription failed:', error);
    // In production, implement a resilient retry strategy
    process.exit(1);
  }
}

// Handles a single event and updates the PostgreSQL read model
async function projectEvent(event) {
  const { type, data, revision } = event;
  const pgClient = await pool.connect(); // Get a client from the pool
  console.log(`Projecting event: ${type} (Revision: ${revision})`);

  try {
    switch (type) {
      case 'AccountCreated':
        // The "ON CONFLICT DO NOTHING" makes this operation idempotent.
        // If we've seen this account ID before, we don't try to insert it again.
        await pgClient.query(
          `INSERT INTO accounts (id, owner, balance, version)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [data.accountId, data.owner, data.initialBalance || 0, revision]
        );
        break;

      case 'MoneyDeposited':
        // The "WHERE version < $3" clause makes this idempotent.
        // We only apply the update if the event's revision is newer than the row's version.
        await pgClient.query(
          `UPDATE accounts
           SET balance = balance + $1, version = $2
           WHERE id = $3 AND version < $2`,
          [data.amount, revision, data.accountId]
        );
        break;

      case 'MoneyWithdrawn':
        await pgClient.query(
          `UPDATE accounts
           SET balance = balance - $1, version = $2
           WHERE id = $3 AND version < $2`,
          [data.amount, revision, data.accountId]
        );
        break;
    }
  } catch (err) {
    console.error(`Failed to project event ${type} for account ${data.accountId}`, err);
    // In production, you might move failed events to a dead-letter queue for inspection.
  } finally {
    pgClient.release(); // Always release the client back to the pool
  }
}

// SQL schema needed for the 'accounts' table
async function setupSchema() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id UUID PRIMARY KEY,
                owner VARCHAR(255) NOT NULL,
                balance BIGINT NOT NULL,
                version BIGINT NOT NULL
            );
        `);
        console.log('✅ Accounts table schema is ready.');
    } finally {
        client.release();
    }
}

// Setup schema and then start the projection
setupSchema().then(runProjection);