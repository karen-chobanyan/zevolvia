let userCounter = 0;

export type E2EUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  orgName: string;
};

export function createE2EUser(prefix: string = "user"): E2EUserInput {
  userCounter += 1;
  const suffix = String(userCounter).padStart(3, "0");

  return {
    firstName: "Taylor",
    lastName: `Tester${suffix}`,
    email: `${prefix}.${suffix}@saloniq.test`,
    password: "Password123!",
    orgName: `SalonIQ E2E Org ${suffix}`,
  };
}
