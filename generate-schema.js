import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recréer __dirname dans un module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Définir les chemins des fichiers et répertoires
const modelsDir = path.join(__dirname, 'prisma', 'models'); // Dossier contenant les fichiers de modèles
const schemaFile = path.join(__dirname, 'prisma', 'schema.prisma'); // Fichier final schema.prisma

// En-tête pour le fichier schema.prisma
const schemaHeader = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

// Vérifier si le dossier des modèles existe
if (!fs.existsSync(modelsDir)) {
  console.error(`Le dossier des modèles n'existe pas : ${modelsDir}`);
  process.exit(1); // Arrêter le script si le dossier est introuvable
}

// Lire tous les fichiers .prisma dans le dossier des modèles
const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.prisma'));

// Vérifier si des fichiers modèles sont trouvés
if (modelFiles.length === 0) {
  console.error(`Aucun fichier modèle trouvé dans le dossier : ${modelsDir}`);
  process.exit(1);
}

// Lire le contenu de chaque fichier modèle et les combiner
const modelsContent = modelFiles.map(file => {
  const filePath = path.join(modelsDir, file);
  return fs.readFileSync(filePath, 'utf-8');
}).join('\n\n');

// Combiner l'en-tête et le contenu des modèles
const finalSchema = schemaHeader.trim() + '\n\n' + modelsContent;

// Écrire le contenu dans le fichier schema.prisma
try {
  fs.writeFileSync(schemaFile, finalSchema);
  console.log(`Le fichier schema.prisma a été généré avec succès : ${schemaFile}`);
} catch (err) {
  console.error(`Erreur lors de la génération du fichier schema.prisma :`, err);
  process.exit(1);
}
