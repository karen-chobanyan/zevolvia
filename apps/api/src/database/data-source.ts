import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import { ConfigService } from "@nestjs/config";

dotenv.config();
const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: configService.getOrThrow("DB_HOST"),
  port: configService.getOrThrow("DB_PORT"),
  username: configService.getOrThrow("DB_USER"),
  password: configService.getOrThrow("DB_PASSWORD"),
  database: configService.getOrThrow("DB_NAME"),
  migrations: ["src/database/migrations/*.ts"],
} as DataSourceOptions);
