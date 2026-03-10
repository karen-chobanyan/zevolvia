# Merge Request Draft: ZEVO-21-new-user-email

## Title

ZEVO-21-new-user-email: New user email

## Description

### Why

New users currently complete registration without a dedicated onboarding/welcome email touchpoint. This reduces activation momentum and leaves no immediate confirmation loop after sign-up.

This MR introduces explicit registration-email behavior so every new account receives a consistent first communication.

### What changed

| Area          | Key additions                                           | Technical impact                                                          |
| ------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Auth service  | `auth.service.ts` registration email integration/update | Registration flow now triggers/handles new-user email logic               |
| Test coverage | `auth.register-email.unit-test.ts`                      | Adds unit-level verification for email behavior and regression guardrails |
| Dependencies  | `apps/api/package.json`                                 | Ensures required package support for updated auth/email flow              |

### Technical impact

- **Auth registration path changed** to include new-user email handling.
- **Test coverage improved** around registration email behavior.
- **Operationally important** for onboarding consistency and user trust.

## Source / Target / Reviewers

- **Source branch:** `ZEVO-21-new-user-email`
- **Target branch:** `main`
- **Reviewers:** Hrach Tadevosyan, Toros

## Files touched

- `apps/api/package.json`
- `apps/api/src/modules/auth/auth.register-email.unit-test.ts`
- `apps/api/src/modules/auth/auth.service.ts`

## Visual impact (for MR screenshots)

Most of this change is backend-oriented. Recommended evidence in MR:

1. **Email preview screenshot** from local/staging mail catcher (subject/body + personalization).
2. **Test output screenshot** showing `auth.register-email.unit-test` passing.
3. **Optional log snippet screenshot** proving registration triggers email dispatch.

## Suggested diff highlights section for MR body

```md
### Diff highlights

- Added/updated registration-time new-user email logic in AuthService
- Added unit tests validating email trigger/content path
- Updated API dependencies required by the new flow
```

## Test Results

- Status: ⚠️ Not executed as part of MR draft preparation.
- Recommended checks:
  - Run auth module unit tests
  - Run lint/type checks
  - Smoke test user registration + email dispatch in staging

## QA Checklist

- [x] Branch rebased/merged cleanly onto target branch
- [ ] CI pipeline passes (tests, lint, build)
- [ ] Feature acceptance criteria verified
- [ ] Regression checks performed on related flows
- [ ] Security/privacy implications reviewed
- [ ] Reviewer sign-off: Hrach Tadevosyan
- [ ] Reviewer sign-off: Toros
