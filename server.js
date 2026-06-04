const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Fonction pour créer un nouveau transporteur à chaque requête (évite les connexions périmées)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Timeout plus long (60 secondes)
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,
  });
};

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
  }

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `[Portfolio] ${subject}`,
    text: `Nom: ${name}\nEmail: ${email}\nSujet: ${subject}\nMessage:\n${message}`,
  };

  try {
    // Créer un nouveau transporteur pour chaque envoi
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${process.env.EMAIL_USER} de la part de ${email}`);
    res.status(200).json({ message: 'Votre message a été envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    // Renvoyer un message plus précis si possible
    let errorMessage = 'Erreur interne du serveur. Veuillez réessayer.';
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Problème de connexion au serveur email. Réessayez dans quelques instants.';
    }
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});