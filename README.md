# Save

![Node.js CI](https://github.com/dravog7/Save/workflows/Node.js%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/save-cli.svg)](https://www.npmjs.com/package/save-cli)
[![npm downloads](https://img.shields.io/npm/dm/save-cli.svg)](https://www.npmjs.com/package/save-cli)

A CLI Downloader that utilizes concurrent requests for faster downloads.

## Install

- Download from npm

    ``` npm install save-cli -g ```

- Run the command in terminal

    ``` save ```

## Commands

|Command|description|extra|
|-------|-----------|-----|
|save download [url]|Downloads the URL|Default|
|save resume [filename]|Resume a download that was stopped gracefully (using Ctrl+C)| |
|save list|List incomplete downloads in folder| |

## Options

|Option|description|Type|
|------|:-----------:|----|
|--help |Show help|[boolean]|
|--version|Show version number|[boolean]|
|--file, -f|Filename of download|[string]|
|--parts, -p|number of parts downloaded simultaneously|[number]|
|--verbose -v|Determine verbose level [default:1]|[number]|

## dev-installations

- Fork and clone this repository

- Install dev dependencies

    ```npm  install --dev```

- Run

    ``` ./bin/run ``` or ```./bin/run.cmd```

  To access the CLI entry point

## Contributions

- Welcoming pull requests for issues!
