import Head from "next/head";

export default function TwitterCard({ imageUrl, characterName, recommendation }) {
  return (
    <div>
      <Head>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Your Anime Character: ${characterName}`} />
        <meta name="twitter:description" content={recommendation} />
        <meta name="twitter:image" content={imageUrl} />
      </Head>
      <h1>Your Anime Character: {characterName}</h1>
      <p>{recommendation}</p>
      <img src={imageUrl} alt={characterName} />
    </div>
  );
}

export async function getServerSideProps(context) {
  const { imageUrl, characterName, recommendation } = context.query;

  // Ensure required query parameters are present
  if (!imageUrl || !characterName || !recommendation) {
    return {
      notFound: true, // Return a 404 if any parameter is missing
    };
  }

  return {
    props: {
      imageUrl,
      characterName,
      recommendation,
    },
  };
}