import { RouteProps, Route } from "react-router-dom";
import React from 'react'
import { useUser } from "../state/User";

export function AuthenticatedRoute(props: RouteProps) {
    const user = useUser()
    return (user.state.value.hydrated && user.state.value.user) ? <Route {...props} /> : null
}