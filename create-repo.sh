#!/bin/sh

username=$1
repo_name=$2

test -z $repo_name && echo "Repo name required." 1>&2 && exit 1

curl -u $username https://api.github.com/user/repos -d "{\"name\":\"$repo_name\"}"