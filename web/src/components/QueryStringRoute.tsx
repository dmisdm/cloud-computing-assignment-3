import React from "react";
import { useHistory } from "react-router-dom";

export function QueryStringRoute(props: {
  queryStringPattern: RegExp;
  children: React.ReactElement;
}) {
  const history = useHistory();

  if (props.queryStringPattern.test(history.location.search)) {
    return props.children;
  } else {
    return null;
  }
}
