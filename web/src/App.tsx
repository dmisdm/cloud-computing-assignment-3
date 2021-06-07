import {
  Container,
  createMuiTheme,
  CssBaseline,
  ThemeProvider,
} from "@material-ui/core";
import React from "react";
import { LoginPage } from "./pages/Login";
import { Redirect, Route, Switch, BrowserRouter } from "react-router-dom";
import { AuthenticatedRoute } from "./components/AuthenticatedRoute";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./state/queryClient";

const theme = createMuiTheme();

function App() {
  return (
    <BrowserRouter>

    
    <Switch>
      <Route exact path="/login">
          <LoginPage />
      </Route>
      <AuthenticatedRoute exact path="/">
          <h1> You're home </h1>
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
