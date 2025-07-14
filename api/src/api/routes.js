import express from "express";
import { v4 as uuidv4 } from "uuid";
import AccountAggregate from "../domain/accountAggregate.js";
import pool from "../services/postgresClient.js";

const router = express.Router();

router.post('/accounts', async (req, res) => {
    try {
        const { owner, initialBalance } = req.body;
        console.log("[AccountCreated] New owner: " + owner);
        if (!owner) return res.status(400).json({ message: "Owner name is required." });
        
        const accountId = uuidv4();
        const aggregate = new AccountAggregate(accountId);
        aggregate.createAccount(owner, initialBalance || 0);
        await aggregate.save();
        
        res.status(201).json({ accountId, message: "Account created successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/accounts/:id/deposit', async (req, res) => {
    try {
        const { amount } = req.body;
        console.log("[MoneyDeposited] $" + amount + " from " + req.params.id);
        const aggregate = new AccountAggregate(req.params.id);
        await aggregate.load();
        aggregate.depositMoney(amount);
        await aggregate.save();
        res.status(200).json({ message: "Deposit successful." });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post('/accounts/:id/withdraw', async (req, res) => {
    try {
        const { amount } = req.body;
        console.log("[MoneyWithdrawn] $" + amount + " from " + req.params.id);
        const aggregate = new AccountAggregate(req.params.id);
        await aggregate.load();
        aggregate.withdrawMoney(amount);
        await aggregate.save();
        res.status(200).json({ message: "Withdrawal successful." });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/accounts', async (req, res) => {
    try {
        console.log("Fetching accounts from PostgreSQL Read Model...");
        const result = await pool.query('SELECT id, owner, balance FROM accounts ORDER BY owner');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching from Read Model:", error);
        res.status(500).json({ message: "Could not fetch account list." });
    }
});

export default router;
