import {
  Box,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from "@material-ui/core";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NavBar } from "src/components/NavBar";
import { Padding } from "src/components/Padding";
import { mostFrequentSearchTerms } from "src/state/Analytics";
export function AnalyticsPage() {
  const state = mostFrequentSearchTerms();

  return (
    <>
      <NavBar />
      <Container>
        <Padding size={2} />
        <Typography variant="h4">Top 10 most frequent search terms</Typography>
        <Divider />
        <Padding size={2} />
        <Box display="flex" justifyContent="center">
          {state.data ? (
            <BarChart width={1000} height={350} data={state.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="term" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="frequency" name="Frequency" fill="#8884d8" />
            </BarChart>
          ) : null}
          {state.isLoading && <CircularProgress />}
        </Box>
      </Container>
    </>
  );
}
