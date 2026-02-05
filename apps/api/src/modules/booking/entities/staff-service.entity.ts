import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "../../identity/entities/user.entity";
import { Service } from "./service.entity";

@Entity({ name: "staff_services" })
@Unique(["userId", "serviceId"])
export class StaffService {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "service_id", type: "uuid" })
  serviceId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Service, { onDelete: "CASCADE" })
  @JoinColumn({ name: "service_id" })
  service!: Service;
}
