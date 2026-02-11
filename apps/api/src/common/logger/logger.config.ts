import { Params } from "nestjs-pino";
import type { IncomingMessage, ServerResponse } from "http";
import { v4 as uuidv4 } from "uuid";

const REQUEST_ID_HEADER = "x-request-id";

const SENSITIVE_QUERY_PARAMS = new Set([
  "token",
  "email",
  "password",
  "secret",
  "apikey",
  "api_key",
  "access_token",
  "refresh_token",
]);

const sanitizeUrl = (url: string): string => {
  const questionMarkIndex = url.indexOf("?");
  if (questionMarkIndex === -1) {
    return url;
  }

  const path = url.slice(0, questionMarkIndex);
  const queryString = url.slice(questionMarkIndex + 1);
  const params = new URLSearchParams(queryString);
  let redacted = false;

  for (const key of Array.from(params.keys())) {
    if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
      params.set(key, "[REDACTED]");
      redacted = true;
    }
  }

  return redacted ? `${path}?${params.toString()}` : url;
};

interface ReqWithContext extends IncomingMessage {
  user?: {
    userId: string;
    orgId: string;
    email: string;
  };
}

export const loggerConfig = (): Params => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),

      genReqId: (req: IncomingMessage) => {
        const r = req as ReqWithContext;
        const existingId = r.headers[REQUEST_ID_HEADER];
        const requestId = (existingId as string) || uuidv4();
        r.id = requestId;
        return requestId;
      },

      customProps: (req: IncomingMessage) => {
        const r = req as ReqWithContext;
        return {
          requestId: r.id,
          ...(r.user && {
            userId: r.user.userId,
            orgId: r.user.orgId,
          }),
        };
      },

      customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
        if (res.statusCode >= 500 || err) {
          return "error";
        }
        if (res.statusCode >= 400) {
          return "warn";
        }
        return "info";
      },

      customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
        return `${req.method} ${sanitizeUrl(req.url || "")} completed with ${res.statusCode}`;
      },

      customErrorMessage: (req: IncomingMessage, res: ServerResponse) => {
        return `${req.method} ${sanitizeUrl(req.url || "")} failed with ${res.statusCode}`;
      },

      customAttributeKeys: {
        req: "request",
        res: "response",
        err: "error",
        responseTime: "duration",
      },

      serializers: {
        req: (req: IncomingMessage) => {
          const r = req as ReqWithContext;
          return {
            id: r.id,
            method: r.method,
            url: sanitizeUrl(r.url || ""),
            headers: {
              host: r.headers.host,
              "user-agent": r.headers["user-agent"],
              "content-type": r.headers["content-type"],
              "content-length": r.headers["content-length"],
              [REQUEST_ID_HEADER]: r.headers[REQUEST_ID_HEADER],
            },
          };
        },
        res: (res: ServerResponse) => ({
          statusCode: res.statusCode,
        }),
        err: (err: Error) => ({
          type: err.constructor.name,
          message: err.message,
          stack: err.stack,
        }),
      },

      redact: {
        paths: [
          "request.headers.authorization",
          "request.headers.cookie",
          "request.body.password",
          "request.body.passwordConfirm",
          "request.body.currentPassword",
          "request.body.newPassword",
          "request.body.token",
          "request.body.refreshToken",
          "request.body.apiKey",
          "request.body.secret",
        ],
        censor: "[REDACTED]",
      },

      transport: isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: {
              colorize: true,
              singleLine: false,
              levelFirst: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },

      autoLogging: {
        ignore: (req: IncomingMessage) => {
          const ignorePaths = ["/api/health", "/api/metrics", "/favicon.ico"];
          return ignorePaths.some((path) => req.url?.startsWith(path));
        },
      },
    },
  };
};
