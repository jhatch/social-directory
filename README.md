# Social Directory

## Setting up Google API credentials
1. visit [google developer console](https://console.developers.google.com/apis)
2. click + enable apps and service, find and enable each api: gmail, sheets, calendar
2. inside your project, go to credentials > create credentials > OAuth client ID
3. choose "web application"
4. name it and add "http://localhost" as an authorized redirect URI
5. click create
6. copy client_id and client_secret into [./credentials.json]
7. execute ```google.generateAuthUrl```, see [./generateTokens.js]
8. find the token value in the redirect url in your browser
9. execute ```google.getToken``` passing the token from #8, see [./generateTokens.js]
10. copy the token JSON into [./credentials.json]
