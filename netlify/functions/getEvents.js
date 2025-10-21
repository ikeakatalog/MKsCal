// This code runs securely on Netlify's servers, not in the user's browser.
const { google } = require('googleapis');

// Add all your public calendar IDs here
const calendarIds = [
    'g6nd9fodvpbnc8c51d591ahdlg@group.calendar.google.com',
    '69e5fcd3bf93348da062bf88d915062e78c3f9f3775296b9620a0692d5e1a25a@group.calendar.google.com'
    // Add more calendar IDs here if you have them
];

exports.handler = async function (event, context) {
    // Your secret API key is stored securely as an environment variable
    const apiKey = process.env.GOOGLE_API_KEY;

    const calendar = google.calendar({ version: 'v3', auth: apiKey });

    try {
        const now = new Date();
        // Optional: Set a limit for how far in the future to look for events
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        // Fetch events from all calendars in parallel
        const promises = calendarIds.map(calId =>
            calendar.events.list({
                calendarId: calId,
                timeMin: now.toISOString(),
                timeMax: sevenDaysFromNow.toISOString(), // Limit to the next 7 days
                maxResults: 15, // Limit number of results per calendar
                singleEvents: true,
                orderBy: 'startTime',
            })
        );

        const results = await Promise.all(promises);
        
        // Combine all events into one array and sort them by start time
        const allEvents = results
            .flatMap(result => result.data.items)
            .sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));

        return {
            statusCode: 200,
            body: JSON.stringify(allEvents),
        };
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch calendar events.' }),
        };
    }
};
