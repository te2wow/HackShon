class AdminService {
  private readonly AUTH_KEY = 'admin_authenticated';
  private readonly AUTH_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  isAuthenticated(): boolean {
    const authData = sessionStorage.getItem(this.AUTH_KEY);
    if (!authData) return false;

    try {
      const { timestamp } = JSON.parse(authData);
      const now = Date.now();
      
      if (now - timestamp > this.AUTH_TIMEOUT) {
        this.logout();
        return false;
      }
      
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  async authenticate(password: string): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        sessionStorage.setItem(this.AUTH_KEY, JSON.stringify({
          timestamp: Date.now(),
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  logout(): void {
    sessionStorage.removeItem(this.AUTH_KEY);
  }

  getRemainingTime(): number {
    const authData = sessionStorage.getItem(this.AUTH_KEY);
    if (!authData) return 0;

    try {
      const { timestamp } = JSON.parse(authData);
      const elapsed = Date.now() - timestamp;
      return Math.max(0, this.AUTH_TIMEOUT - elapsed);
    } catch {
      return 0;
    }
  }
}

export const adminService = new AdminService();