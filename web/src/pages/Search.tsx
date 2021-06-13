import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  ArrowBack,
  Bookmark,
  BookmarkBorder,
  Favorite,
  FavoriteBorder,
  SearchOutlined,
} from "@material-ui/icons";
import { x } from "@xstyled/emotion";
import FuzzySearch from "fuzzy-search";
import React from "react";
import {
  AggregatedSearchResults,
  Article,
  Like,
  SearchResults,
} from "server/src/models";
import { ArticleViewerModal } from "src/components/ArticleViewerModal";
import { NavBar } from "src/components/NavBar";
import { Padding } from "src/components/Padding";
import { useBookmark, useBookmarks, useUnbookmark } from "src/state/Article";
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

export function SearchPage() {
  const [queryParam, setQueryParam] = useQueryParam("q", StringParam);
  const bookmark = useBookmark();
  const unbookmark = useUnbookmark();
  const likes = useBookmarks(undefined);
  const [lastSubmittedDate, setLastSubmittedDate] = React.useState<
    Date | undefined
  >(queryParam ? new Date() : undefined);
  const [lastSubmittedQuery, setLastSubmittedQuery] = React.useState(
    queryParam || ""
  );

  const [selectedArticle, setSelectedArticle] =
    React.useState<typeof Article.TYPE>();
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
      {selectedArticle && (
        <ArticleViewerModal
          onClose={() => setSelectedArticle(undefined)}
          articleId={selectedArticle.id}
        />
      )}
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
                  <Typography variant="h4">
                    <Link href="#" onClick={() => setSelectedArticle(result)}>
                      {result.title}
                    </Link>
                  </Typography>
                  <Padding size={0.5} />
                  <Chip label={result.source} />
                </Grid>
                <Grid style={{ textAlign: "end" }} item xs={1}>
                  {!result.liked ? (
                    <Tooltip title="Bookmark">
                      <IconButton
                        onClick={() =>
                          bookmark.mutate({ articleId: result.id })
                        }
                      >
                        <BookmarkBorder />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Remove Bookmark">
                      <IconButton
                        onClick={() =>
                          unbookmark.mutate({ articleId: result.id })
                        }
                      >
                        <Bookmark />
                      </IconButton>
                    </Tooltip>
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
