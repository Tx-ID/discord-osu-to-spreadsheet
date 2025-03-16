# Discord Osu! to Spreadsheet

Finished in under 18 hours. And I'm proud of it.

## Installation & Running

*This part assumes a lot of things, so bare with it.*

1. Copy `.env.example` and rename it to `.env` then fill it
2. In terminal run `bun install`
3. Run `bun run start`
4. (Optional) run the commands inside tmux to keep it running.

## Purposes

1. Run a Discord bot
2. Run a backend server
3. Authenticate osu! profiles
4. Send the discord user and authenthicated osu profile data over spreadsheet.

## Considerations

1. JSON is used as database in this project because during creation I didn't think it would take up a lot of space
2. You may wanna add rate limiter to the bot because [google spreadsheet](https://developers.google.com/sheets/api/limits) doesn't like it if you spam them too much per minute
3. The authentication process is janky, please evaluate or refactor if you're gonna use it in a bigger scale (lookup `generateState`)
