import fs from "node:fs";
import path from "node:path";

const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/;

function isGroupSegment(segment: string) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isDynamicSegment(segment: string) {
  return segment.startsWith("[") && segment.endsWith("]");
}

function normalizeRoute(segments: string[]) {
  if (segments.length === 0) {
    return "/";
  }
  return `/${segments.join("/")}`;
}

function walkAppRoutes(directory: string, routeSegments: string[], routes: Set<string>) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith("@") || entry.name.startsWith("_")) {
        continue;
      }

      if (isDynamicSegment(entry.name)) {
        continue;
      }

      const nextSegments = isGroupSegment(entry.name)
        ? routeSegments
        : [...routeSegments, entry.name];

      walkAppRoutes(fullPath, nextSegments, routes);
      continue;
    }

    if (PAGE_FILE.test(entry.name)) {
      routes.add(normalizeRoute(routeSegments));
    }
  }
}

export function discoverStaticAppRoutes(projectRoot: string = process.cwd()) {
  const appDir = path.join(projectRoot, "src", "app");
  if (!fs.existsSync(appDir)) {
    return [];
  }

  const routes = new Set<string>();
  walkAppRoutes(appDir, [], routes);

  return [...routes].sort((left, right) => left.localeCompare(right));
}
