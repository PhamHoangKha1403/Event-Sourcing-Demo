import { jsonEvent, NO_STREAM } from "@eventstore/db-client";
import client from "../services/eventStoreClient.js";

export default class AccountAggregate {
    constructor(accountId) {
        this.id = accountId;
        this.streamName = `bankAccount-${this.id}`;
        this.state = { balance: 0, owner: null, status: 'INITIAL' };
        this.version = NO_STREAM; // For optimistic concurrency control
        this.uncommittedEvents = [];
    }

    async load() {
        try {
            const events = client.readStream(this.streamName);
            for await (const { event } of events) {
                if (!event) continue;
                this.applyEvent(event);
                this.version = event.revision; // Track the latest revision
            }
        } catch (error) {
            if (error.type !== 'stream-not-found') throw error;
        }
    }

    applyEvent(event) {
        switch (event.type) {
            case 'AccountCreated':
                this.state.owner = event.data.owner;
                this.state.status = 'OPEN';
                this.state.balance = event.data.initialBalance || 0;
                break;
            case 'MoneyDeposited':
                this.state.balance += event.data.amount;
                break;
            case 'MoneyWithdrawn':
                this.state.balance -= event.data.amount;
                break;
        }
    }

    stageEvent(type, data) {
        const event = { type, data: { accountId: this.id, ...data } };
        this.applyEvent(event);
        this.uncommittedEvents.push(jsonEvent(event));
    }

    createAccount(owner, initialBalance) {
        if (this.state.status !== 'INITIAL') throw new Error("Account already exists.");
        this.stageEvent('AccountCreated', { owner, initialBalance });
    }

    depositMoney(amount) {
        if (this.state.status !== 'OPEN') throw new Error("Account is not active.");
        if (amount <= 0) throw new Error("Deposit amount must be positive.");
        this.stageEvent('MoneyDeposited', { amount });
    }

    withdrawMoney(amount) {
        if (this.state.status !== 'OPEN') throw new Error("Account is not active.");
        if (this.state.balance < amount) throw new Error("Insufficient funds for this transaction.");
        this.stageEvent('MoneyWithdrawn', { amount });
    }

    async save() {
        if (this.uncommittedEvents.length === 0) return;

        console.log(`Saving events to stream: ${this.streamName}`);

        // Save events with optimistic concurrency control
        const result = await client.appendToStream(this.streamName, this.uncommittedEvents, {
            expectedRevision: this.version,
        });

        this.version = result.nextExpectedRevision;
        this.uncommittedEvents = [];
      }
}