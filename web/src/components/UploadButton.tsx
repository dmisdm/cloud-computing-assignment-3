import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Typography,
} from "@material-ui/core";
import React from "react";
import {
  FieldValues,
  FieldPath,
  UseFormRegister,
  Control,
  useWatch,
  useFormState,
} from "react-hook-form";
import { Padding } from "./Padding";

export function UploadButton<
  FormValues extends FieldValues,
  Name extends FieldPath<FormValues>
>({
  name,
  register,
  required,
  label,
  control,
  ...props
}: JSX.IntrinsicElements["input"] & {
  label: string;
  name: Name;
  register: UseFormRegister<FormValues>;
  required?: boolean;
  control: Control<FormValues>;
}) {
  const value: unknown = useWatch({ name, control });
  const formState = useFormState({ control });
  const shouldShowError = !!formState.errors[name];

  const inputProps = register(name, {
    validate: (value: unknown) => {
      if (!required) return true;

      return value instanceof FileList && value.length > 0
        ? true
        : "This field is required";
    },
  });

  return (
    <FormControl onBlur={inputProps.onBlur} error={shouldShowError}>
      <input
        {...props}
        onChange={inputProps.onChange}
        ref={inputProps.ref}
        name={inputProps.name}
        onBlur={inputProps.onBlur}
        type="file"
        accept=".pdf"
        id="upload-button"
        style={{ display: "none" }}
      />
      <label htmlFor="upload-button">
        <FormLabel style={{ paddingRight: "1rem" }}>{label}:</FormLabel>
        {value instanceof FileList && value.length > 0 ? (
          <>
            <Typography display="inline">{value.item(0)?.name}</Typography>{" "}
            <Padding inline />
          </>
        ) : null}

        <Button variant="outlined" component="span">
          Select PDF
        </Button>
      </label>
      {shouldShowError && (
        <FormHelperText>
          {(formState.errors[name] as any).message}
        </FormHelperText>
      )}
    </FormControl>
  );
}
