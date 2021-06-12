import { RouteProps, Route, Redirect } from "react-router-dom";
import React from "react";
import { useUser } from "../state/User";

export function AuthenticatedRoute({
  allowedRoles,
  ...props
}: RouteProps & { allowedRoles?: string[] }) {
  const user = useUser();

  if (
    !user.state.value.user ||
    (allowedRoles &&
      !allowedRoles.find((role) => user.state.value.user?.roles.includes(role)))
  ) {
    return <Redirect to="/home" />;
  }

  return <Route {...props} />;
}
