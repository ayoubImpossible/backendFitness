const { db } = require('../Firebase/firebaseAdmin');
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getProgrammeIA = async (req, res) => { 
  const { poids, taille, age } = req.body;
  if (!poids || !taille || !age) {
    return res.status(400).json({ error: "poids, taille et age sont requis" });
  }
  try {
    const snapshot = await db.collection("videos").get();
    const videos = snapshot.docs.map(doc => doc.data());

    const prompt = `
     Tu es un coach sportif intelligent. Choisis les 5 vidéos d'entraînement les plus adaptées parmi cette liste, en fonction de ce profil utilisateur :
     - Poids : ${poids}kg
     - Taille : ${taille}cm
     - Âge : ${age} ans
     Voici la liste des vidéos disponibles :
     ${JSON.stringify(videos)}
      Renvoie uniquement un tableau JSON des 5 vidéos sélectionnées (comme objets JS).
      `;
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    const completion = chatResponse.choices[0].message.content;
    res.json({ programme: JSON.parse(completion) });
  } catch (error) {
    console.error("Erreur IA:", error.message);
    res.status(500).json({ error: "Erreur lors de la génération du programme IA." });
  }
};

module.exports={getProgrammeIA}




