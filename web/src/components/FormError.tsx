import { Typography } from "@material-ui/core";
import { APIError } from "server/src/models";
import React from "react";

export const FormError = ({
  error,
}: {
  error: typeof APIError.TYPE | string;
}) => {
  return (
    <Typography variant="caption" color="error">
      {typeof error === "string" ? error : error.errorMessage}
    </Typography>
  );
};
