export const renderSuccessHtml = (username: string) => `
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
        <p>Logged in as <span class="username">${username}</span>.</p>
        <p class="instruction">You can now close this window and return to Discord.</p>
    </div>
</body>
</html>`;

export const renderTextHtml = (title: string = "Page", text: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">

    <style>
        body {
            /* Black Background */
            background-color: #000000;
            /* White Text */
            color: #ffffff;
            
            /* Centering Setup */
            height: 100vh;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .roboto-condensed {
            font-family: "Roboto Condensed", sans-serif;
            font-optical-sizing: auto;
            font-style: normal;
        }
    </style>
</head>
<body>
    <p class="roboto-condensed" style="font-size: 24px; font-weight: 500;">${text}</p>
</body>
</html>`;

export const renderErrorHtml = (message: string) => `
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
        <p>${message}</p>
        <a href="javascript:window.close()" class="btn">Close Window</a>
    </div>
</body>
</html>`;
