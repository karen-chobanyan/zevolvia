import "reflect-metadata";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "./data-source";
import { MembershipStatus } from "../common/enums";
import { Membership } from "../modules/identity/entities/membership.entity";
import { Org } from "../modules/identity/entities/org.entity";
import { Permission } from "../modules/identity/entities/permission.entity";
import { Role } from "../modules/identity/entities/role.entity";
import { RolePermission } from "../modules/identity/entities/role-permission.entity";
import { User } from "../modules/identity/entities/user.entity";
import { In, Repository } from "typeorm";

async function createUniqueSlug(name: string, orgRepo: Repository<Org>): Promise<string> {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 50) || "saloniq";

  let slug = base;
  let attempt = 1;

  while (await orgRepo.findOne({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) {
      slug = `${base}-${Date.now().toString().slice(-4)}`;
      break;
    }
  }

  return slug;
}

async function seed() {
  await AppDataSource.initialize();

  const orgRepo = AppDataSource.getRepository(Org);
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const membershipRepo = AppDataSource.getRepository(Membership);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const rolePermissionRepo = AppDataSource.getRepository(RolePermission);

  const email = (process.env.SEED_EMAIL || "owner@saloniq.ai").trim().toLowerCase();
  const password = process.env.SEED_PASSWORD || "ChangeMe123!";
  const orgName = process.env.SEED_ORG_NAME?.trim() || "SalonIQ Studio";
  const firstName = (process.env.SEED_FIRST_NAME || "Salon").trim();
  const lastName = (process.env.SEED_LAST_NAME || "Owner").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || null;

  try {
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      console.log(`Seed user already exists: ${email}`);
      return;
    }

    const slug = await createUniqueSlug(orgName, orgRepo);
    const org = orgRepo.create({ name: orgName, slug });
    await orgRepo.save(org);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = userRepo.create({ email, name, passwordHash });
    await userRepo.save(user);

    const role = roleRepo.create({
      orgId: org.id,
      name: "Owner",
      description: "Workspace owner",
      isSystem: true,
    });
    await roleRepo.save(role);

    // Grant default permissions to the Owner role
    const defaultPermissions = await permissionRepo.find({
      where: {
        key: In([
          "files:read",
          "files:write",
          "files:upload",
          "files:delete",
          "chat:read",
          "chat:write",
        ]),
      },
    });

    for (const permission of defaultPermissions) {
      const rolePermission = rolePermissionRepo.create({
        roleId: role.id,
        permissionId: permission.id,
      });
      await rolePermissionRepo.save(rolePermission);
    }

    const membership = membershipRepo.create({
      orgId: org.id,
      userId: user.id,
      roleId: role.id,
      status: MembershipStatus.Active,
    });
    await membershipRepo.save(membership);

    console.log("Seed complete");
    console.log(`Org: ${org.name} (${org.slug})`);
    console.log(`User: ${email}`);
    console.log(`Password: ${password}`);
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
