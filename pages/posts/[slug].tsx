import { sanityClient, urlFor } from '../../sanity'
import Header from '../../components/Header'
import { Post } from '../../typings'
import Head from 'next/head'
import PortableText from 'react-portable-text'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useState } from 'react'

interface Props {
  post: Post
}

interface IFormInput {
  _id: string
  name: string
  email: string
  comment: string
}

export default function PostScreen({ post }: Props) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>()

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    await fetch('/api/createComment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => {
        console.log(data)
        setSubmitted(true)
      })
      .catch((error: any) => {
        console.log(error)
        setSubmitted(false)
      })
  }

  return (
    <main>
      <Head>
        <title>{post.title}</title>
      </Head>
      <Header />
      <img
        src={urlFor(post.mainImage).url()}
        alt={post.title}
        className="w-full h-40 object-cover"
      />

      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light text-gray-500">{post.description}</h2>

        <div className="flex items-center space-x-2">
          <img
            src={urlFor(post.author.image).url()}
            alt={post.author.name}
            className="h-10 w-10 rounded-full"
          />
          <p className="font-extralight text-sm">
            Blog post by{' '}
            <span className="text-green-600">{post.author.name}</span> -
            Published at{' '}
            {post._createdAt
              ? new Date(post._createdAt).toLocaleString()
              : new Date().toLocaleString()}
          </p>
        </div>

        <div className="mt-10">
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="text-2xl font-bold my-5" {...props} />
              ),
              h2: (props: any) => (
                <h2 className="text-xl font-bold my-5" {...props} />
              ),
              li: ({ children }: any) => (
                <li className="ml-4 list-disc">{children}</li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>

      <hr className="max-w-lg my-5 mx-auto border border-yellow-500" />

      {submitted ? (
        <div className="flex flex-col py-10 px-10 my-10 bg-yellow-500 text-white max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold">
            Thank you for submitting your comment!
          </h3>
          <p>Once it is approved, it will appear below</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col p-5 max-w-2xl mx-auto mb-10"
        >
          <h3 className="text-sm text-yellow-500">Enjoyed the article?</h3>
          <h4 className="text-3xl font-bold">Leave a comment below!</h4>
          <hr className="py-3 mt-2" />

          <input
            {...register('_id')}
            type="hidden"
            name="_id"
            value={post._id}
          />

          <label htmlFor="" className="block mb-5">
            <span className="text-green-700">Name</span>
            <input
              {...register('name', { required: true })}
              className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring"
              type="text"
              placeholder="John Doe"
            />
          </label>
          <label htmlFor="" className="block mb-5">
            <span>Email</span>
            <input
              {...register('email', { required: true })}
              type="email"
              placeholder="someone@email.com"
              className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring"
            />
          </label>
          <label htmlFor="" className="block mb-5">
            <span>Comment</span>
            <textarea
              {...register('comment', { required: true })}
              placeholder="Say something"
              rows={8}
              className="shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 outline-none focus:ring"
            />
          </label>
          <div className="flex flex-col p-5">
            {errors.name && (
              <span className="text-red-500">The Name field is required</span>
            )}
            {errors.email && (
              <span className="text-red-500">The Email field is required</span>
            )}
            {errors.comment && (
              <span className="text-red-500">
                The Comment field is required
              </span>
            )}
          </div>
          <input
            type="submit"
            className="bg-yellow-500 shadow hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer"
          />
        </form>
      )}
      <div className="flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500 shadow space-y-2">
        <h3 className="text-4xl">Comments</h3>
        <br className="pb-2" />
        {post.comments &&
          post.comments.map((comment) => (
            <div key={comment._id}>
              <p>
                <span className="text-yellow-500">{comment.name}</span>:{' '}
                {comment.comment}
              </p>
            </div>
          ))}
      </div>
    </main>
  )
}

export async function getStaticPaths() {
  const query = `*[_type == "post"]{
    _id,
    slug {
      current
    }
  }`

  const posts = await sanityClient.fetch(query)
  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

// @ts-ignore
export async function getStaticProps({ params }) {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    body,
    mainImage,
  author-> {
  name,
  image
},
'comments': *[
  _type == "comment" && post._ref == ^._id &&
  approved == true],
description,
slug
   
  }`

  const post: Post = await sanityClient.fetch(query, {
    slug: params.slug,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return { props: { post }, revalidate: 60 }
}
