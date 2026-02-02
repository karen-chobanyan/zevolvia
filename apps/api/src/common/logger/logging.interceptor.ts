import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { Request } from "express";

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    orgId: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(LoggingInterceptor.name)
    private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, url, body, query, params } = request;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const startTime = Date.now();

    const sanitizedBody = this.sanitizeBody(body);

    this.logger.debug(
      {
        controller,
        handler,
        method,
        url,
        query: Object.keys(query || {}).length > 0 ? query : undefined,
        params: Object.keys(params || {}).length > 0 ? params : undefined,
        body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined,
        userId: request.user?.userId,
        orgId: request.user?.orgId,
      },
      `Executing ${controller}.${handler}`,
    );

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        this.logger.debug(
          {
            controller,
            handler,
            duration,
            responseType: this.getResponseType(response),
          },
          `Completed ${controller}.${handler} in ${duration}ms`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          {
            controller,
            handler,
            duration,
            error: {
              name: error.name,
              message: error.message,
              status: error.status || error.statusCode,
            },
          },
          `Failed ${controller}.${handler} in ${duration}ms: ${error.message}`,
        );
        throw error;
      }),
    );
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body || typeof body !== "object") {
      return {};
    }

    const sensitiveFields = [
      "password",
      "passwordConfirm",
      "currentPassword",
      "newPassword",
      "token",
      "refreshToken",
      "apiKey",
      "secret",
      "authorization",
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeBody(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private getResponseType(response: unknown): string {
    if (response === null || response === undefined) {
      return "void";
    }
    if (Array.isArray(response)) {
      return `array[${response.length}]`;
    }
    if (typeof response === "object") {
      return "object";
    }
    return typeof response;
  }
}
