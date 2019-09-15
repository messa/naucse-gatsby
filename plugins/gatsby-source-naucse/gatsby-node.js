const axios = require(`axios`)
const crypto = require(`crypto`)
const cheerio = require('cheerio')
const { Sema } = require('async-sema');

const naucseUrl = 'https://naucse.python.cz/v0/naucse.json'

const retrieveSem = new Sema(5)

const axiosInstance = axios.create({
  timeout: 60 * 1000,
  maxContentLength: 50 * 1000 * 1000,
  httpAgent: new require('http').Agent({ keepAlive: true }),
  httpsAgent: new require('https').Agent({ keepAlive: true }),
})

async function retrieve(url) {
  let tryCount = 0
  for (;;) {
    tryCount += 1
    try {
      await retrieveSem.acquire()
      try {
        console.debug(`Retrieve: ${url}`)
        const res = await axiosInstance.get(url)
        console.debug(`Retrieved ${res.status}: ${url}`)
        return res
      } finally {
        retrieveSem.release()
      }
    } catch (err) {
      if (tryCount < 3) {
        console.info(`Failed to retrieve ${url}: ${err}; will try again`)
        continue
      } else {
        console.error(`Failed to retrieve ${url}: ${err}`)
        throw err
      }
    }
  }
}

function digest(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

function assert(condition, message) {
  if (!condition) {
    console.error(message)
    throw new Error(message || "Assertion failed");
  }
}

// TODO: add retry for axios.get

// TODO: add caching: https://www.gatsbyjs.org/docs/build-caching/

exports.sourceNodes = async function ({ actions }) {
  const { createNode } = actions
  const entities = new Map() // by id
  const alreadyProcessing = new Set() // by id
  const { data: { root } } = await retrieve(naucseUrl)
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
    const { data: { data } } = await retrieve(yearUrl)
    await Promise.all(Object.entries(data).map(async ([ courseId, courseData ], i) => {
      if (alreadyProcessing.has(`course:${courseId}`)) {
        return
      }
      alreadyProcessing.add(`course:${courseId}`)
      console.debug('course:', courseId, JSON.stringify(courseData))
      const courseUrl = courseData['$ref']
      const { data: { course } } = await retrieve(courseUrl)
      entities.set(`course:${courseId}`, {
        internal: {
          type: 'Course',
        },
        courseId,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        longDescription: course.long_description,
        timeDescription: course.time_description,
        url: course.url,
        vars: course.vars,
        derives: course.derives,
        startDate: course.start_date,
        endDate: course.end_date,
        place: course.place,
        sourceFile: course.source_file,
        apiUrl: courseUrl,
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
           materials___NODE: [],
           course___NODE: `course:${courseId}`,
        })
        assert(!entities.get(`course:${courseId}`).sessions___NODE[i])
        entities.get(`course:${courseId}`).sessions___NODE[i] = `session:${courseId}:${session.slug}`
        await Promise.all(session.materials.map(async (material, i) => {
          //console.debug('material:', JSON.stringify(material))
          const payload = {
            id: `session-material:${courseId}:${session.slug}:${i}`,
            internal: {
              type: 'SessionMaterial',
            },
            session___NODE: `session:${courseId}:${session.slug}`,
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
              const { data: html } = await retrieve(url)
              const $ = cheerio.load(html)
              payload.html = $('.lesson-content').html()
            } catch (err) {
              console.error(`Failed to retrieve or parse ${url}: ${err}`)
            }
          }
          entities.set(payload.id, payload)
          entities.get(`session:${courseId}:${session.slug}`).materials___NODE[i] = payload.id
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
