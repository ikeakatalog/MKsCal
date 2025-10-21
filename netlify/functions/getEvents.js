// This code runs securely on Netlify's servers, not in the user's browser.
const { google } = require('googleapis');

// NEU: Eine "Übersetzungstabelle", die Kalender-IDs zu lesbaren Namen zuordnet.
const calendarNames = {
    'q1loacs0ih9e9aife87lfvpnj8@group.calendar.google.com': 'M&M',
    'guertler.maria@googlemail.com': 'Maria',
    'g6nd9fodvpbnc8c51d591ahdlg@group.calendar.google.com': 'MK Solo',
    'bodobanali@googlemail.com': 'Bodo Banali'
};

// Die Liste der Kalender-IDs, die wir abfragen wollen.
const calendarIds = Object.keys(calendarNames);

exports.handler = async function (event, context) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const calendar = google.calendar({ version: 'v3', auth: apiKey });

    try {
        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + 30); // Termine der nächsten 30 Tage

        const promises = calendarIds.map(calId =>
            calendar.events.list({
                calendarId: calId,
                timeMin: now.toISOString(),
                timeMax: futureLimit.toISOString(),
                maxResults: 25,
                singleEvents: true,
                orderBy: 'startTime',
            })
        );

        const results = await Promise.all(promises);
        
        // GEÄNDERTE LOGIK: Wir fügen jetzt den Kalendernamen zu jedem Termin hinzu.
        const allEvents = results.flatMap((result, index) => {
            const calendarId = calendarIds[index];
            const name = calendarNames[calendarId] || 'Unbekannt'; // Finde den Namen in unserer Tabelle
            const events = result.data.items || [];
            
            // Füge jedem Termin das neue Feld "calendarName" hinzu
            return events.map(event => ({ ...event, calendarName: name }));
        }).sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));

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
