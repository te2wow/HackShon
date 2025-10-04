import { EventEmitter } from 'events';

class MetricsEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

export const eventEmitter = new MetricsEventEmitter();