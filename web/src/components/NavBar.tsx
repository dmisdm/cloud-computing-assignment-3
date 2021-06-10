import { Box, Grid, Tabs, Typography, Tab } from "@material-ui/core";

import { useTheme } from "@material-ui/styles";
import { x } from "@xstyled/emotion";
import React from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import { meta } from "src/meta";
import { useUser } from "src/state/User";
import { Padding } from "./Padding";

const tabs = [
  {
    label: "Home",
    pathPrefix: "/home",
  },
  {
    label: "Search",
    pathPrefix: "/search",
  },
  {
    label: "Publish",
    pathPrefix: "/publish",
  },
];

export function NavBar() {
  const theme = useTheme();
  const { state } = useUser(false);
  const history = useHistory();

  const currentTab = React.useMemo(
    () =>
      tabs.find((tab) =>
        history.location.pathname.startsWith(tab.pathPrefix)
      ) || tabs[0],
    [history.location.pathname]
  );
  return (
    <>
      <x.header
        position="sticky"
        top={0}
        px="2rem"
        py="1rem"
        borderBottom={`solid 1px ${theme.palette.grey[300]}`}
        w="100vw"
        overflow="hidden"
        bg={theme.palette.background.default}
        zIndex={theme.zIndex.appBar}
      >
        <Grid container alignItems="center">
          <Grid item xs={1} style={{ textAlign: "start" }}>
            <Typography variant="h5">{meta.appName}</Typography>
          </Grid>
          <Grid item xs={10}>
            <Grid container justify="center">
              <Tabs
                value={currentTab.pathPrefix}
                onChange={(_, v) =>
                  !history.location.pathname.startsWith(v) && history.push(v)
                }
              >
                {tabs.map((tab) => (
                  <Tab
                    value={tab.pathPrefix}
                    key={tab.label}
                    label={tab.label}
                  />
                ))}
              </Tabs>
            </Grid>
          </Grid>
          <Grid item xs={1} style={{ textAlign: "end" }}>
            {state.value.user && (
              <Box>
                <Typography variant="body2">{state.value.user.name}</Typography>
                <Padding size={0.5} />
                <RouterLink to="/login">Logout</RouterLink>
              </Box>
            )}
          </Grid>
        </Grid>
      </x.header>
    </>
  );
}
