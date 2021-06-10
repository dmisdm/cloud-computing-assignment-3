import { x } from "@xstyled/emotion";
import React from "react";

export const Padding = ({
  size = 1,
  inline = false,
}: {
  size?: number;
  inline?: boolean;
}) => {
  const C = inline ? x.span : x.div;
  return <C w={`${size}rem`} h={`${size}rem`} />;
};
