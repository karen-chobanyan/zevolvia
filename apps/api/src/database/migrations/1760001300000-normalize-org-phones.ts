import { MigrationInterface, QueryRunner } from "typeorm";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export class NormalizeOrgPhones1760001300000 implements MigrationInterface {
  name = "NormalizeOrgPhones1760001300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const defaultCountry = ((process.env.DEFAULT_PHONE_COUNTRY || "US").trim().toUpperCase() ||
      "US") as CountryCode;
    const rows: Array<{ id: string; phone: string | null }> = await queryRunner.query(
      `
      SELECT id, phone
      FROM "orgs"
      WHERE phone IS NOT NULL AND btrim(phone) <> ''
    `,
    );

    for (const row of rows) {
      const phone = row.phone?.trim();
      if (!phone) {
        continue;
      }
      const parsed = parsePhoneNumberFromString(phone, defaultCountry);
      if (!parsed || !parsed.isValid()) {
        continue;
      }
      const normalized = parsed.format("E.164");
      if (normalized && normalized !== phone) {
        await queryRunner.query(`UPDATE "orgs" SET "phone" = $1 WHERE "id" = $2`, [
          normalized,
          row.id,
        ]);
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: cannot reliably restore original formatting.
  }
}
