import { NavBar } from "src/components/NavBar";
import React from "react";
import { Box, Button, Container, Grid, Typography } from "@material-ui/core";
import { FormTextField } from "src/components/FormTextField";
import { useForm } from "react-hook-form";

type Form = {
  title: string;
  summary: string;
  document: File;
  categories: string[];
};
function NewPublicationForm() {
  const { register, formState, handleSubmit } = useForm<Form>();
  return (
    <Box p="1rem">
      <form onSubmit={handleSubmit(() => {})}>
        <Grid container spacing={2} direction="column">
          <Typography variant="h4">New Publication</Typography>
          <FormTextField
            register={register}
            formState={formState}
            name="title"
            label="Title"
          />
          <FormTextField
            register={register}
            formState={formState}
            name="summary"
            label="Summary"
            multiline
          />
          <Button>Publish </Button>
        </Grid>
      </form>
    </Box>
  );
}

export function PublishPage() {
  return (
    <>
      <NavBar />
      <Container>
        <NewPublicationForm />
      </Container>
    </>
  );
}
