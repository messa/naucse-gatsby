import React from "react"
import { Link, graphql } from "gatsby"

function CoursePageTemplate({ data }) {
  const { course } = data
  return (
    <div>
      <h1>{course.title}</h1>
      <p>{course.place}, {course.timeDescription}</p>
      <h2>{course.subtitle}</h2>
      <div className='longDescription' dangerouslySetInnerHTML={{ __html: course.longDescription }} />
      {course.sessions.map(session => <Session key={session.id} session={session} />)}
      <pre>{JSON.stringify(course, null, 2)}</pre>
    </div>
  )
}

function Session({ session }) {
  const { serial, title, date, materials } = session
  return (
    <>
      <h3>Lekce {serial} - {title} {date && <small>({date})</small>}</h3>
      <ul>
        {materials.map((material, i) => <li key={i}><Material material={material} /></li>)}
      </ul>
    </>
  )
}

function Material({ material }) {
  const { title, internalUrl, externalUrl } = material
  if (externalUrl) return <a href={externalUrl}>{title}</a>
  if (internalUrl) return <Link to={internalUrl}>{title}</Link>
  return title
}

export default CoursePageTemplate

export const query = graphql`
  query($courseId: String!) {
    course(courseId: { eq: $courseId }) {
      courseId
      id
      title
      subtitle
      timeDescription
      place
      longDescription
      url
      apiUrl
      sessions {
        id
        serial
        title
        date
        materials {
          type
          title
          externalUrl
          internalUrl
        }
      }
    }
  }
`
