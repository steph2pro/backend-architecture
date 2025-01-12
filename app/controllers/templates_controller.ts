import type { HttpContext } from '@adonisjs/core/http'
import Puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
export default class TemplatesController {
   // Endpoint pour récupérer la liste des templates
   public async listTemplates({ response }: HttpContext) {
    try {
      // Convertir import.meta.url en chemin absolu et décoder les caractères encodés (e.g., %20)
      const __dirname = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname));

      // Construire le chemin vers le dossier templates
      const templatesPath =
      // '../../templates'
      path.join(__dirname, '../../../templates');

      // Vérifier si le dossier templates existe
      if (!fs.existsSync(templatesPath)) {
        return response.status(404).json({ error: 'Dossier templates introuvable.' });
      }

      // Lire les fichiers du dossier
      const templates = fs.readdirSync(templatesPath).map((file) => ({
        id: path.basename(file, '.html'),
        name: file,
      }));

      // Retourner les templates au client
      return response.status(200).json({ templates });
    }  catch (error) {
      console.error('Erreur lors de la récupération des templates :', error);
      return response.status(500).json({ error: 'Échec de la récupération des templates.' });
    }
  }

  // Endpoint pour générer un PDF
  public async generatePDF({ request, response }: HttpContext) {
    const { id, data } = request.only(['id', 'data']); // id: ID du template, data: données utilisateur
    const templatesPath = path.join(__dirname, '../../../templates');
    const templatePath = path.join(templatesPath, `${id}.html`);

    try {
      // Vérifiez si le fichier template existe
      if (!fs.existsSync(templatePath)) {
        return response.status(404).json({ error: 'Template non trouvé.' });
      }

      // Chargez le contenu du template
      let html = fs.readFileSync(templatePath, 'utf8');

      // Remplacez les placeholders par les données utilisateur
      for (const key in data) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, data[key]);
      }

      // Lancez Puppeteer pour générer le PDF
      const browser = await Puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({ format: 'A4' });

      await browser.close();

      // Retournez le PDF sous forme de fichier téléchargeable
      response.header('Content-Type', 'application/pdf');
      return response.send(pdfBuffer);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF :', error);
      return response.status(500).json({ error: 'Échec de la génération du PDF.' });
    }
  }
}
