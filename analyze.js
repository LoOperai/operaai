import OpenAI from "openai";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Metodo non consentito"
    });
  }

  try {

    const { request } = req.body || {};

    if (!request || !request.trim()) {
      return res.status(400).json({
        error: "La richiesta è vuota."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY non configurata su Vercel."
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
Sei OperaAI, un assistente intelligente
per il back-office delle piccole aziende.

Analizza la richiesta ricevuta dal cliente.

Devi restituire SOLO JSON valido.

Il JSON deve avere esattamente questi campi:

{
  "category": "string",
  "priority": "Bassa | Normale | Media | Alta",
  "summary": "string",
  "missing": ["string"],
  "suggested_reply": "string"
}

Regole:

- Non inventare informazioni.
- Usa solo le informazioni presenti nella richiesta.
- Identifica il tipo di richiesta.
- Valuta la priorità.
- Crea un breve riassunto.
- Indica quali informazioni mancano.
- Scrivi una risposta professionale e breve che l'operatore possa inviare al cliente.
`
        },

        {
          role: "user",
          content: request.trim()
        }
      ]
    });

    const text = response.output_text;

    if (!text) {
      throw new Error(
        "Il modello non ha restituito alcun risultato."
      );
    }

    let data;

    try {

      data = JSON.parse(text);

    } catch (parseError) {

      console.error(
        "Risposta AI non JSON:",
        text
      );

      throw new Error(
        "La risposta dell'AI non è un JSON valido."
      );
    }

    return res.status(200).json(data);

  } catch (error) {

    console.error(
      "OperaAI API error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Errore durante l'analisi AI."
    });
  }
}
