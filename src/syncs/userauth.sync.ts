import { Requesting, UserAuthentication } from "@concepts";
import { actions, Frames, Sync } from "@engine";

// UserAuthentication
// register
export const RegisterRequest: Sync = (
  { request, username, password },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserAuthentication/register",
      username,
      password,
    },
    { request },
  ]),
  where: (frames: Frames) => {
    const filtered = frames.filter((frame) => {
      const providedUsername = frame[username];
      const providedPassword = frame[password];

      const hasUsername = typeof providedUsername === "string" &&
        providedUsername.trim() !== "";
      const hasPassword = typeof providedPassword === "string" &&
        providedPassword.trim() !== "";

      return hasUsername && hasPassword;
    });
    return filtered;
  },
  then: actions([UserAuthentication.register, {
    username,
    password,
  }]),
});
export const RegisterRequestValidation: Sync = (
  { request, username, password },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserAuthentication/register",
      username,
      password,
    },
    { request },
  ]),
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const providedUsername = frame[username];
      const providedPassword = frame[password];

      const hasUsername = typeof providedUsername === "string" &&
        providedUsername.trim() !== "";
      const hasPassword = typeof providedPassword === "string" &&
        providedPassword.trim() !== "";

      return !(hasUsername && hasPassword);
    }),
  then: actions([Requesting.respond, {
    request,
    error: "Username and password are required.",
  }]),
});
export const RegisterResponse: Sync = (
  { request, user },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/register" }, {
      request,
    }],
    [UserAuthentication.register, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

// authenticate
export const AuthenticateRequest: Sync = (
  { request, username, password },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserAuthentication/authenticate",
      username,
      password,
    },
    { request },
  ]),
  where: (frames: Frames) => {
    const filtered = frames.filter((frame) => {
      const providedUsername = frame[username];
      const providedPassword = frame[password];

      const hasUsername = typeof providedUsername === "string" &&
        providedUsername.trim() !== "";
      const hasPassword = typeof providedPassword === "string" &&
        providedPassword.trim() !== "";

      return hasUsername && hasPassword;
    });
    return filtered;
  },
  then: actions([UserAuthentication.authenticate, {
    username,
    password,
  }]),
});
export const AuthenticateRequestValidation: Sync = (
  { request, username, password },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserAuthentication/authenticate",
      username,
      password,
    },
    { request },
  ]),
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const providedUsername = frame[username];
      const providedPassword = frame[password];

      const hasUsername = typeof providedUsername === "string" &&
        providedUsername.trim() !== "";
      const hasPassword = typeof providedPassword === "string" &&
        providedPassword.trim() !== "";

      return !(hasUsername && hasPassword);
    }),
  then: actions([Requesting.respond, {
    request,
    error: "Username and password are required.",
  }]),
});
export const AuthenticateResponse: Sync = (
  { request, user },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/authenticate" }, {
      request,
    }],
    [UserAuthentication.authenticate, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});
