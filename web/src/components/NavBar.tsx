import { Box, Button, Typography } from "@material-ui/core";
import { useTheme } from "@material-ui/styles";
import { x } from "@xstyled/emotion";
import { meta } from "src/meta";
import { Padding } from "./Padding";
import React from 'react'
import { useUser } from "src/state/User";

export function NavBar() {
  const theme = useTheme();
  const { state: state, logout } = useUser(false);
  return (
    <x.header
      position="sticky"
      top={0}
      display="grid"
      px="2rem"
      py="1rem"
      gridTemplateColumns="minmax(10rem, 1fr)  auto"
      alignItems="center"
      borderBottom={`solid 1px ${theme.palette.grey[300]}`}
      w="100vw"
      overflow="hidden"
      bg={theme.palette.primary.dark}
      zIndex={theme.zIndex.appBar}
      color="white"
      h="6rem"
    >
      <Box clone flexShrink={0}>
        <Typography variant="h5">{meta.appName}</Typography>
      </Box>

      {state.value.user && (
        <x.div display="flex" flexDirection="column" alignItems="flex-end">
          <Typography variant="body2">
            Logged in as: {state.value.user.name}
          </Typography>
          <Padding size={0.5} />
          <Button color="inherit" variant="outlined" onClick={() => logout()}>
            Logout
          </Button>
        </x.div>
      )}
    </x.header>
  );
}
