import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ correlationId?: string }>();
    const correlationId = request.correlationId || 'unknown';

    return next.handle().pipe(
      tap(() => {
        // Log completion with correlation ID
        console.log(`Request completed: ${correlationId}`);
      })
    );
  }
}
