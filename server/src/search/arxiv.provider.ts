import { Injectable } from '@nestjs/common';
import { parse } from 'fast-xml-parser';
import { axiosClient } from 'src/axios';
import { ArxivSearchResults, SearchResults } from 'src/models';
import * as Url from 'url-parse';

export const arxivBaseUrl = Url('http://export.arxiv.org/api/query');

@Injectable()
export class ArxivSearchSourceProvider {
  async search({
    query,
    offset = 0,
    limit = 20,
  }: {
    query: string;
    offset?: number;
    limit?: number;
  }): Promise<typeof SearchResults.TYPE> {
    const formedUrl = arxivBaseUrl.set('query', {
      search_query: query,
      start: offset,
      max_results: limit,
    });

    const resData = ArxivSearchResults.create(
      parse(await (await axiosClient.get(formedUrl.toString())).data),
    );

    return {
      total: resData.feed['opensearch:totalResults'],
      limit,
      offset,
      query,
      results: resData.feed.entry.map((entry) => ({
        id: entry.id,
        published: entry.published,
        summary: entry.summary,
        title: entry.title,
        updated: entry.updated,
        authors: entry.author,
      })),
    };
  }
}
