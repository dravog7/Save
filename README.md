# Save

A CLI Downloader that utilizes concurrent requests for faster downloads.

## Install

- Download or Clone this repository

- Open terminal inside the downloaded repository

- Install globally the package

    ```npm install -g .```

- Run the command in terminal

    ``` save ```

## Commands

|Command|description|extra|
|-------|-----------|-----|
|save [url]|Downloads the URL|Default|
|r [filename]|Resume a download that was stopped gracefully (using Ctrl+C)| |

## Options

|Option|description|Type|
|------|:-----------:|----|
|--help |Show help|[boolean]|
|--version|Show version number|[boolean]|
|--file, -f|Filename of download|[string]|
|--parts, -p|number of parts downloaded simultaneously|[number]|
