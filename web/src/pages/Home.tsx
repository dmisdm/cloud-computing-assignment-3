import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@material-ui/core";
import {
  ArrowBack,
  Favorite,
  FavoriteBorder,
  SearchOutlined,
} from "@material-ui/icons";
import { x } from "@xstyled/emotion";
import FuzzySearch from "fuzzy-search";
import React from "react";
import {
  AggregatedSearchResults,
  Like,
  SearchResults,
} from "server/src/models";
import { NavBar } from "src/components/NavBar";
import { Padding } from "src/components/Padding";
import { useLike, useLikes, useUnlike } from "src/state/Article";
import { useSearch } from "src/state/Search";
import { StringParam, useQueryParam } from "use-query-params";

const sortAndFlattenAggregateResults = (
  results: typeof AggregatedSearchResults.TYPE,
  likes: typeof Like.TYPE[],
  searchQuery: string
) => {
  const merged = Object.entries(results).reduce(
    (acc, [key, val]) => [
      ...acc,
      ...val.results.map((result) => ({
        ...result,
        source: key,
        liked: !!likes.find((like) => like.articleId === result.id),
      })),
    ],
    [] as (typeof SearchResults.TYPE["results"][0] & {
      source: string;
      liked: boolean;
    })[]
  );
  const searcher = new FuzzySearch(merged, ["title", "summary"], {
    caseSensitive: false,
    sort: true,
  });
  return searcher.search(searchQuery);
};

export function HomePage() {
  const [queryParam, setQueryParam] = useQueryParam("q", StringParam);
  const like = useLike();
  const unlike = useUnlike();
  const likes = useLikes(undefined);
  const [lastSubmittedDate, setLastSubmittedDate] = React.useState<
    Date | undefined
  >(queryParam ? new Date() : undefined);
  const [lastSubmittedQuery, setLastSubmittedQuery] = React.useState(
    queryParam || ""
  );

  const search = useSearch(
    { query: lastSubmittedQuery },
    {
      retry: false,
      enabled: false,
    }
  );
  React.useEffect(() => {
    if (queryParam?.trim().length) {
      search.refetch({ cancelRefetch: true });
    }
  }, [lastSubmittedQuery, lastSubmittedDate]);

  const searchResults = React.useMemo(
    () =>
      search.data && likes.data
        ? sortAndFlattenAggregateResults(
            search.data,
            likes.data,
            queryParam || ""
          )
        : [],
    [search.data, likes.data]
  );
  return (
    <>
      <NavBar />

      <Container maxWidth="md">
        <Padding size={2} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLastSubmittedQuery(queryParam || "");
            setLastSubmittedDate(new Date());
          }}
        >
          <TextField
            fullWidth
            label="Search for articles"
            variant="outlined"
            name="query"
            value={queryParam || ""}
            onChange={(e) => {
              setQueryParam(e.currentTarget.value);
            }}
            InputProps={{
              startAdornment: lastSubmittedDate && (
                <>
                  <IconButton
                    onClick={() => {
                      setQueryParam(null);
                      setLastSubmittedDate(undefined);
                      search.remove();
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                </>
              ),
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

        {search.isLoading && (
          <Box width="100%" p="1rem" textAlign="center">
            <CircularProgress variant="indeterminate" />
          </Box>
        )}
        {searchResults.map((result) => (
          <React.Fragment key={result.id}>
            <Padding size={2} />
            <Card
              style={{ width: "100%", minHeight: "15rem", padding: "1.5rem" }}
            >
              <Grid container>
                <Grid xs={11} item>
                  <Typography variant="h4">{result.title}</Typography>
                  <Padding size={0.5} />
                  <Chip label={result.source} />
                </Grid>
                <Grid style={{ textAlign: "end" }} item xs={1}>
                  {!result.liked ? (
                    <IconButton
                      onClick={() => like.mutate({ articleId: result.id })}
                      title="Like"
                    >
                      <FavoriteBorder />
                    </IconButton>
                  ) : (
                    <IconButton
                      onClick={() => unlike.mutate({ articleId: result.id })}
                      title="Unlike"
                    >
                      <Favorite />
                    </IconButton>
                  )}
                </Grid>
              </Grid>
              <Padding />
              <Divider />
              <Padding />
              <Typography variant="body1">{result.summary}</Typography>
            </Card>
          </React.Fragment>
        ))}
        {!searchResults.length &&
          !search.isLoading &&
          lastSubmittedDate &&
          search.isFetched && (
            <Box textAlign="center" p="1rem">
              <Typography variant="h6">
                No results matched your query. Try again.
              </Typography>
            </Box>
          )}
      </Container>
    </>
  );
}
