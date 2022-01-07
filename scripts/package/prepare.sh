#!/usr/bin/env bash

set -euo pipefail
shopt -s globstar

# cd to the root of the repo
cd "$(git rev-parse --show-toplevel)"

# clean
rm -rf dist/contracts

# contracts
cp -r contracts dist/contracts
rm -rf dist/contracts/mocks