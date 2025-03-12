export default () => ({

    sheets: {
        email: process.env.SHEETS_ACCOUNT_EMAIL,
        id: process.env.SHEETS_ACCOUNT_ID,
        key: process.env.SHEETS_ACCOUNT_KEY,
    },
    discord: {
        application_id: process.env.DISCORD_APPLICATION_ID,
        client_id: process.env.DISCORD_CLIENT_ID,
        secret: process.env.DISCORD_SECRET,
        token: process.env.DISCORD_TOKEN,
    },

});
