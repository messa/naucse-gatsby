import React from "react"
import { Link, graphql } from "gatsby"

function MaterialTemplate({ data }) {
  const { sessionMaterial } = data
  const { title, html } = sessionMaterial
  return (
    <div>
      <div className='materialHtml' dangerouslySetInnerHTML={{ __html: html }} />
      <pre>{JSON.stringify({ data }, null, 2)}</pre>
    </div>
  )
}


export default MaterialTemplate

export const query = graphql`
  query($internalUrl: String!) {
    sessionMaterial(internalUrl: { eq: $internalUrl }) {
      id
      title
      html
    }
  }
`
