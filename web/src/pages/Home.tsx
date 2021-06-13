import {
  Box,
  Card,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Link,
  Tooltip,
  Typography,
} from "@material-ui/core";
import React from "react";
import { NavBar } from "src/components/NavBar";
import { Padding } from "src/components/Padding";
import {
  useBookmarks,
  usePublications,
  useUnbookmark,
} from "src/state/Article";
import { Article, Like } from "server/src/models";
import { x } from "@xstyled/emotion";
import { ArticleViewerModal } from "src/components/ArticleViewerModal";
import { Bookmark, Delete } from "@material-ui/icons";

function ArticleTile(props: {
  onClick?: () => void;
  article: typeof Article.TYPE;
  onUnbookmark?: () => void;
}) {
  return (
    <Card>
      <Box display="flex" flexDirection="column" padding="1rem" height="100%">
        <Typography variant="body2">
          <Link onClick={props.onClick}>
            <strong>{props.article.title}</strong>
          </Link>
        </Typography>
        <Box flex={1} />
        <Box display="flex" justifyContent="flex-end" justifySelf="flex-end">
          {props.onUnbookmark ? (
            <Tooltip title="Remove Bookmark">
              <IconButton size="small" onClick={props.onUnbookmark}>
                <Delete />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>
    </Card>
  );
}

function Bookmarks(props: {
  onViewArticle: (article: typeof Article.TYPE) => void;
}) {
  const bookmarks = useBookmarks();
  const unbookmark = useUnbookmark();
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
            {bookmarks.data
              .sort(
                (a, z) =>
                  z.article.updatedAt.valueOf() - a.article.updatedAt.valueOf()
              )
              .map((bm) => (
                <ArticleTile
                  onUnbookmark={() =>
                    unbookmark.mutate({ articleId: bm.articleId })
                  }
                  onClick={() => props.onViewArticle(bm.article)}
                  key={bm.articleId}
                  article={bm.article}
                />
              ))}
          </Box>
        </>
      )}
    </>
  );
}
function Publications(props: {
  onViewArticle: (article: typeof Article.TYPE) => void;
}) {
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
            {publications.data
              .sort((a, z) => z.updatedAt.valueOf() - a.updatedAt.valueOf())
              .map((article) => (
                <ArticleTile
                  onClick={() => props.onViewArticle(article)}
                  key={article.id}
                  article={article}
                />
              ))}
          </Box>
        </>
      )}
    </>
  );
}

export function HomePage() {
  const [viewingArticle, setViewingArticle] =
    React.useState<typeof Article.TYPE>();

  return (
    <>
      {viewingArticle && (
        <ArticleViewerModal
          onClose={() => setViewingArticle(undefined)}
          article={viewingArticle}
        />
      )}
      <NavBar />
      <Container>
        <Padding size={2} />

        <Box py="1rem" height="30rem" overflow="auto">
          <Typography variant="h4">Your Bookmarks</Typography>
          <Divider />
          <Padding />
          <Bookmarks onViewArticle={(a) => setViewingArticle(a)} />
        </Box>
        <Box py="1rem" height="30rem" overflow="auto">
          <Typography variant="h4">Your Publications</Typography>
          <Divider />
          <Padding />
          <Publications onViewArticle={(a) => setViewingArticle(a)} />
        </Box>
      </Container>
    </>
  );
}
