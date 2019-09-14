const axios = require(`axios`)
const crypto = require(`crypto`)
const cheerio = require('cheerio')

const naucseUrl = 'https://naucse.python.cz/v0/naucse.json'

function digest(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

function assert(condition, message) {
  if (!condition) {
    console.error(message)
    throw new Error(message || "Assertion failed");
  }
}

exports.sourceNodes = async function ({ actions }) {
  const { createNode } = actions
  const entities = new Map() // by id
  const alreadyProcessing = new Set() // by id
  const { data: { root } } = await axios.get(naucseUrl)
  await Promise.all(Object.entries(root.run_years).map(async ([ year, yearData ]) => {
    console.debug('run_years:', year, JSON.stringify(yearData))
    const yearUrl = yearData['$ref']
    entities.set(`runYear:${year}`, {
      internal: {
        type: 'RunYear',
      },
      year,
      courses___NODE: [],
    })
    const { data: { data } } = await axios.get(yearUrl)
    await Promise.all(Object.entries(data).map(async ([ courseId, courseData ], i) => {
      if (alreadyProcessing.has(`course:${courseId}`)) {
        return
      }
      alreadyProcessing.add(`course:${courseId}`)
      console.debug('course:', courseId, JSON.stringify(courseData))
      const courseUrl = courseData['$ref']
      const { data: { course } } = await axios.get(courseUrl)
      entities.set(`course:${courseId}`, {
        internal: {
          type: 'Course',
        },
        courseId,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        timeDescription: course.time_description,
        url: course.url,
        vars: course.vars,
        derives: course.derives,
        startDate: course.start_date,
        endDate: course.end_date,
        place: course.place,
        sourceFile: course.source_file,
        runYear___NODE: `runYear:${year}`,
        sessions___NODE: [],
      })
      assert(!entities.get(`runYear:${year}`).courses___NODE[i])
      entities.get(`runYear:${year}`).courses___NODE[i] = `course:${courseId}`
      await Promise.all(course.sessions.map(async (session, i) => {
        assert(!entities.get(`session:${courseId}:${session.slug}`))
        entities.set(`session:${courseId}:${session.slug}`, {
          internal: {
            type: 'Session',
           },
           slug: session.slug,
           serial: session.serial,
           title: session.title,
           date: session.date,
           url: session.url,
           sourceFile: session.sourceFile,
           materials: [],
           course___NODE: `course:${courseId}`,
        })
        assert(!entities.get(`course:${courseId}`).sessions___NODE[i])
        entities.get(`course:${courseId}`).sessions___NODE[i] = `session:${courseId}:${session.slug}`
        await Promise.all(session.materials.map(async (material, i) => {
          //console.debug('material:', JSON.stringify(material))
          const payload = {
            type: material.type,
            title: material.title,
            externalUrl: material.external_url,
            lessonSlug: material.lesson_slug,
          }
          if (material.type === 'lesson' && material.url && material.url.startsWith('/')) {
            console.debug('lesson:', JSON.stringify(material))
            payload.internalUrl = material.url
            const url = `https://naucse.python.cz${material.url}`
            try {
              const { data: html } = await axios.get(url)
              const $ = cheerio.load(html)
              payload.html = $('.lesson-content').html()
            } catch (err) {
              console.error(`Failed to retrieve or parse ${url}: ${err}`)
            }
          }
          assert(!entities.get(`session:${courseId}:${session.slug}`).materials[i])
          entities.get(`session:${courseId}:${session.slug}`).materials[i] = payload
        }))
      }))
    }))
  }))
  for (const [ entityId, entity ] of entities.entries()) {
    entity.id = entityId
    if (!entity.internal.contentDigest) {
      entity.internal.contentDigest = digest(JSON.stringify(entity))
    }
    createNode(entity)
  }
}