export class CommandBus {
  constructor() {
    this.handlers = new Map();
  }

  register(commandClass, handlerInstance) {
    this.handlers.set(commandClass, handlerInstance);
  }

  async dispatch(command, ...args) {
    const handler = this.handlers.get(command.constructor);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.constructor.name}`);
    }
    return handler.execute(command, ...args);
  }
} 