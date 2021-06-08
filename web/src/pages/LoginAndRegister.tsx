import { Card, Divider } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { LoginRequest, RegisterRequest } from "server/src/models";
import { FormError } from "src/components/FormError";
import { FormTextField } from "src/components/FormTextField";
import { Padding } from "src/components/Padding";
import { meta } from "src/meta";
import { useLoginMutation, useRegisterMutation, useUser } from "src/state/User";

function LoginForm() {
  const loginMutation = useLoginMutation();
  const { state: state } = useUser(false);
  const { register, handleSubmit, formState } =
    useForm<typeof LoginRequest.TYPE>();
  const router = useHistory();
  return (
    <form
      onSubmit={handleSubmit((form) =>
        loginMutation.mutate(form, {
          onSuccess: (data) => {
            state.user.set(data);
            router.push("/");
          },
        })
      )}
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
      <Padding />
      <Button type="submit" fullWidth variant="contained" color="primary">
        Sign In
      </Button>
      <Padding />
      {loginMutation.error && <FormError error={loginMutation.error} />}
    </form>
  );
}

function RegisterForm() {
  const mutation = useRegisterMutation();
  const userState = useUser(false);
  const { register, handleSubmit, formState } =
    useForm<typeof RegisterRequest.TYPE>();
  const router = useHistory();
  return (
    <form
      onSubmit={handleSubmit((form) =>
        mutation.mutate(form, {
          onSuccess: (user) => {
            userState.state.set((state) => ({
              ...state,
              user: {
                id: user.sub,
                name: user.name,
                email: user.email,
              },
            }));
            router.push("/");
          },
        })
      )}
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
        label="Full Name"
        formState={formState}
        register={register}
        required
        name="name"
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
      <Padding />
      <Button type="submit" fullWidth variant="contained" color="primary">
        Register
      </Button>
      <Padding />
      {mutation.error && <FormError error={mutation.error} />}
    </form>
  );
}

export function LoginAndRegisterPage() {
  const [state, setState] = React.useState("login" as "login" | "register");
  return (
    <Container component="main" maxWidth="xs">
      <Padding size={5} />
      <Card style={{ padding: "1rem", textAlign: "center" }}>
        <Box>
          <Typography variant="h4">{meta.appName}</Typography>
        </Box>
        <Typography variant="h6">Sign in or create an account</Typography>
        {state === "login" ? <LoginForm /> : <RegisterForm />}
        <Padding />
        <Divider />
        <Padding />
        <Button
          fullWidth
          onClick={() =>
            setState((s) => (s === "login" ? "register" : "login"))
          }
        >
          {state === "login" ? "Register" : "Login"}
        </Button>
      </Card>
    </Container>
  );
}
