class PollingService {
  private readonly POLLING_INTERVAL_KEY = 'polling_interval';
  private readonly DEFAULT_INTERVAL = 5; // 5 minutes

  getPollingInterval(): number {
    const stored = localStorage.getItem(this.POLLING_INTERVAL_KEY);
    return stored ? parseInt(stored) : this.DEFAULT_INTERVAL;
  }

  setPollingInterval(minutes: number): void {
    localStorage.setItem(this.POLLING_INTERVAL_KEY, minutes.toString());
  }

  getPollingIntervalMs(): number {
    return this.getPollingInterval() * 60 * 1000;
  }
}

export const pollingService = new PollingService();