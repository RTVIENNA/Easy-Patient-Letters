// $(document).ready(() => {
   //  console.log("Dokument bereit");
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Dokument bereit");

    // Funktion zur farblichen Formatierung der Antworten
    function formatResponse(response) {
        return response
            .replace(/\*(.*?)\*/g, '<span style="color: green;">$1</span>')
            //.replace(/#(.*?)#/g, '<span style="color: orange;">$1</span>');
            .replace(/#([^#]*)/g, '<span style="color: orange;">$1</span>');
    }

    // Funktion zum Aktualisieren der Resultate
    function updateResultSpan(eventName, data) {
        const selector = `.result_${eventName}`;
        $(selector).html(formatResponse(data.answer || 'Keine Informationen verfügbar'));
    }

    // WebSocket-Verbindung initialisieren
    const socket = io();

    // Anfang des Einschubs

    const events = Object.keys(queries);

    events.forEach((eventName) => {
        socket.on(eventName, (data) => updateResultSpan(eventName, data));
    });


    // Ende des Einschubs

    // Formular-Submission behandeln
    $("#patient_letter_form").submit((e) => {
        e.preventDefault(); // Standard-Verhalten verhindern

        // Fehlermeldung und Ergebnisse zurücksetzen
        $('.errormsg').hide();
        $('#result').text('');

        // Eingabewert holen
        const patientLetterText = $("#patient_letter_text").val().trim();

        // Überprüfen, ob das Eingabefeld leer ist
        if (!patientLetterText) {
            $('.errormsg').text('Bitte geben Sie einen Patientenbrief ein.').show();
            return;
        }

        // Patientenbrief an den Server senden
        socket.emit('patient_letter', { patientLetterText });
    });

    document.getElementById('restart_button').addEventListener('click', () => {
        location.reload();
    });

    // Status-Updates vom Server anzeigen
    socket.on('status_update', (data) => {
        document.getElementById('result').textContent = data.status;
    });

    // Fehlernachrichten vom Server anzeigen
    socket.on('error', (errorMessage) => {
        const errorElement = document.querySelector('.errormsg');
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block'; // Element sichtbar machen
        }
    });
});