import Head from 'next/head'
import Header from '../components/Header'
import Banner from '../components/Banner'
import { sanityClient, urlFor } from '../sanity'
import { Post } from '../typings'
import Link from 'next/link'
import Card from '../components/Card'

interface Props {
  posts: [Post]
}

export default function Home({ posts }: Props) {
  return (
    <div className="max-w-7xl mx-auto">
      <Head>
        <title>Medium Blog</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <Banner />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 p-2 md:p-6">
        {posts.map((post, index) => (
          <Card post={post} key={index} />
        ))}
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  const query = `
  *[_type == "post"] {
    _id,
    title,
    body,
    mainImage,
  author-> {
  name,
  image
},
description,
slug
   
  }`

  const posts = await sanityClient.fetch(query)

  return {
    props: {
      posts,
    },
  }
}
