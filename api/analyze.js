import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { request } = req.body || {};

    if (!request) {
      return res.status(400).json({
        error: "Richiesta mancante"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY non configurata"
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: [
        {
          role: "system",
          content: `
Sei OperaAI, un assistente di back-office
per piccole aziende.

Analizza la richiesta del cliente e restituisci
SOLO JSON valido con questi campi:

category: string
priority: "Bassa" | "Normale" | "Media" | "Alta"
summary: string
missing: array di stringhe
suggested_reply: string

Non inventare dati.

La risposta suggerita deve essere professionale,
breve e pronta per essere controllata da un
operatore umano.
`
        },
        {
          role: "user",
          content: request
        }
      ]
    });

    const data = JSON.parse(response.output_text);

    return res.status(200).json(data);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Errore durante l'analisi"
    });
  }
}
