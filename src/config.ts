const base_url = process.env.BASE_URL;

export default () => ({
    sheets: {
        email: process.env.SHEETS_ACCOUNT_EMAIL,
        id: process.env.SHEETS_ACCOUNT_ID,
        key: process.env.SHEETS_ACCOUNT_PRIVATE_KEY?.split(String.raw`\n`).join("\n"),
        key_id: process.env.SHEETS_ACCOUNT_KEY_ID,
    },
    discord: {
        application_id: process.env.DISCORD_APPLICATION_ID,
        client_id: process.env.DISCORD_CLIENT_ID,
        secret: process.env.DISCORD_SECRET,
        token: process.env.DISCORD_TOKEN,
    },
    osu: {
        client_id: process.env.OSU_CLIENT_ID as any,
        client_secret: process.env.OSU_CLIENT_SECRET,
        callback_url: `/osu-callback`,
    },
    base_url: base_url.endsWith('/') ? base_url.slice(0, -1) : base_url,
});
