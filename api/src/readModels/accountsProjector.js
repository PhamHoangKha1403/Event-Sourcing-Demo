import pool from '../services/postgresClient.js';

export async function projectEvent(event) {
  const { type, data } = event;
  console.log(`Projecting event: ${type}`);

  switch (type) {
    case 'AccountCreated':
      await pool.query(
        'INSERT INTO accounts (id, owner, balance, version) VALUES ($1, $2, $3, 1)',
        [data.accountId, data.owner, data.initialBalance || 0]
      );
      break;
    case 'MoneyDeposited':
      await pool.query(
        'UPDATE accounts SET balance = balance + $1, version = version + 1 WHERE id = $2',
        [data.amount, data.accountId]
      );
      break;
    case 'MoneyWithdrawn':
      await pool.query(
        'UPDATE accounts SET balance = balance - $1, version = version + 1 WHERE id = $2',
        [data.amount, data.accountId]
      );
      break;
    default:
      console.warn(`Unknown event type to project: ${type}`);
  }
}
