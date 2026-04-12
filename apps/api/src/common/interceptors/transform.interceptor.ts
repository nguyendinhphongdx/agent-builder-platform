import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseEntity } from '../entities/base.entity';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

function transformData(data: unknown): unknown {
  if (data instanceof BaseEntity) {
    return data.toResponse();
  }

  if (Array.isArray(data)) {
    return data.map((item) => transformData(item));
  }

  return data;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<unknown>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: transformData(data),
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
