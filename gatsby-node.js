/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require('path')

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions
  const result = await graphql(`
    {
      allRunYear {
        edges {
          node {
            id
            year
            courses {
              id
              courseId
              sessions {
                id
                slug
                materials {
                  internalUrl
                }
              }
            }
          }
        }
      }
    }
  `)
  const CoursePageTemplate = path.resolve(`src/templates/course-page.js`)
  const MaterialTemplate = path.resolve(`src/templates/material.js`)
  const runYears = result.data.allRunYear.edges.map(edge => edge.node)
  runYears.map(runYear => {
    runYear.courses.map(course => {
      const { courseId } = course
      console.debug(`createPage /${courseId}`)
      createPage({
        path: `/${courseId}`,
        component: CoursePageTemplate,
        context: {
          courseId,
        }
      })
      course.sessions.map(session => {
        session.materials.map(material => {
          if (material.internalUrl) {
            createPage({
              path: material.internalUrl,
              component: MaterialTemplate,
              context: {
                internalUrl: material.internalUrl,
              }
            })
          }
        })
      })
    })
  })
}
