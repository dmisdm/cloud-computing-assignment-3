import {
  Card,
  Container,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@material-ui/core";
import { SearchOutlined } from "@material-ui/icons";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormTextField } from "src/components/FormTextField";
import { NavBar } from "src/components/NavBar";
import { Padding } from "src/components/Padding";
import { useSearch } from "src/state/Search";

export function HomePage() {
  const { register, formState, handleSubmit, getValues, control } = useForm<{
    query: string;
  }>();

  const search = useSearch(useWatch({ name: "query", control }), false);
  return (
    <>
      <NavBar
        middleElement={
          <form
            onSubmit={handleSubmit((values) => {
              search.refetch();
            })}
          >
            <FormTextField
              register={register}
              formState={formState}
              fullWidth
              label="Search"
              variant="outlined"
              name="query"
              InputProps={{
                endAdornment: (
                  <>
                    <IconButton type="submit">
                      <SearchOutlined />
                    </IconButton>
                  </>
                ),
              }}
            />
          </form>
        }
      />
      <Container maxWidth="md">
        {search.data?.results.map((result) => (
          <React.Fragment key={result.id}>
            <Padding size={3} />
            <Card
              style={{ width: "100%", minHeight: "15rem", padding: "1.5rem" }}
            >
              <Typography variant="h4">{result.title}</Typography>
              <Padding />
              <Divider />
              <Padding />
              <Typography variant="body1">{result.summary}</Typography>
            </Card>
          </React.Fragment>
        )) || false}
      </Container>
    </>
  );
}
