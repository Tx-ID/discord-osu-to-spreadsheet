// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BadRequestException, Controller, Get, InternalServerErrorException, Param, Query } from "@nestjs/common";

import { OsuService } from "src/osu/osu.service";
import { OsuProviderService } from "./osu-provider.service";
import { DatabaseService } from "src/database/database.service";

@Controller("")
export class OsuProviderController {
    constructor(
        private osu: OsuService,
        private provider: OsuProviderService,

        private database: DatabaseService,
    ) {}

    @Get("/osu-callback")
    async osu_callback(@Query() params: { code: string; state: string }) {
        const renderError = (msg: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Failed</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #2f3136; color: #dcddde; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
        .container { background-color: #36393f; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); max-width: 400px; width: 100%; }
        h1 { color: #fff; margin-bottom: 20px; font-size: 24px; }
        p { font-size: 16px; margin-bottom: 30px; line-height: 1.5; }
        .error-icon { color: #f04747; font-size: 64px; margin-bottom: 20px; }
        .btn { background-color: #5865f2; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-size: 16px; cursor: pointer; transition: background-color 0.2s; text-decoration: none; display: inline-block; }
        .btn:hover { background-color: #4752c4; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">✕</div>
        <h1>Login Failed</h1>
        <p>${msg}</p>
        <a href="javascript:window.close()" class="btn">Close Window</a>
    </div>
</body>
</html>`;

        try {
            if (!params || !params.code) throw new Error("Missing code parameter.");

            const state = params.state;
            const state_data = await this.provider.readState(state ?? "");
            if (!state_data) throw new Error("Invalid or expired state.");

            const access_response = await this.osu.getAccessToken(params.code);
            if (!access_response) throw new Error("Failed to obtain access token.");

            const expires_in_seconds = access_response.expires_in ?? 0;

            const self = await this.osu.getSelf(access_response.access_token);
            if (!self) throw new Error("Failed to fetch user profile.");

            await this.database.setOsuByDiscord(
                state_data.discordUserId,
                String(self.id),
                self.username,
                self.is_restricted,
                expires_in_seconds
            );

            return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>osu! Login</title>
    <style>
        body {
            background-color: #2f3136; /* Dark Discord-like background */
            color: #ffffff; /* White text */
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .message {
            font-size: 24px;
            font-weight: bold;
        }
        .username {
            color: #7289da; /* Discord blue */
        }
        .instruction {
            margin-top: 15px;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="message">
        <p>Logged in as <span class="username">${self.username}</span>.</p>
        <p class="instruction">You can now close this window and return to Discord.</p>
    </div>
</body>
</html>`;
        } catch (e) {
            return renderError(e instanceof Error ? e.message : "An unknown error occurred.");
        }
    }
}
