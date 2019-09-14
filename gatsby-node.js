/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it

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
    })
  })
}
