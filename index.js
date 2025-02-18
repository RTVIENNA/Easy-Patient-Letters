import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import OpenAI from "openai";

// TODO: Make sure the OPENAI_API_KEY environment variable is set before running the application.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create an Express app and HTTP server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Function to send prompts to the OpenAI API
async function sendToLLM(systemContext, question, patientLetter) {
    const prompt = `
        ${systemContext}
        Patient Letter:
        ${patientLetter}

        Question:
        ${question}
    `;
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemContext },
            { role: "user", content: prompt },
        ],
    });
    return completion?.choices[0]?.message?.content || 'No valid response';
}

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log("A client connected:", socket.id);

    socket.on('patient_letter', async (msg) => {
        console.log("Received patient letter:", msg);

        const { patientLetterText } = msg;

        if (!patientLetterText) {
            io.to(socket.id).emit('error', 'Patient letter text is required.');
            return;
        }

        // Questions to analyze the patient letter
        // Dictionary Struktur
        const queries = {
            medical_instructions: 'What are the key medical instructions provided to the patient?',
            // follow_up_actions: 'What follow-up actions are recommended, and what are the timelines?',
            warning_signs: 'Are there any warning signs or symptoms the patient should watch out for?',
            medications: 'What medications were prescribed, including dosage and frequency?',
            therapy_options: 'What therapy options are suggested for the patient?',
            lifestyle_changes: 'What lifestyle changes are recommended for the patient?',
            operation_needed: 'Is an operation needed?',
        };

        const systemContext = "You are a helpful medical assistant. Use simple language suitable for people with low health literacy. Mark text directly taken from the patient letter with '*' and inferred text with '#'.";

        for (const [event, question] of Object.entries(queries)) {
            socket.emit('status_update', { status: `Processing question: ${question}` });
            const result = await sendToLLM(systemContext, question, patientLetterText);
            socket.emit(event, { answer: result });
        }
    });
});

// Start the server
httpServer.listen(PORT, () => {
    console.log(`Easy Patient Letters server is running on port ${PORT}!`);
});