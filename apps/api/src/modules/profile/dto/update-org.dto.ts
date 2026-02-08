export class UpdateOrgDto {
  name?: string;
  phone?: string | null;
  timeZone?: string | null;
  workingHoursStart?: string;
  workingHoursEnd?: string;
}
