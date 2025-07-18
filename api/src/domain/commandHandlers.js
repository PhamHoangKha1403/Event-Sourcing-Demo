import AccountAggregate from './accountAggregate.js';

export class CreateAccountHandler {
  async execute(command, accountId) {
    const { owner, initialBalance } = command;
    const aggregate = new AccountAggregate(accountId);
    aggregate.createAccount(owner, initialBalance || 0);
    await aggregate.save();
    return aggregate.id;
  }
}

export class DepositMoneyHandler {
  async execute(command) {
    const { accountId, amount } = command;
    const aggregate = new AccountAggregate(accountId);
    await aggregate.load();
    aggregate.depositMoney(amount);
    await aggregate.save();
  }
}

export class WithdrawMoneyHandler {
  async execute(command) {
    const { accountId, amount } = command;
    const aggregate = new AccountAggregate(accountId);
    await aggregate.load();
    aggregate.withdrawMoney(amount);
    await aggregate.save();
  }
} 