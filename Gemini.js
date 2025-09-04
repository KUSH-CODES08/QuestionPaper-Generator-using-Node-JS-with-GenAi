let express = require('express');
let app = express();
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai')

app.use(express.json());

function buildPrompt({ topic, numofquestions, type, totalmarks }) {
    return `You are an expert exam paper setter. Create a question paper. 
    Topic: ${topic}
    Number of Questions: ${numofquestions}
    Question Type: ${type} (only generate this type, do not mix with other types)
    Total Marks: ${totalmarks}
    
    Rules:
        - ALL questions must be strictly of type: ${type}.
        - Distribute ${totalmarks} marks across the ${numofquestions} questions.
        - If type = mcq:
        * Each question must have 4 options
        * Provide the correct answer clearly
        - If type = short:
        * Each question should expect ~50 words
        - If type = long:
        * Each question should expect ~150 words
        - Return only valid JSON (no markdown, no extra commentary).

Format:
{
"topic": "string",
"totalMarks": number,
"questions": [
{
"id": "Q1",
"type": "${type}",
"marks": number,
"question": "string",
"options": ["A","B","C","D"], // only for mcq, else []
"answer": "string"
}
]
}`;
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });



app.post("/generatePaper", async(req, res) => {
    try {

        const { topic, type, numofquestions, totalmarks } = req.body

        console.log(req.body)

        if (!req.body.topic || !req.body.numofquestions || !req.body.type || !req.body.totalmarks) {
            res.send("Please Fill All the Mandatory Fields")
        } else {
            const prompt = buildPrompt({ topic, numofquestions, type, totalmarks });
            const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })

            const text = result.response.text();
            const data = JSON.parse(text);

            res.json(data);
        }
    } catch (err) {

        res.status(500).json({ error: err.message });
    }
})
app.listen(process.env.PORT, () => {
    console.log(`Server is Started at port ${process.env.PORT}`);
});
