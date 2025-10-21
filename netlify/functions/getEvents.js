// This code runs securely on Netlify's servers.
// DIESE VERSION IST VEREINFACHT UND HOLT KEINE FARBEN MEHR, UM STABIL ZU LAUFEN.
const { google } = require('googleapis');

// Wir definieren hier die Namen, damit wir sie an die Webseite senden können.
// Die Webseite wird diese Namen dann verwenden, um die richtigen Farben zuzuordnen.
const calendarNames = {
    'q1loacs0ih9e9aife87lfvpnj8@group.calendar.google.com': 'M&M',
    'guertler.maria@googlemail.com': 'Maria',
    'g6nd9fodvpbnc8c51d591ahdlg@group.calendar.google.com': 'MK Solo',
    'bodobanali@googlemail.com': 'Bodo Banali'
};

const calendarIds = Object.keys(calendarNames);

exports.handler = async function (event, context) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const calendar = google.calendar({ version: 'v3', auth: apiKey });

    try {
        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + 30); // Termine der nächsten 30 Tage

        const eventPromises = calendarIds.map(calId =>
            calendar.events.list({
                calendarId: calId,
                timeMin: now.toISOString(),
                timeMax: futureLimit.toISOString(),
                maxResults: 25,
                singleEvents: true,
                orderBy: 'startTime',
            })
        );

        const eventResults = await Promise.all(eventPromises);
        
        const allEvents = eventResults.flatMap((result, index) => {
            const calendarId = calendarIds[index];
            const name = calendarNames[calendarId] || 'Unbekannt';
            const events = result.data.items || [];
            
            // Füge jedem Termin nur den Namen hinzu. Die Farbe wird auf der Webseite entschieden.
            return events.map(event => ({ ...event, calendarName: name }));
        }).sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));

        return {
            statusCode: 200,
            body: JSON.stringify(allEvents),
        };
    } catch (error) {
        console.error('Error fetching calendar events:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch calendar events.' }),
        };
    }
};
