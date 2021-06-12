import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { FormTextField } from "src/components/FormTextField";
import { NavBar } from "src/components/NavBar";
import { UploadButton } from "src/components/UploadButton";
import { usePublishArticle } from "src/state/Article";

type Form = {
  title: string;
  summary: string;
  document: FileList;
  categories: string[];
};
function NewPublicationForm() {
  const { register, formState, handleSubmit, control } = useForm<Form>();
  const publishArticle = usePublishArticle();
  const [loading, setLoading] = React.useState(false);
  const history = useHistory();
  return (
    <Box p="1rem">
      <form
        onSubmit={handleSubmit((values) => {
          setLoading(true);
          publishArticle.mutate(
            {
              ...values,
              document: values.document.item(0)!!,
            },
            {
              onSuccess: () => {
                history.push("/home");
                setLoading(false);
              },
              onSettled: () => {
                setLoading(false);
              },
              onError: () => {
                setLoading(false);
              },
            }
          );
        })}
      >
        <Box display="flex" flexDirection="column" style={{ gap: "1rem" }}>
          <Typography variant="h4">New Publication</Typography>
          <FormTextField
            required
            register={register}
            formState={formState}
            name="title"
            label="Title"
          />
          <FormTextField
            required
            register={register}
            formState={formState}
            name="summary"
            label="Summary"
            multiline
          />
          <UploadButton
            required
            register={register}
            control={control}
            name="document"
            label="Article"
          />
          <Button
            endIcon={loading && <CircularProgress size="1rem" />}
            disabled={loading}
            type="submit"
          >
            Publish
          </Button>
        </Box>
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
