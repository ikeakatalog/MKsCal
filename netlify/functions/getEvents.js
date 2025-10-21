// This code runs securely on Netlify's servers.
const { google } = require('googleapis');

// Die Liste der Kalender-IDs, die wir abfragen wollen.
const calendarIds = [
    'q1loacs0ih9e9aife87lfvpnj8@group.calendar.google.com',      // M&M
    'guertler.maria@googlemail.com',                           // Maria
    'g6nd9fodvpbnc8c51d591ahdlg@group.calendar.google.com',      // MK Solo
    'bodobanali@googlemail.com'                                // Bodo Banali
];

exports.handler = async function (event, context) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const calendar = google.calendar({ version: 'v3', auth: apiKey });

    try {
        // SCHRITT 1: Hole die Details (inkl. Farbe) von JEDEM Kalender.
        const calendarDetailsPromises = calendarIds.map(calId =>
            calendar.calendars.get({ calendarId: calId })
        );
        const calendarDetailsResults = await Promise.all(calendarDetailsPromises);
        
        // Erstelle eine "Übersetzungstabelle" von ID zu Farbe und Name.
        const calendarInfoMap = {};
        calendarDetailsResults.forEach(result => {
            const cal = result.data;
            calendarInfoMap[cal.id] = {
                name: cal.summary,
                color: cal.backgroundColor
            };
        });

        // SCHRITT 2: Hole die Termine wie zuvor.
        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + 30);

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
        
        // SCHRITT 3: Kombiniere die Termine mit den Kalender-Infos.
        const allEvents = eventResults.flatMap((result, index) => {
            const calendarId = calendarIds[index];
            const info = calendarInfoMap[calendarId] || { name: 'Unbekannt', color: '#e5e7eb' };
            const events = result.data.items || [];
            
            // Füge jedem Termin den Namen UND die Farbe des Kalenders hinzu.
            return events.map(event => ({
                ...event,
                calendarName: info.name,
                calendarColor: info.color
            }));
        }).sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));

        return {
            statusCode: 200,
            body: JSON.stringify(allEvents),
        };
    } catch (error) {
        console.error('Error fetching calendar data:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch calendar data.' }),
        };
    }
};
