import { Injectable } from '@nestjs/common';
import { parse } from 'fast-xml-parser';
import { axiosClient } from 'src/axios';
import { ArxivSearchResults, SearchResults } from 'src/models';
import Url from 'url-parse';
import { SearchSource } from './types';

export const arxivBaseUrl = Url('http://export.arxiv.org/api/query');

@Injectable()
export class ArxivSearchSourceProvider implements SearchSource {
  name = 'arxiv';
  async search(
    params:
      | {
          query: string;
          offset?: number;
          limit?: number;
        }
      | {
          ids: string[];
        },
  ): Promise<typeof SearchResults.TYPE> {
    let query;
    let offset;
    let limit;
    let ids;
    if ('ids' in params) {
      query = '';
      offset = 0;
      limit = 1;
      ids = params.ids;
    } else {
      query = params.query;
      offset = params.offset || 0;
      limit = params.limit || 20;
    }
    const formedUrl = arxivBaseUrl.set(
      'query',
      ids
        ? {
            id_list: ids
              .map((id) => {
                const parsed = new URL(id);
                return parsed.pathname.replace(/\/?abs\//, '');
              })
              .join(','),
          }
        : {
            search_query: query,
            start: offset,
            max_results: limit,
          },
    );

    const arxivResult = await (
      await axiosClient.get(formedUrl.toString())
    ).data;

    const parsedXml = parse(arxivResult, {
      ignoreAttributes: false,
    });

    const resData = ArxivSearchResults.create(parsedXml);
    const entries =
      resData.feed.entry instanceof Array
        ? resData.feed.entry
        : resData.feed.entry
        ? [resData.feed.entry]
        : [];

    return {
      limit,
      offset,
      query,
      results:
        entries.map((entry) => ({
          id: entry.id,
          published: entry.published,
          summary: entry.summary,
          title: entry.title,
          updated: entry.updated,
          authors:
            entry.author instanceof Array
              ? entry.author.map((author) => author.name)
              : [entry.author.name],
          categories:
            entry.category instanceof Array
              ? entry.category.map((cat) => cat['@_term'])
              : [entry.category['@_term']],
        })) || [],
    };
  }
}
