import { TextField } from "@material-ui/core";
import {
  FieldPath,
  FieldValues,
  FormState,
  UseFormRegister,
  get,
} from "react-hook-form";
import React from 'react'

export function FormTextField<
  FormValues extends FieldValues,
  Name extends FieldPath<FormValues>
>({
  formState,
  name,
  register,
  required,
  label,
  ...props
}: React.ComponentPropsWithoutRef<typeof TextField> & {
  label: string;
  name: Name;
  formState: FormState<FormValues>;
  register: UseFormRegister<FormValues>;
  required?: boolean;
}) {
  const shouldShowError =
    !!formState.touchedFields[name] || formState.isSubmitted;
  return (
    <TextField
      {...props}
      label={label}
      error={shouldShowError && !!formState.errors[name]}
      helperText={shouldShowError && get(formState.errors, name)?.message}
      InputProps={register(name, {
        required: required ? `${label} is required` : undefined,
      })}
    />
  );
}
