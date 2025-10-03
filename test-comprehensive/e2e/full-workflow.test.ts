/**
 * End-to-end tests for complete workflows
 */

import { describe, it, expect, beforeAll, afterAll } from 'chai'
import { withTestDatabase, performanceHelper } from '../setup/test-helpers.js'
import { getEnabledDatabases } from '../setup/test-config.js'

describe('Full Workflow E2E Tests', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (enabledDatabases.length === 0) {
    console.warn('No databases enabled for testing')
    return
  }

  describe('Complete CRUD Workflow', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle complete user management workflow', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const profileRepo = db.getRepository('profiles')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          
          // 1. Create a new user
          const user = await userRepo.create({
            id: 'workflow-user',
            email: 'workflow@example.com',
            firstName: 'Workflow',
            lastName: 'User',
            active: true
          })
          
          expect(user).to.exist
          expect(user.id).to.equal('workflow-user')
          
          // 2. Create user profile
          const profile = await profileRepo.create({
            id: 'workflow-profile',
            userId: user.id,
            bio: 'Workflow test user',
            avatar: 'https://example.com/avatar.jpg',
            website: 'https://workflow.example.com'
          })
          
          expect(profile).to.exist
          expect(profile.userId).to.equal(user.id)
          
          // 3. Create posts for the user
          const posts = []
          for (let i = 0; i < 3; i++) {
            const post = await postRepo.create({
              id: `workflow-post-${i}`,
              userId: user.id,
              title: `Workflow Post ${i}`,
              content: `This is workflow post ${i} content.`,
              published: i % 2 === 0
            })
            posts.push(post)
          }
          
          expect(posts.length).to.equal(3)
          
          // 4. Create comments on posts
          const comments = []
          for (let i = 0; i < 6; i++) {
            const comment = await commentRepo.create({
              id: `workflow-comment-${i}`,
              postId: posts[i % 3].id,
              userId: user.id,
              content: `This is comment ${i} on post ${i % 3}.`
            })
            comments.push(comment)
          }
          
          expect(comments.length).to.equal(6)
          
          // 5. Read user with all relationships
          const userWithRelations = await userRepo.findWithRelations(user.id, ['profiles', 'posts'])
          
          expect(userWithRelations).to.exist
          expect(userWithRelations!.profiles).to.exist
          expect(userWithRelations!.posts).to.exist
          expect(userWithRelations!.posts.length).to.equal(3)
          
          // 6. Update user information
          userWithRelations!.firstName = 'Updated'
          userWithRelations!.lastName = 'Name'
          
          const updatedUser = await userRepo.update(userWithRelations!)
          
          expect(updatedUser.firstName).to.equal('Updated')
          expect(updatedUser.lastName).to.equal('Name')
          
          // 7. Update profile
          const updatedProfile = await profileRepo.findById(profile.id)
          updatedProfile!.bio = 'Updated bio'
          
          const newProfile = await profileRepo.update(updatedProfile!)
          
          expect(newProfile.bio).to.equal('Updated bio')
          
          // 8. Update posts
          for (const post of posts) {
            const postToUpdate = await postRepo.findById(post.id)
            postToUpdate!.title = `Updated ${postToUpdate!.title}`
            
            await postRepo.update(postToUpdate!)
          }
          
          // 9. Verify updates
          const verifyUser = await userRepo.findById(user.id)
          expect(verifyUser!.firstName).to.equal('Updated')
          
          const verifyProfile = await profileRepo.findById(profile.id)
          expect(verifyProfile!.bio).to.equal('Updated bio')
          
          // 10. Clean up - delete in reverse order
          for (const comment of comments) {
            await commentRepo.delete(comment.id)
          }
          
          for (const post of posts) {
            await postRepo.delete(post.id)
          }
          
          await profileRepo.delete(profile.id)
          await userRepo.delete(user.id)
          
          // 11. Verify cleanup
          const deletedUser = await userRepo.findById(user.id)
          expect(deletedUser).to.be.null
        })

        it('should handle complete blog workflow', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          const tagRepo = db.getRepository('tags')
          
          // 1. Create blog authors
          const authors = []
          for (let i = 0; i < 3; i++) {
            const author = await userRepo.create({
              id: `blog-author-${i}`,
              email: `author${i}@blog.com`,
              firstName: `Author${i}`,
              lastName: 'Blogger',
              active: true
            })
            authors.push(author)
          }
          
          // 2. Create blog tags
          const tags = []
          const tagNames = ['Technology', 'Programming', 'Database', 'Testing']
          for (let i = 0; i < tagNames.length; i++) {
            const tag = await tagRepo.create({
              id: `blog-tag-${i}`,
              name: tagNames[i],
              color: `#${i}${i}${i}${i}${i}${i}`
            })
            tags.push(tag)
          }
          
          // 3. Create blog posts
          const posts = []
          for (let i = 0; i < 10; i++) {
            const post = await postRepo.create({
              id: `blog-post-${i}`,
              userId: authors[i % 3].id,
              title: `Blog Post ${i}: ${tagNames[i % 4]} Topic`,
              content: `This is the content for blog post ${i}. It covers ${tagNames[i % 4]} topics.`,
              published: i % 3 !== 0 // 2/3 of posts are published
            })
            posts.push(post)
          }
          
          // 4. Create post-tag relationships
          const kysely = db.getKysely()
          for (let i = 0; i < posts.length; i++) {
            await kysely
              .insertInto('post_tags')
              .values({
                postId: posts[i].id,
                tagId: tags[i % tags.length].id
              })
              .execute()
          }
          
          // 5. Create comments on published posts
          const comments = []
          const publishedPosts = posts.filter(p => p.published)
          for (let i = 0; i < publishedPosts.length * 2; i++) {
            const comment = await commentRepo.create({
              id: `blog-comment-${i}`,
              postId: publishedPosts[i % publishedPosts.length].id,
              userId: authors[i % 3].id,
              content: `Great post! Comment ${i}`
            })
            comments.push(comment)
          }
          
          // 6. Read blog data with relationships
          const authorsWithPosts = await userRepo.loadRelationships(authors, ['posts'])
          
          for (const author of authorsWithPosts) {
            expect(author.posts).to.exist
            expect(author.posts).to.be.an('array')
            expect(author.posts.length).to.be.greaterThan(0)
          }
          
          // 7. Get published posts with tags and comments
          const publishedPostsWithRelations = await postRepo.loadRelationships(publishedPosts, ['tags', 'comments'])
          
          for (const post of publishedPostsWithRelations) {
            expect(post.tags).to.exist
            expect(post.comments).to.exist
            expect(post.tags.length).to.be.greaterThan(0)
            expect(post.comments.length).to.be.greaterThan(0)
          }
          
          // 8. Update post status (publish/unpublish)
          for (const post of posts) {
            if (!post.published) {
              const postToUpdate = await postRepo.findById(post.id)
              postToUpdate!.published = true
              await postRepo.update(postToUpdate!)
            }
          }
          
          // 9. Verify all posts are now published
          const allPosts = await postRepo.findAll()
          const allPublished = allPosts.filter(p => p.published)
          expect(allPublished.length).to.equal(posts.length)
          
          // 10. Clean up
          for (const comment of comments) {
            await commentRepo.delete(comment.id)
          }
          
          for (let i = 0; i < posts.length; i++) {
            await kysely
              .deleteFrom('post_tags')
              .where('postId', '=', posts[i].id)
              .execute()
            await postRepo.delete(posts[i].id)
          }
          
          for (const tag of tags) {
            await tagRepo.delete(tag.id)
          }
          
          for (const author of authors) {
            await userRepo.delete(author.id)
          }
        })

        it('should handle complete e-commerce workflow', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          
          // 1. Create customers
          const customers = []
          for (let i = 0; i < 5; i++) {
            const customer = await userRepo.create({
              id: `customer-${i}`,
              email: `customer${i}@shop.com`,
              firstName: `Customer${i}`,
              lastName: 'Shopper',
              active: true
            })
            customers.push(customer)
          }
          
          // 2. Create product posts (using posts as products)
          const products = []
          const productNames = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Keyboard']
          for (let i = 0; i < productNames.length; i++) {
            const product = await postRepo.create({
              id: `product-${i}`,
              userId: 'system', // System user for products
              title: `${productNames[i]} - Premium Quality`,
              content: `Description of ${productNames[i]}. High quality product with great features.`,
              published: true
            })
            products.push(product)
          }
          
          // 3. Create reviews (using comments as reviews)
          const reviews = []
          for (let i = 0; i < 20; i++) {
            const review = await commentRepo.create({
              id: `review-${i}`,
              postId: products[i % products.length].id,
              userId: customers[i % customers.length].id,
              content: `Great product! Rating: ${(i % 5) + 1}/5 stars.`
            })
            reviews.push(review)
          }
          
          // 4. Read product catalog with reviews
          const productsWithReviews = await postRepo.loadRelationships(products, ['comments'])
          
          for (const product of productsWithReviews) {
            expect(product.comments).to.exist
            expect(product.comments.length).to.be.greaterThan(0)
          }
          
          // 5. Get customer purchase history (reviews as purchases)
          const customersWithReviews = await userRepo.loadRelationships(customers, ['comments'])
          
          for (const customer of customersWithReviews) {
            expect(customer.comments).to.exist
            expect(customer.comments.length).to.be.greaterThan(0)
          }
          
          // 6. Update product information
          for (const product of products) {
            const productToUpdate = await postRepo.findById(product.id)
            productToUpdate!.title = `Updated ${productToUpdate!.title}`
            productToUpdate!.content = `Updated description: ${productToUpdate!.content}`
            
            await postRepo.update(productToUpdate!)
          }
          
          // 7. Update customer information
          for (const customer of customers) {
            const customerToUpdate = await userRepo.findById(customer.id)
            customerToUpdate!.firstName = `Updated${customerToUpdate!.firstName}`
            
            await userRepo.update(customerToUpdate!)
          }
          
          // 8. Verify updates
          const updatedProducts = await postRepo.findAll()
          for (const product of updatedProducts) {
            if (product.id.startsWith('product-')) {
              expect(product.title).to.include('Updated')
            }
          }
          
          const updatedCustomers = await userRepo.findAll()
          for (const customer of updatedCustomers) {
            if (customer.id.startsWith('customer-')) {
              expect(customer.firstName).to.include('Updated')
            }
          }
          
          // 9. Clean up
          for (const review of reviews) {
            await commentRepo.delete(review.id)
          }
          
          for (const product of products) {
            await postRepo.delete(product.id)
          }
          
          for (const customer of customers) {
            await userRepo.delete(customer.id)
          }
        })
      })
    }
  })

  describe('Complex Relationship Workflows', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle complex social media workflow', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          const tagRepo = db.getRepository('tags')
          
          // 1. Create social media users
          const users = []
          for (let i = 0; i < 10; i++) {
            const user = await userRepo.create({
              id: `social-user-${i}`,
              email: `user${i}@social.com`,
              firstName: `Social${i}`,
              lastName: 'User',
              active: true
            })
            users.push(user)
          }
          
          // 2. Create trending tags
          const trendingTags = []
          const tagNames = ['#viral', '#trending', '#tech', '#life', '#fun']
          for (let i = 0; i < tagNames.length; i++) {
            const tag = await tagRepo.create({
              id: `trending-tag-${i}`,
              name: tagNames[i],
              color: `#${i}${i}${i}${i}${i}${i}`
            })
            trendingTags.push(tag)
          }
          
          // 3. Create posts with tags
          const posts = []
          for (let i = 0; i < 20; i++) {
            const post = await postRepo.create({
              id: `social-post-${i}`,
              userId: users[i % users.length].id,
              title: `Social Post ${i}`,
              content: `This is social media post ${i} with trending content.`,
              published: true
            })
            posts.push(post)
          }
          
          // 4. Create post-tag relationships
          const kysely = db.getKysely()
          for (let i = 0; i < posts.length; i++) {
            await kysely
              .insertInto('post_tags')
              .values({
                postId: posts[i].id,
                tagId: trendingTags[i % trendingTags.length].id
              })
              .execute()
          }
          
          // 5. Create comments and replies
          const comments = []
          for (let i = 0; i < 50; i++) {
            const comment = await commentRepo.create({
              id: `social-comment-${i}`,
              postId: posts[i % posts.length].id,
              userId: users[i % users.length].id,
              content: `Comment ${i} on post ${i % posts.length}`
            })
            comments.push(comment)
          }
          
          // 6. Load complex relationships
          const usersWithPosts = await userRepo.loadRelationships(users, ['posts'])
          const postsWithTagsAndComments = await postRepo.loadRelationships(posts, ['tags', 'comments'])
          
          // 7. Verify relationships
          for (const user of usersWithPosts) {
            expect(user.posts).to.exist
            expect(user.posts.length).to.be.greaterThan(0)
          }
          
          for (const post of postsWithTagsAndComments) {
            expect(post.tags).to.exist
            expect(post.comments).to.exist
            expect(post.tags.length).to.be.greaterThan(0)
            expect(post.comments.length).to.be.greaterThan(0)
          }
          
          // 8. Simulate social media interactions
          for (const post of posts) {
            const postToUpdate = await postRepo.findById(post.id)
            postToUpdate!.title = `🔥 ${postToUpdate!.title}` // Add fire emoji
            await postRepo.update(postToUpdate!)
          }
          
          // 9. Update user engagement
          for (const user of users) {
            const userToUpdate = await userRepo.findById(user.id)
            userToUpdate!.firstName = `🌟${userToUpdate!.firstName}` // Add star emoji
            await userRepo.update(userToUpdate!)
          }
          
          // 10. Clean up
          for (const comment of comments) {
            await commentRepo.delete(comment.id)
          }
          
          for (let i = 0; i < posts.length; i++) {
            await kysely
              .deleteFrom('post_tags')
              .where('postId', '=', posts[i].id)
              .execute()
            await postRepo.delete(posts[i].id)
          }
          
          for (const tag of trendingTags) {
            await tagRepo.delete(tag.id)
          }
          
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })

        it('should handle complex content management workflow', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          const tagRepo = db.getRepository('tags')
          
          // 1. Create content creators and editors
          const creators = []
          const editors = []
          
          for (let i = 0; i < 3; i++) {
            const creator = await userRepo.create({
              id: `creator-${i}`,
              email: `creator${i}@cms.com`,
              firstName: `Creator${i}`,
              lastName: 'Writer',
              active: true
            })
            creators.push(creator)
          }
          
          for (let i = 0; i < 2; i++) {
            const editor = await userRepo.create({
              id: `editor-${i}`,
              email: `editor${i}@cms.com`,
              firstName: `Editor${i}`,
              lastName: 'Reviewer',
              active: true
            })
            editors.push(editor)
          }
          
          // 2. Create content categories (tags)
          const categories = []
          const categoryNames = ['Technology', 'Business', 'Lifestyle', 'Education', 'Entertainment']
          for (let i = 0; i < categoryNames.length; i++) {
            const category = await tagRepo.create({
              id: `category-${i}`,
              name: categoryNames[i],
              color: `#${i}${i}${i}${i}${i}${i}`
            })
            categories.push(category)
          }
          
          // 3. Create content articles
          const articles = []
          for (let i = 0; i < 15; i++) {
            const article = await postRepo.create({
              id: `article-${i}`,
              userId: creators[i % creators.length].id,
              title: `Article ${i}: ${categoryNames[i % categoryNames.length]} Topic`,
              content: `This is a comprehensive article about ${categoryNames[i % categoryNames.length]}. It covers various aspects and provides detailed information.`,
              published: i % 3 !== 0 // 2/3 of articles are published
            })
            articles.push(article)
          }
          
          // 4. Create article-category relationships
          const kysely = db.getKysely()
          for (let i = 0; i < articles.length; i++) {
            await kysely
              .insertInto('post_tags')
              .values({
                postId: articles[i].id,
                tagId: categories[i % categories.length].id
              })
              .execute()
          }
          
          // 5. Create editorial comments
          const editorialComments = []
          for (let i = 0; i < 30; i++) {
            const comment = await commentRepo.create({
              id: `editorial-comment-${i}`,
              postId: articles[i % articles.length].id,
              userId: editors[i % editors.length].id,
              content: `Editorial feedback ${i}: This article needs ${i % 2 === 0 ? 'more detail' : 'better structure'}.`
            })
            editorialComments.push(comment)
          }
          
          // 6. Load content management relationships
          const creatorsWithArticles = await userRepo.loadRelationships(creators, ['posts'])
          const editorsWithComments = await userRepo.loadRelationships(editors, ['comments'])
          const articlesWithCategoriesAndComments = await postRepo.loadRelationships(articles, ['tags', 'comments'])
          
          // 7. Verify content management structure
          for (const creator of creatorsWithArticles) {
            expect(creator.posts).to.exist
            expect(creator.posts.length).to.be.greaterThan(0)
          }
          
          for (const editor of editorsWithComments) {
            expect(editor.comments).to.exist
            expect(editor.comments.length).to.be.greaterThan(0)
          }
          
          for (const article of articlesWithCategoriesAndComments) {
            expect(article.tags).to.exist
            expect(article.comments).to.exist
            expect(article.tags.length).to.be.greaterThan(0)
            expect(article.comments.length).to.be.greaterThan(0)
          }
          
          // 8. Simulate content review process
          for (const article of articles) {
            if (!article.published) {
              const articleToUpdate = await postRepo.findById(article.id)
              articleToUpdate!.published = true
              articleToUpdate!.title = `✅ ${articleToUpdate!.title}` // Mark as approved
              await postRepo.update(articleToUpdate!)
            }
          }
          
          // 9. Update creator profiles
          for (const creator of creators) {
            const creatorToUpdate = await userRepo.findById(creator.id)
            creatorToUpdate!.firstName = `⭐${creatorToUpdate!.firstName}` // Mark as verified
            await userRepo.update(creatorToUpdate!)
          }
          
          // 10. Clean up
          for (const comment of editorialComments) {
            await commentRepo.delete(comment.id)
          }
          
          for (let i = 0; i < articles.length; i++) {
            await kysely
              .deleteFrom('post_tags')
              .where('postId', '=', articles[i].id)
              .execute()
            await postRepo.delete(articles[i].id)
          }
          
          for (const category of categories) {
            await tagRepo.delete(category.id)
          }
          
          for (const editor of editors) {
            await userRepo.delete(editor.id)
          }
          
          for (const creator of creators) {
            await userRepo.delete(creator.id)
          }
        })
      })
    }
  })

  describe('Performance Workflows', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle high-performance data processing workflow', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          
          // 1. Create large dataset
          const users = []
          const posts = []
          const comments = []
          
          // Create 100 users
          for (let i = 0; i < 100; i++) {
            const user = await userRepo.create({
              id: `perf-user-${i}`,
              email: `perf${i}@example.com`,
              firstName: `Perf${i}`,
              lastName: 'User',
              active: true
            })
            users.push(user)
          }
          
          // Create 500 posts
          for (let i = 0; i < 500; i++) {
            const post = await postRepo.create({
              id: `perf-post-${i}`,
              userId: users[i % users.length].id,
              title: `Performance Post ${i}`,
              content: `This is performance test post ${i}.`,
              published: true
            })
            posts.push(post)
          }
          
          // Create 1000 comments
          for (let i = 0; i < 1000; i++) {
            const comment = await commentRepo.create({
              id: `perf-comment-${i}`,
              postId: posts[i % posts.length].id,
              userId: users[i % users.length].id,
              content: `Performance comment ${i}`
            })
            comments.push(comment)
          }
          
          // 2. Test high-performance operations
          const duration = await performanceHelper.measure('high-performance-workflow', async () => {
            // Batch load all relationships
            await userRepo.loadRelationships(users, ['posts'])
            await postRepo.loadRelationships(posts, ['comments'])
            
            // Perform bulk updates
            for (const user of users) {
              user.firstName = `Updated${user.firstName}`
              await userRepo.update(user)
            }
            
            // Perform bulk reads
            for (const post of posts) {
              await postRepo.findById(post.id)
            }
          })
          
          // Should handle high-performance operations efficiently
          expect(duration).to.be.lessThan(30000) // 30 seconds max
          
          // 3. Verify data integrity
          const updatedUsers = await userRepo.findAll()
          for (const user of updatedUsers) {
            if (user.id.startsWith('perf-user-')) {
              expect(user.firstName).to.include('Updated')
            }
          }
          
          // 4. Clean up
          for (const comment of comments) {
            await commentRepo.delete(comment.id)
          }
          
          for (const post of posts) {
            await postRepo.delete(post.id)
          }
          
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })

        it('should handle concurrent workflow operations', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          
          // 1. Create initial data
          const users = []
          for (let i = 0; i < 20; i++) {
            const user = await userRepo.create({
              id: `concurrent-user-${i}`,
              email: `concurrent${i}@example.com`,
              firstName: `Concurrent${i}`,
              lastName: 'User',
              active: true
            })
            users.push(user)
          }
          
          // 2. Test concurrent operations
          const duration = await performanceHelper.measure('concurrent-workflow', async () => {
            const promises = []
            
            // Concurrent user updates
            for (const user of users) {
              promises.push(
                userRepo.update({
                  ...user,
                  firstName: `Updated${user.firstName}`
                })
              )
            }
            
            // Concurrent post creation
            for (let i = 0; i < 20; i++) {
              promises.push(
                postRepo.create({
                  id: `concurrent-post-${i}`,
                  userId: users[i].id,
                  title: `Concurrent Post ${i}`,
                  content: `Concurrent content ${i}`,
                  published: true
                })
              )
            }
            
            await Promise.all(promises)
          })
          
          // Should handle concurrent operations efficiently
          expect(duration).to.be.lessThan(10000) // 10 seconds max
          
          // 3. Verify concurrent operations
          const updatedUsers = await userRepo.findAll()
          for (const user of updatedUsers) {
            if (user.id.startsWith('concurrent-user-')) {
              expect(user.firstName).to.include('Updated')
            }
          }
          
          const posts = await postRepo.findAll()
          const concurrentPosts = posts.filter(p => p.id.startsWith('concurrent-post-'))
          expect(concurrentPosts.length).to.equal(20)
          
          // 4. Clean up
          for (const post of concurrentPosts) {
            await postRepo.delete(post.id)
          }
          
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })
      })
    }
  })
})
