import {
  Box,
  createMuiTheme,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@material-ui/core";
import { x } from "@xstyled/emotion";
import React from "react";
import { QueryClientProvider } from "react-query";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import { AuthenticatedRoute } from "./components/AuthenticatedRoute";
import { NavBar } from "./components/NavBar";
import { SearchPage } from "./pages/Search";
import { LoginAndRegisterPage } from "./pages/LoginAndRegister";
import { PublishPage } from "./pages/Publish";
import { history } from "./state/history";
import { queryClient } from "./state/queryClient";
import { HomePage } from "./pages/Home";
import { AnalyticsPage } from "./pages/Analytics";
import { QueryStringRoute } from "./components/QueryStringRoute";
import { ArticleViewerModal } from "./components/ArticleViewerModal";

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
          <AuthenticatedRoute exact path="/search">
            <SearchPage />
          </AuthenticatedRoute>
          <AuthenticatedRoute exact path="/publish">
            <PublishPage />
          </AuthenticatedRoute>
          <AuthenticatedRoute allowedRoles={["Admin"]} exact path="/analytics">
            <AnalyticsPage />
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
