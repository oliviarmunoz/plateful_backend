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
    console.log("AuthenticateRequest frames", frames);
    // Ensure username and password are provided
    return frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return frameData.username !== undefined &&
        frameData.username !== null &&
        frameData.username !== "" &&
        frameData.password !== undefined &&
        frameData.password !== null &&
        frameData.password !== "";
    });
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
    // Ensure username and password are provided
    return frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return frameData.username !== undefined &&
        frameData.username !== null &&
        frameData.username !== "" &&
        frameData.password !== undefined &&
        frameData.password !== null &&
        frameData.password !== "";
    });
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
