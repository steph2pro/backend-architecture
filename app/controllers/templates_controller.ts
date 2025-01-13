import prisma from '#services/prisma';
import type { HttpContext } from '@adonisjs/core/http'
// import Puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
export default class TemplatesController {

  public async store({ request, response }: HttpContext) {
    const { image_apercue, options } = request.only(['image_apercue', 'options'])

    const template = await prisma.template_cv.create({
      data: { image_apercue, options },
    })

    return response.json({
      message:'template enregistrer avec succes',
      data:template
    })
  }

   // Endpoint pour récupérer la liste des templates
  public async index({ response }: HttpContext) {
    const templates = await prisma.template_cv.findMany()
    return response.json(templates)
  }


   // const {
    //   nomComplet,
    //   titre,
    //   email,
    //   telephone,
    //   address,
    //   ville,
    //   profil,
    //   formations,
    //   experiences,
    //   stages,
    //   competences,
    //   langues,
    //   loisirs
    // }=request.all()

  public async getCVTemplate({ request,response, view }:HttpContext) {

    const data = {
      title: 'CV Design',
      profileImage: '/path/to/profile.jpg',
      fullname: 'Steph Kamga',
      jobTitle: 'web Designer',
      address: 'San Francisco, California',
      phone: '(315) 802-8479',
      email: 'ricktang@gmail.com',
      profileDescription: `I’m a product designer focused on ensuring great user experience
                and meeting business needs of designed products.`,
      skills: [
        { name: 'Figma', level: 90 },
        { name: 'Sketch', level: 80 },
        { name: 'Adobe Photoshop', level: 85 },
      ],
      experiences: [
        {
          company: 'Uber',
          role: 'Product Designer',
          period: 'Mar 2015 - Present',
          tasks: [
            'Designed safety-focused experiences for Riders and Drivers',
            'Physical space problem solving and its interaction with the digital',
          ],
        },
      ],
      educations: [
        { institution: 'Brown University', degree: 'Interdisciplinary studies', period: 'Sep 2010 - May 2013' },
      ],
      languages: ['English', 'Italian'],
    };
    // const html =

    // Rendu du template avec Edge
    return view.render('template2', data);

    // Retourner le HTML comme réponse
    // return response.send(
    //   html);
  }

}
