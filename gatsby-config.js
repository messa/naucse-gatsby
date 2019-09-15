module.exports = {
  siteMetadata: {
    title: `Naučse Gatsby`,
    description: `Lorem ipsum dolor sit amet.`,
    author: `@messa_cz`,
    siteUrl: 'https://naucse-gatsby-zz8bssctt.now.sh',
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    'gatsby-source-naucse',
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-sitemap`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Naučse Gatsby`,
        short_name: `naucse`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        //display: `minimal-ui`,
        display: `standalone`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    'gatsby-plugin-offline',
  ],
}
