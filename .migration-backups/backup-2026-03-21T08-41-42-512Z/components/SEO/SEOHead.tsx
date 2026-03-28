import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
  robots?: string;
  schemaMarkup?: object[];
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Rareminds - Skillpassport",
  description = "Comprehensive educational management platform with AI-powered career guidance, student tracking, recruitment pipeline, and course marketplace for K-12 schools, colleges, and universities.",
  keywords = "educational management system, AI career guidance, student management, recruitment platform, course marketplace, attendance tracking, career assessment, job matching",
  image,
  url = "https://skillpassport.rareminds.in/",
  type = "website",
  siteName = "Rareminds",
  twitterCard = "summary_large_image",
  robots = "index, follow",
  schemaMarkup = []
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}
      
      {/* Twitter / X */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
      
      {/* Schema Markup */}
      {schemaMarkup.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Helmet>
  );
};

export default SEOHead;