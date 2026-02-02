import { PinoLogger } from "nestjs-pino";

export interface LogMethodOptions {
  logArgs?: boolean;
  logResult?: boolean;
  logError?: boolean;
  sensitiveArgs?: number[];
}

const defaultOptions: LogMethodOptions = {
  logArgs: true,
  logResult: false,
  logError: true,
  sensitiveArgs: [],
};

export function LogMethod(options: LogMethodOptions = {}): MethodDecorator {
  const opts = { ...defaultOptions, ...options };

  return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: unknown[]) {
      const logger: PinoLogger | undefined = (this as { logger?: PinoLogger }).logger;
      const startTime = Date.now();

      const sanitizedArgs = opts.logArgs
        ? args.map((arg, index) => {
            if (opts.sensitiveArgs?.includes(index)) {
              return "[REDACTED]";
            }
            if (arg instanceof Buffer) {
              return `Buffer(${arg.length} bytes)`;
            }
            return arg;
          })
        : undefined;

      if (logger) {
        logger.debug(
          {
            method: methodName,
            args: sanitizedArgs,
          },
          `${className}.${methodName} started`,
        );
      }

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        if (logger) {
          logger.debug(
            {
              method: methodName,
              duration,
              ...(opts.logResult && { result: summarizeResult(result) }),
            },
            `${className}.${methodName} completed in ${duration}ms`,
          );
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        if (logger && opts.logError) {
          logger.error(
            {
              method: methodName,
              duration,
              error: {
                name: (error as Error).name,
                message: (error as Error).message,
              },
            },
            `${className}.${methodName} failed in ${duration}ms`,
          );
        }

        throw error;
      }
    };

    return descriptor;
  };
}

function summarizeResult(result: unknown): unknown {
  if (result === null || result === undefined) {
    return result;
  }
  if (Array.isArray(result)) {
    return `Array(${result.length} items)`;
  }
  if (typeof result === "object") {
    const keys = Object.keys(result);
    if (keys.length > 5) {
      return `Object(${keys.length} keys)`;
    }
    return result;
  }
  return result;
}
