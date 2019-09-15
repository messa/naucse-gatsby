import React from "react"
import { graphql } from 'gatsby'
import { Link } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"

function IndexPage({ data }) {
  const runYears = data.allRunYear.edges.map(edge => edge.node)
  runYears.reverse()
  return (
    <div>
      <h2>Kurzy</h2>
      {runYears.map(runYear => (
        <div key={runYear.id}>
          <h3>{runYear.year}</h3>
          {runYear.courses.map(course => (
            <div>
              <Link to={'/' + course.courseId}>{course.title}</Link>
              {' – '}
              {course.subtitle}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
/*
(
  <Layout>
    <SEO title="Home" />
    <h1>Hi people</h1>
    <p>Welcome to your new Gatsby site.</p>
    <p>Now go build something great.</p>
    <div style={{ maxWidth: `300px`, marginBottom: `1.45rem` }}>
      <Image />
    </div>
    <Link to="/page-2/">Go to page 2</Link>
  </Layout>
)
*/

export default IndexPage

export const query = graphql`
  query HomePageQuery {
    allRunYear {
      edges {
        node {
          id
          year
          courses {
            id
            courseId
            title
            subtitle
            description
          }
        }
      }
    }
  }
`
