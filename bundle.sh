#!/bin/sh
set -eu
zip -r bundle.zip ./ -x .git\* \*node_modules\* .yarn/unplugged\* .yarn/cache\* ops/cdk.out\* 