import { x } from "@xstyled/emotion";
import React from 'react'

export const Padding = ({ size = 1 }: { size?: number }) => (
  <x.div w={`${size}rem`} h={`${size}rem`} />
);
