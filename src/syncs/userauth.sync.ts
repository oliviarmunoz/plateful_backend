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
    console.log("RegisterRequest frames", frames);
    const filtered = frames.filter((frame, index) => {
      const providedUsername = frame[username];
      const providedPassword = frame[password];

      const hasUsername = typeof providedUsername === "string" &&
        providedUsername.trim() !== "";
      const hasPassword = typeof providedPassword === "string" &&
        providedPassword.trim() !== "";

      if (!hasUsername || !hasPassword) {
        console.warn("RegisterRequest dropping frame", {
          index,
          hasUsername,
          hasPassword,
          requestId: frame[request],
          rawUsername: providedUsername,
          rawPasswordPresent: providedPassword !== undefined &&
            providedPassword !== null,
        });
      }

      return hasUsername && hasPassword;
    });

    console.log(
      "RegisterRequest filtered frame summaries",
      filtered.map((frame) => ({
        username: frame[username],
        requestId: frame[request],
      })),
    );

    return filtered;
  },
  then: actions([UserAuthentication.register, {
    username,
    password,
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
    console.log("AuthenticateRequest frames", frames);
    const filtered = frames.filter((frame, index) => {
      const providedUsername = frame[username];
      const providedPassword = frame[password];

      const hasUsername = typeof providedUsername === "string" &&
        providedUsername.trim() !== "";
      const hasPassword = typeof providedPassword === "string" &&
        providedPassword.trim() !== "";

      if (!hasUsername || !hasPassword) {
        console.warn("AuthenticateRequest dropping frame", {
          index,
          hasUsername,
          hasPassword,
          requestId: frame[request],
          rawUsername: providedUsername,
          rawPasswordPresent: providedPassword !== undefined &&
            providedPassword !== null,
        });
      }

      return hasUsername && hasPassword;
    });

    console.log(
      "AuthenticateRequest filtered frame summaries",
      filtered.map((frame) => ({
        username: frame[username],
        requestId: frame[request],
      })),
    );

    return filtered;
  },
  then: actions([UserAuthentication.authenticate, {
    username,
    password,
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
