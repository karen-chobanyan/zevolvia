import { Params } from "nestjs-pino";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

const REQUEST_ID_HEADER = "x-request-id";

export interface RequestWithContext extends Request {
  id?: string;
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

      genReqId: (req: RequestWithContext) => {
        const existingId = req.headers[REQUEST_ID_HEADER];
        const requestId = (existingId as string) || uuidv4();
        req.id = requestId;
        return requestId;
      },

      customProps: (req: RequestWithContext) => ({
        requestId: req.id,
        ...(req.user && {
          userId: req.user.userId,
          orgId: req.user.orgId,
        }),
      }),

      customLogLevel: (_req: Request, res: Response, err?: Error) => {
        if (res.statusCode >= 500 || err) {
          return "error";
        }
        if (res.statusCode >= 400) {
          return "warn";
        }
        return "info";
      },

      customSuccessMessage: (req: RequestWithContext, res: Response) => {
        return `${req.method} ${req.url} completed with ${res.statusCode}`;
      },

      customErrorMessage: (req: RequestWithContext, res: Response) => {
        return `${req.method} ${req.url} failed with ${res.statusCode}`;
      },

      customAttributeKeys: {
        req: "request",
        res: "response",
        err: "error",
        responseTime: "duration",
      },

      serializers: {
        req: (req: RequestWithContext) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          query: req.query,
          params: req.params,
          headers: {
            host: req.headers.host,
            "user-agent": req.headers["user-agent"],
            "content-type": req.headers["content-type"],
            "content-length": req.headers["content-length"],
            [REQUEST_ID_HEADER]: req.headers[REQUEST_ID_HEADER],
          },
        }),
        res: (res: Response) => ({
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
        ignore: (req: Request) => {
          const ignorePaths = ["/api/health", "/api/metrics", "/favicon.ico"];
          return ignorePaths.some((path) => req.url?.startsWith(path));
        },
      },
    },
  };
};
