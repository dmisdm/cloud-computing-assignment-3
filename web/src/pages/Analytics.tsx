import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Typography,
  Snackbar,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
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
import { axiosClient } from "src/state/axiosClient";
export function AnalyticsPage() {
  const state = mostFrequentSearchTerms();
  const [toast, setToast] = React.useState<React.ReactNode>();
  const [runningTask, setRunningTask] = React.useState(false);
  return (
    <>
      <NavBar />
      <Container>
        <Padding size={2} />
        <Typography variant="h4">Top 10 most frequent search terms</Typography>
        <Divider />
        <Padding size={2} />
        <Box display="flex" justifyContent="center">
          {state.data && state.data.length ? (
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
        <Padding />
        {!state.isLoading && !state.data?.length ? (
          <>
            {" "}
            <Typography>
              No analytics data available, there may be an analytics task in
              progress
            </Typography>
            <Padding />
          </>
        ) : null}
        <Button
          onClick={() => {
            setRunningTask(true);
            axiosClient
              .post("/api/run-analytics-job")
              .then(() => {
                setToast(
                  <Dialog open onClose={() => setToast(undefined)}>
                    <DialogTitle>
                      <IconButton
                        style={{ float: "right" }}
                        onClick={() => setToast(undefined)}
                      >
                        <Close />
                      </IconButton>
                      Note
                    </DialogTitle>
                    <DialogContent>
                      Please note that the EMR task can take around 5-10 minutes
                      to finish.
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setToast(undefined)}>OK</Button>
                    </DialogActions>
                  </Dialog>
                );
              })
              .catch(() => {
                setToast(
                  <Snackbar
                    open
                    autoHideDuration={5000}
                    message="Something went wrong. Please try again."
                  ></Snackbar>
                );
              })
              .finally(() => {
                setRunningTask(false);
              });
          }}
          variant="outlined"
          fullWidth
          disabled={runningTask}
          endIcon={runningTask && <CircularProgress size="1rem" />}
        >
          Re-run MapReduce
        </Button>
        {toast}
      </Container>
    </>
  );
}
