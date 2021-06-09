import {
  Box,
  createMuiTheme,
  CssBaseline,
  ThemeProvider,
} from "@material-ui/core";
import { x } from "@xstyled/emotion";
import React from "react";
import { QueryClientProvider } from "react-query";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import { AuthenticatedRoute } from "./components/AuthenticatedRoute";
import { NavBar } from "./components/NavBar";
import { HomePage } from "./pages/Home";
import { LoginAndRegisterPage } from "./pages/LoginAndRegister";
import { history } from "./state/history";
import { queryClient } from "./state/queryClient";

const theme = createMuiTheme({
  typography: {
    fontFamily: "PT Mono, mono",
  },
  props: {
    MuiContainer: {
      maxWidth: "md",
    },
  },
});

function App() {
  return (
    <Router history={history}>
      <QueryParamProvider ReactRouterRoute={Route}>
        <Switch>
          <Route exact path="/login">
            <LoginAndRegisterPage />
          </Route>
          <AuthenticatedRoute exact path="/home">
            <HomePage />
          </AuthenticatedRoute>
          <AuthenticatedRoute exact path="/publish">
            <NavBar />
            <h1>Publish shit</h1>
          </AuthenticatedRoute>
          <Redirect to="/home" />
        </Switch>
      </QueryParamProvider>
    </Router>
  );
}

function WrappedApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default WrappedApp;
