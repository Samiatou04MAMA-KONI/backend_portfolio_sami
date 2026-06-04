const express = require('express');
const axios = require('axios');   // IMPORTANT : installez axios d'abord
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
  }

  try {
    // Appel à l'API Brevo (port 443, non bloqué)
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { email: process.env.EMAIL_USER, name: 'Mon Portfolio' },
      to: [{ email: process.env.EMAIL_USER, name: 'Admin' }],
      replyTo: { email: email, name: name },
      subject: `[Portfolio] ${subject}`,
      textContent: `Nom: ${name}\nEmail: ${email}\nSujet: ${subject}\nMessage:\n${message}`,
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log('Email envoyé via Brevo:', response.data);
    res.status(200).json({ message: 'Votre message a été envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur Brevo:', error.response?.data || error.message);
    let errorMessage = 'Erreur interne du serveur. Veuillez réessayer.';
    if (error.response?.status === 401) {
      errorMessage = 'Clé API Brevo invalide.';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Problème de connexion au service d’email. Réessayez dans quelques instants.';
    }
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});