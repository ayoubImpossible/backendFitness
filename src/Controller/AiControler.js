const { db } = require('../Firebase/firebaseAdmin');
const { getAllVideosByDifficulty } = require('../models/levelModel');

// SDK Vertex AI
const { VertexAI } = require('@google-cloud/aiplatform');

// Initialisation du client Vertex AI
const vertexAI = new VertexAI({ projectId: 'ton-project-id', location: 'us-central1' });

const textModel = vertexAI.getGenerativeModel({
  model: 'gemini-pro',
  generationConfig: { temperature: 0.7 },
});

const getUserByUID = async (uid) => {
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return null;
    return userDoc.data();
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    return null;
  }
};

const getProgrammeIA = async (req, res) => {
  const { uid } = req.params;

  try {
    const user = await getUserByUID(uid);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const { poids, taille, age, level } = user;

    if (!poids || !taille || !age || !level) {
      return res.status(400).json({ error: "Données utilisateur incomplètes." });
    }

    const rawVideos = await getAllVideosByDifficulty(level);

    if (!Array.isArray(rawVideos) || rawVideos.length === 0) {
      return res.status(404).json({ error: "Aucune vidéo trouvée pour ce niveau." });
    }

    const videos = rawVideos.map(v => ({
      name: v.name,
      description: v.description,
      difficulty: v.difficulty,
      duration: v.duration,
      equipment: v.equipment,
      imageUrl: v.imageUrl,
      videoUrl: v.videoUrl,
      category: v.category,
      repetition: v.repetition,
      serieNumber: v.serieNumber
    }));

    const prompt = `
Tu es un coach sportif intelligent. Voici les infos utilisateur :
- Poids : ${poids}kg
- Taille : ${taille}cm
- Âge : ${age} ans
- Niveau : ${level}

Voici une liste de vidéos d'entraînement adaptées :
${JSON.stringify(videos)}

Sélectionne les 10 meilleures vidéos pour cette personne.
Renvoie uniquement un tableau JSON des vidéos sélectionnées.
    `;

    const result = await textModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const output = result.response.candidates[0].content.parts[0].text;

    let programme;
    try {
      programme = JSON.parse(output);
    } catch (e) {
      console.error("Erreur parsing Vertex IA :", e);
      return res.status(500).json({ error: "Réponse IA invalide." });
    }

    res.json({ programme });

  } catch (error) {
    console.error("Erreur Vertex AI :", error);
    res.status(500).json({ error: "Erreur IA." });
  }
};

module.exports = { getProgrammeIA };
