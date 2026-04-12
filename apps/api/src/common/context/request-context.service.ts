import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class RequestContextService {
  constructor(private readonly cls: ClsService) {}

  // User info (set after JWT validation)
  get userId(): string {
    return this.cls.get('userId') || '';
  }

  get email(): string {
    return this.cls.get('email') || '';
  }

  get tenantId(): string {
    return this.cls.get('tenantId') || '';
  }

  get role(): string {
    return this.cls.get('role') || '';
  }

  // Request metadata (set by CLS middleware)
  get ipAddress(): string {
    return this.cls.get('ip') || '';
  }

  get userAgent(): string {
    return this.cls.get('userAgent') || '';
  }

  get isAuthenticated(): boolean {
    return !!this.cls.get('userId');
  }

  // Set user data (called from JWT strategy after validation)
  setUser(user: { userId: string; email: string; tenantId: string; role: string }) {
    this.cls.set('userId', user.userId);
    this.cls.set('email', user.email);
    this.cls.set('tenantId', user.tenantId);
    this.cls.set('role', user.role);
  }
}
