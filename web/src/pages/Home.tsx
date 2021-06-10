import {
  Box,
  Card,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from "@material-ui/core";
import React from "react";
import { NavBar } from "src/components/NavBar";
import { Padding } from "src/components/Padding";
import { useBookmarks, usePublications } from "src/state/Article";
import { Article, Like } from "server/src/models";
import { x } from "@xstyled/emotion";

function ArticleTile(props: { article: typeof Article.TYPE }) {
  return (
    <Card>
      <Box padding="1rem">
        <Typography variant="body2">
          <strong>{props.article.title}</strong>
        </Typography>
      </Box>
    </Card>
  );
}

function Bookmarks(props: {}) {
  const bookmarks = useBookmarks();

  return (
    <>
      {bookmarks.isLoading && <CircularProgress />}
      {bookmarks.data && (
        <>
          {!bookmarks.data.length && (
            <Typography variant="h6">
              You haven't bookmarked anything yet!
            </Typography>
          )}
          <Box
            display="grid"
            gridTemplateColumns="repeat(10, 10rem)"
            gridGap="1rem"
            gridAutoRows="15rem"
          >
            {bookmarks.data.map((bm) => (
              <ArticleTile key={bm.articleId} article={bm.article} />
            ))}
          </Box>
        </>
      )}
    </>
  );
}
function Publications(props: {}) {
  const publications = usePublications();

  return (
    <>
      {publications.isLoading && <CircularProgress />}
      {publications.data && (
        <>
          {!publications.data.length && (
            <Typography variant="h6">
              You haven't published anything yet!
            </Typography>
          )}
          <Box
            display="grid"
            gridTemplateColumns="repeat(10, 10rem)"
            gridGap="1rem"
            gridAutoRows="15rem"
          >
            {publications.data.map((article) => (
              <ArticleTile key={article.id} article={article} />
            ))}
          </Box>
        </>
      )}
    </>
  );
}

export function HomePage() {
  return (
    <>
      <NavBar />
      <Container>
        <Padding size={2} />

        <Box py="1rem" height="30rem" overflow="auto">
          <Typography variant="h4">Your Bookmarks</Typography>
          <Divider />
          <Padding />
          <Bookmarks />
        </Box>
        <Box py="1rem" height="30rem" overflow="auto">
          <Typography variant="h4">Your Publications</Typography>
          <Divider />
          <Padding />
          <Publications />
        </Box>
      </Container>
    </>
  );
}
