import { Injectable } from '@nestjs/common';
import * as convict from 'convict';

export const config = convict({
  articleBucketName: {
    format: String,
  },
});

@Injectable()
export class Config {}
