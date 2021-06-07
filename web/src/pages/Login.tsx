import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { LoginRequest } from "server/src/models";
import { FormError } from "src/components/FormError";
import { FormTextField } from "src/components/FormTextField";
import { useLoginMutation, useUser } from "src/state/User";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export function LoginPage() {
  const loginMutation = useLoginMutation();
  const { state: state } = useUser(false);
  const { register, handleSubmit, formState } =
    useForm<typeof LoginRequest.TYPE>();
  const router = useHistory();
  const classes = useStyles();

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Box>
          <Typography variant="h4">MusicBox</Typography>
        </Box>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form
          onSubmit={handleSubmit((form) =>
            loginMutation.mutate(form, {
              onSuccess: (data) => {
                state.user.set(data);
                router.push("/");
              },
            })
          )}
          className={classes.form}
          noValidate
        >
          <FormTextField
            variant="outlined"
            fullWidth
            margin="normal"
            label="Email"
            formState={formState}
            register={register}
            required
            name="email"
            autoComplete="email"
            type="email"
            autoFocus
          />
          <FormTextField
            variant="outlined"
            margin="normal"
            fullWidth
            label="Password"
            formState={formState}
            register={register}
            required
            name="password"
            type="password"
            autoComplete="current-password"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Sign In
          </Button>
          {loginMutation.error && <FormError error={loginMutation.error} />}
        </form>
      </div>
    </Container>
  );
}
