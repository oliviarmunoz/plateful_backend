import { actions, Sync } from "@engine";
import { Requesting, Sessioning, UserAuthentication } from "@concepts";

// register user sync
export const RegisterRequest: Sync = ({ request, username, password }) => ({
  when: actions([Requesting.request, {
    path: "/UserAuthentication/register",
    username,
    password,
  }, { request }]),
  then: actions([UserAuthentication.register, { username, password }]),
});

export const RegisterResponseSuccess: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/register" }, { request }],
    [UserAuthentication.register, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

export const RegisterResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/register" }, { request }],
    [UserAuthentication.register, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// authenticate user sync
export const AuthenticateRequest: Sync = ({ request, username, password }) => ({
  when: actions([Requesting.request, {
    path: "/UserAuthentication/authenticate",
    username,
    password,
  }, {
    request,
  }]),
  then: actions([UserAuthentication.authenticate, { username, password }]),
});

export const AuthenticateSuccessCreatesSession: Sync = ({ user }) => ({
  when: actions([UserAuthentication.authenticate, {}, { user }]),
  then: actions([Sessioning.create, { user }]),
});

export const AuthenticateResponseSuccess: Sync = (
  { request, user, session },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/authenticate" }, {
      request,
    }],
    [UserAuthentication.authenticate, {}, { user }],
    [Sessioning.create, { user }, { session }],
  ),
  then: actions([Requesting.respond, { request, session, user }]),
});

export const AuthenticateResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/authenticate" }, {
      request,
    }],
    [UserAuthentication.authenticate, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// logout user sync
export const LogoutRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/logout", session }, {
    request,
  }]),
  where: async (frames) => {
    const sessionFrames = await frames.query(
      Sessioning._getUser,
      { session },
      { user },
    );
    return sessionFrames.filter((frame) => frame[user] !== undefined);
  },
  then: actions([Sessioning.delete, { session }]),
});

export const LogoutResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/logout" }, { request }],
    [Sessioning.delete, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "logged_out" }]),
});

export const SessionGetUserResponseSuccess: Sync = (
  { request, session },
) => {
  const userBinding = Symbol("sessionUser");
  return {
    when: actions(
      [Requesting.request, { path: "/Sessioning/_getUser", session }, {
        request,
      }],
    ),
    where: async (frames) =>
      (await frames.query(
        Sessioning._getUser,
        { session },
        { user: userBinding },
      )).filter((frame) => frame[userBinding] !== undefined),
    then: actions([Requesting.respond, { request, user: userBinding }]),
  };
};

export const SessionGetUserResponseError: Sync = ({ request, session }) => {
  const errorBinding = Symbol("sessionError");
  return {
    when: actions(
      [Requesting.request, { path: "/Sessioning/_getUser", session }, {
        request,
      }],
    ),
    where: async (frames) =>
      (await frames.query(
        Sessioning._getUser,
        { session },
        { error: errorBinding },
      )).filter((frame) => frame[errorBinding] !== undefined),
    then: actions([Requesting.respond, { request, error: errorBinding }]),
  };
};
