import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  LinearProgress,
} from "@material-ui/core";
import { Close, CloudDownload } from "@material-ui/icons";
import { x } from "@xstyled/emotion";
import React from "react";
import { Article } from "../../../server/src/models";
import { Padding } from "./Padding";
import { format } from "date-fns";
import { useAddComment, useArticle, useComments } from "src/state/Article";
const dateFormat = "dd  LLL yyyy HH:mm";
export function ArticleViewerModal({
  articleId,
  onClose,
}: {
  articleId: string;
  onClose: () => void;
}) {
  const articleQuery = useArticle({ id: articleId });
  const article = articleQuery.data;
  const authors =
    article?.arxivArticle?.authors ?? article?.authors.map((a) => a.name);
  const comments = useComments();
  const addComment = useAddComment();
  const [currentComment, setCurrentComment] = React.useState("");
  const articleComments = React.useMemo(
    () => comments.data?.filter((comment) => comment.article.id === articleId),
    [comments.data, article]
  );

  const lastUpdated = article?.arxivArticle?.updated ?? article?.updatedAt;
  return (
    <>
      <Dialog fullWidth maxWidth="md" open onClose={onClose}>
        <DialogTitle>
          <IconButton style={{ float: "right" }} onClick={onClose}>
            <Close />
          </IconButton>
          {article ? article.title : <LinearProgress variant="indeterminate" />}
        </DialogTitle>
        {authors && article && lastUpdated && (
          <DialogContent>
            <x.small px="1rem">Authors: {authors.join(", ")}</x.small> <br />
            <x.small px="1rem">
              Last Updated: {format(lastUpdated, dateFormat)}
            </x.small>
            <Box p="1rem">
              <Typography>{article.summary}</Typography>
              <Padding />
              <Box display="flex" justifyContent="flex-end">
                <Tooltip title="Download">
                  <IconButton
                    onClick={() => {
                      open(article.documentUrl);
                    }}
                  >
                    <CloudDownload />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Padding size={2} />
            <Typography variant="h5">Comments</Typography>
            <Divider />
            <Padding />
            <Box
              maxHeight="10rem"
              overflow="auto"
              display="flex"
              flexDirection="column"
            >
              {articleComments &&
              articleComments.length &&
              !comments.isLoading ? (
                articleComments.map((comment) => (
                  <Typography variant="caption">
                    <x.small>{format(comment.createdAt, dateFormat)}: </x.small>

                    <strong>{comment.text}</strong>
                  </Typography>
                ))
              ) : !(articleComments && articleComments.length) ? (
                <Typography>No comments yet</Typography>
              ) : null}
            </Box>
            <Padding />
            <Box display="flex">
              <TextField
                label="Add Comment"
                onChange={(e) => setCurrentComment(e.currentTarget.value)}
                name="new-comment"
                variant="outlined"
                value={currentComment}
                fullWidth
              />
              <Button
                disabled={currentComment.length < 1}
                onClick={() =>
                  addComment.mutate(
                    {
                      articleId: article.id,
                      comment: currentComment,
                    },
                    {
                      onSettled: () => {
                        setCurrentComment("");
                        comments.refetch();
                      },
                    }
                  )
                }
              >
                Comment
              </Button>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
