// This code runs securely on Netlify's servers, not in the user's browser.
const { google } = require('googleapis');

// === HIER SIND IHRE KALENDER-IDs EINGETRAGEN ===
// Wichtig: Jeder dieser Kalender muss in seinen Google-Einstellungen auf "Öffentlich" gestellt sein.
const calendarIds = [
    'q1loacs0ih9e9aife87lfvpnj8@group.calendar.google.com',      // M&M
    'guertler.maria@googlemail.com',                           // Maria
    'g6nd9fodvpbnc8c51d591ahdlg@group.calendar.google.com',      // MK Solo
    'bodobanali@googlemail.com'                                // Bodo Banali
];
// ===============================================

exports.handler = async function (event, context) {
    // Ihr geheimer API-Schlüssel wird sicher aus den Netlify-Einstellungen geladen.
    const apiKey = process.env.GOOGLE_API_KEY;

    const calendar = google.calendar({ version: 'v3', auth: apiKey });

    try {
        const now = new Date();
        // Wir suchen nach Terminen in den nächsten 30 Tagen. Sie können diesen Wert anpassen.
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + 30);

        // Fragt die Termine für alle Kalender gleichzeitig ab (das ist sehr effizient).
        const promises = calendarIds.map(calId =>
            calendar.events.list({
                calendarId: calId,
                timeMin: now.toISOString(),
                timeMax: futureLimit.toISOString(),
                maxResults: 25, // Maximale Anzahl an Terminen pro Kalender
                singleEvents: true,
                orderBy: 'startTime',
            })
        );

        const results = await Promise.all(promises);
        
        // Fügt die Termine aus allen Kalendern in eine einzige Liste zusammen...
        const allEvents = results
            .flatMap(result => result.data.items)
            // ...und sortiert diese Liste chronologisch nach dem Startdatum.
            .sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));

        // Sendet die sortierte Liste an Ihre Webseite.
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
