// Command classes for CQRS

export class CreateAccountCommand {
  constructor(owner, initialBalance) {
    this.owner = owner;
    this.initialBalance = initialBalance;
  }
}

export class DepositMoneyCommand {
  constructor(accountId, amount) {
    this.accountId = accountId;
    this.amount = amount;
  }
}

export class WithdrawMoneyCommand {
  constructor(accountId, amount) {
    this.accountId = accountId;
    this.amount = amount;
  }
} 