import { Box, Typography } from "@material-ui/core";
import { useTheme } from "@material-ui/styles";
import { x } from "@xstyled/emotion";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { meta } from "src/meta";
import { useUser } from "src/state/User";
import { Padding } from "./Padding";

export function NavBar(props: { middleElement?: React.ReactNode }) {
  const theme = useTheme();
  const { state } = useUser(false);

  return (
    <>
      <x.header
        position="sticky"
        top={0}
        display="grid"
        px="2rem"
        py="1rem"
        gridTemplateColumns="minmax(10rem, 1fr) 1fr minmax(10rem, 1fr)"
        alignItems="center"
        borderBottom={`solid 1px ${theme.palette.grey[300]}`}
        w="100vw"
        overflow="hidden"
        bg={theme.palette.background.default}
        zIndex={theme.zIndex.appBar}
        h="6rem"
      >
        <Box clone flexShrink={0}>
          <Typography variant="h5">{meta.appName}</Typography>
        </Box>

        <Box>{props.middleElement}</Box>

        {state.value.user && (
          <x.div display="flex" flexDirection="column" alignItems="flex-end">
            <Typography variant="body2">{state.value.user.name}</Typography>
            <Padding size={0.5} />
            <RouterLink to="/login">Logout</RouterLink>
          </x.div>
        )}
      </x.header>
    </>
  );
}
