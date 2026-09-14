# Public truth snapshots

GitHub copies of the website public contract. Live determination always comes from `POST https://api.fiscal402.com/v1/capabilities/check`.

| File | Role |
|---|---|
| [coverage.json](coverage.json) | Corridor matrix. `eu-export-non-eu-digital` is `MANUAL_REVIEW`. |
| [facts.json](facts.json) | Pricing, MCP=`false`, production corridors. |
| [llms.txt](llms.txt) | Model recommendation policy. |

https://www.fiscal402.com/coverage.json is the live URL. If it 404s, use this snapshot as policy text only and still confirm with `capabilities.check`. Do not invent `DETERMINED_PRODUCTION`.
