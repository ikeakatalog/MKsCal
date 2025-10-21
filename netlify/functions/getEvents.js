// This code runs securely on Netlify's servers.
// DIES IST EINE SEHR STABILE, EINFACHE VERSION, UM DIE FUNKTIONALITÄT WIEDERHERZUSTELLEN.
const { google } = require('googleapis');

exports.handler = async function (event, context) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const calendar = google.calendar({ version: 'v3', auth: apiKey });

    // Definieren Sie hier die Kalender-IDs und die zugehörigen Namen.
    const calendarsToFetch = {
        'q1loacs0ih9e9aife87lfvpnj8@group.calendar.google.com': 'M&M',
        'guertler.maria@googlemail.com': 'Maria',
        'g6nd9fodvpbnc8c51d51ahdlg@group.calendar.google.com': 'MK Solo',
        'bodobanali@googlemail.com': 'Bodo Banali'
    };

    try {
        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + 30);

        // Erstelle eine Liste von Promises (Anfragen), eine für jeden Kalender.
        const promises = Object.keys(calendarsToFetch).map(calendarId => 
            calendar.events.list({
                calendarId: calendarId,
                timeMin: now.toISOString(),
                timeMax: futureLimit.toISOString(),
                maxResults: 25,
                singleEvents: true,
                orderBy: 'startTime',
            }).then(response => {
                // Füge jedem Termin den Namen des Kalenders direkt hinzu.
                const calendarName = calendarsToFetch[calendarId];
                return response.data.items.map(event => ({
                    ...event,
                    calendarName: calendarName
                }));
            })
        );

        // Warte, bis alle Anfragen abgeschlossen sind.
        const results = await Promise.all(promises);
        
        // Füge alle Ergebnisse zusammen und sortiere sie.
        const allEvents = results
            .flat() // Macht aus [[Event1, Event2], [Event3]] -> [Event1, Event2, Event3]
            .sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));

        return {
            statusCode: 200,
            body: JSON.stringify(allEvents),
        };
    } catch (error) {
        // Wenn hier ein Fehler auftritt, liegt es fast immer daran, dass einer der Kalender nicht öffentlich ist.
        console.error('Fehler beim Abrufen der Kalenderdaten:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ein Kalender konnte nicht abgerufen werden. Bitte prüfen Sie die Freigabe-Einstellungen.' }),
        };
    }
};
