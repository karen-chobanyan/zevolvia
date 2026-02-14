import { BadRequestException } from "@nestjs/common";

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

export const parseIncomingDateTimeAsOrgTime = (value: string, orgTimeZone: string | null): Date => {
  const parts = extractDateTimeParts(value);
  if (parts && orgTimeZone) {
    return toUtcFromZonedLocal(parts, orgTimeZone);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid date-time value: ${value}`);
  }
  return parsed;
};

export const isValidTimeZone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const extractDateTimeParts = (value: string): DateTimeParts | null => {
  const match = value
    .trim()
    .match(
      /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(?:Z|[+-]\d{2}:\d{2})?$/,
    );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "0", fraction = "0"] = match;
  const millisecond = Number(fraction.slice(0, 3).padEnd(3, "0"));

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond,
  };
};

const toUtcFromZonedLocal = (parts: DateTimeParts, timeZone: string): Date => {
  const localAsUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );

  let utcMs = localAsUtcMs;
  for (let i = 0; i < 3; i += 1) {
    const offsetMs = getTimeZoneOffsetMs(new Date(utcMs), timeZone);
    const nextUtcMs = localAsUtcMs - offsetMs;
    if (nextUtcMs === utcMs) {
      break;
    }
    utcMs = nextUtcMs;
  }

  return new Date(utcMs);
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string): number => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const partByType = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const asUtcMs = Date.UTC(
    Number(partByType.year),
    Number(partByType.month) - 1,
    Number(partByType.day),
    Number(partByType.hour),
    Number(partByType.minute),
    Number(partByType.second),
    date.getUTCMilliseconds(),
  );

  return asUtcMs - date.getTime();
};
