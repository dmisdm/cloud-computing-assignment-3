import {
  Container,
  createMuiTheme,
  CssBaseline,
  ThemeProvider,
} from "@material-ui/core";
import React from "react";
import { LoginAndRegisterPage } from "./pages/LoginAndRegister";
import { Redirect, Route, Switch, BrowserRouter } from "react-router-dom";
import { AuthenticatedRoute } from "./components/AuthenticatedRoute";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./state/queryClient";
import { HomePage } from "./pages/Home";

const theme = createMuiTheme();

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/login">
          <LoginAndRegisterPage />
        </Route>
        <AuthenticatedRoute exact path="/">
          <HomePage />
        </AuthenticatedRoute>
        <Redirect to="/" />
      </Switch>
    </BrowserRouter>
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
