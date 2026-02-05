import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import cookieParser from "cookie-parser";
import express from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.WEB_ORIGIN || "http://localhost:3000",
    credentials: true,
  });
  app.setGlobalPrefix("api");

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);

  logger.log(`Application running on port ${port}`, "Bootstrap");
}

bootstrap();
