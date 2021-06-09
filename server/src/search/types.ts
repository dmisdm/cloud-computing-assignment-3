import { SearchRequest, SearchResults } from 'src/models';

export interface SearchSource {
  name: string;
  search(
    searchParams: typeof SearchRequest.TYPE,
  ): Promise<typeof SearchResults.TYPE>;
}
