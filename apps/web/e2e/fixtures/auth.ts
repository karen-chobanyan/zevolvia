import { ApiMock } from "../utils/api-mock";

export function setupAuthenticatedSession(apiMock: ApiMock) {
  apiMock.setAuthenticated(true);
}

export function setupUnauthenticatedSession(apiMock: ApiMock) {
  apiMock.setAuthenticated(false);
}
