/**
 * End-to-end tests for real-world scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'chai'
import { withTestDatabase, performanceHelper } from '../setup/test-helpers.js'
import { getEnabledDatabases } from '../setup/test-config.js'

describe('Real-World Scenarios E2E Tests', () => {
  const enabledDatabases = getEnabledDatabases()
  
  if (enabledDatabases.length === 0) {
    console.warn('No databases enabled for testing')
    return
  }

  describe('E-Commerce Platform Scenario', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle complete e-commerce customer journey', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          const tagRepo = db.getRepository('tags')
          
          // 1. Customer Registration
          const customer = await userRepo.create({
            id: 'ecom-customer-1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            active: true
          })
          
          // 2. Product Catalog (using posts as products)
          const products = []
          const productData = [
            { name: 'Wireless Headphones', price: 99.99, category: 'Electronics' },
            { name: 'Smart Watch', price: 199.99, category: 'Electronics' },
            { name: 'Coffee Maker', price: 149.99, category: 'Appliances' },
            { name: 'Running Shoes', price: 129.99, category: 'Sports' },
            { name: 'Laptop Stand', price: 49.99, category: 'Office' }
          ]
          
          for (let i = 0; i < productData.length; i++) {
            const product = await postRepo.create({
              id: `product-${i}`,
              userId: 'system',
              title: productData[i].name,
              content: `High-quality ${productData[i].name} for ${productData[i].category} category. Price: $${productData[i].price}`,
              published: true
            })
            products.push(product)
          }
          
          // 3. Product Categories (using tags)
          const categories = []
          const categoryNames = ['Electronics', 'Appliances', 'Sports', 'Office']
          for (let i = 0; i < categoryNames.length; i++) {
            const category = await tagRepo.create({
              id: `category-${i}`,
              name: categoryNames[i],
              color: `#${i}${i}${i}${i}${i}${i}`
            })
            categories.push(category)
          }
          
          // 4. Product-Category Relationships
          const kysely = db.getKysely()
          for (let i = 0; i < products.length; i++) {
            const categoryIndex = categoryNames.indexOf(productData[i].category)
            if (categoryIndex !== -1) {
              await kysely
                .insertInto('post_tags')
                .values({
                  postId: products[i].id,
                  tagId: categories[categoryIndex].id
                })
                .execute()
            }
          }
          
          // 5. Customer Reviews (using comments as reviews)
          const reviews = []
          const reviewData = [
            { productId: 0, rating: 5, text: 'Excellent sound quality!' },
            { productId: 0, rating: 4, text: 'Good value for money' },
            { productId: 1, rating: 5, text: 'Love the fitness tracking features' },
            { productId: 2, rating: 3, text: 'Works well but could be quieter' },
            { productId: 3, rating: 5, text: 'Very comfortable for running' }
          ]
          
          for (let i = 0; i < reviewData.length; i++) {
            const review = await commentRepo.create({
              id: `review-${i}`,
              postId: products[reviewData[i].productId].id,
              userId: customer.id,
              content: `${reviewData[i].rating}/5 stars - ${reviewData[i].text}`
            })
            reviews.push(review)
          }
          
          // 6. Browse Products by Category
          const electronicsProducts = await kysely
            .selectFrom('posts')
            .innerJoin('post_tags', 'post_tags.postId', 'posts.id')
            .innerJoin('tags', 'tags.id', 'post_tags.tagId')
            .selectAll('posts')
            .where('tags.name', '=', 'Electronics')
            .execute()
          
          expect(electronicsProducts.length).to.be.greaterThan(0)
          
          // 7. View Product Details with Reviews
          const productWithReviews = await postRepo.findWithRelations(products[0].id, ['comments'])
          expect(productWithReviews!.comments).to.exist
          expect(productWithReviews!.comments.length).to.be.greaterThan(0)
          
          // 8. Customer Profile Management
          const customerProfile = await userRepo.findById(customer.id)
          customerProfile!.firstName = 'Johnny'
          customerProfile!.lastName = 'Smith'
          
          const updatedCustomer = await userRepo.update(customerProfile!)
          expect(updatedCustomer.firstName).to.equal('Johnny')
          expect(updatedCustomer.lastName).to.equal('Smith')
          
          // 9. Order History (simulated with reviews)
          const customerReviews = await commentRepo.findAll()
          const customerOrderHistory = customerReviews.filter(review => review.userId === customer.id)
          expect(customerOrderHistory.length).to.equal(reviewData.length)
          
          // 10. Product Recommendations (based on categories)
          const customerCategories = new Set()
          for (const review of customerOrderHistory) {
            const product = products.find(p => p.id === review.postId)
            if (product) {
              const productIndex = products.indexOf(product)
              customerCategories.add(productData[productIndex].category)
            }
          }
          
          expect(customerCategories.size).to.be.greaterThan(0)
          
          // 11. Clean up
          for (const review of reviews) {
            await commentRepo.delete(review.id)
          }
          
          for (let i = 0; i < products.length; i++) {
            await kysely
              .deleteFrom('post_tags')
              .where('postId', '=', products[i].id)
              .execute()
            await postRepo.delete(products[i].id)
          }
          
          for (const category of categories) {
            await tagRepo.delete(category.id)
          }
          
          await userRepo.delete(customer.id)
        })

        it('should handle inventory management scenario', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          
          // 1. Create inventory items (using posts as inventory)
          const inventoryItems = []
          const inventoryData = [
            { name: 'Product A', stock: 100, price: 29.99 },
            { name: 'Product B', stock: 50, price: 49.99 },
            { name: 'Product C', stock: 200, price: 19.99 },
            { name: 'Product D', stock: 75, price: 39.99 },
            { name: 'Product E', stock: 25, price: 99.99 }
          ]
          
          for (let i = 0; i < inventoryData.length; i++) {
            const item = await postRepo.create({
              id: `inventory-${i}`,
              userId: 'system',
              title: inventoryData[i].name,
              content: `Stock: ${inventoryData[i].stock} units, Price: $${inventoryData[i].price}`,
              published: true
            })
            inventoryItems.push(item)
          }
          
          // 2. Simulate sales transactions (using comments as transactions)
          const transactions = []
          const transactionData = [
            { itemId: 0, quantity: 5, customerId: 'customer-1' },
            { itemId: 1, quantity: 2, customerId: 'customer-2' },
            { itemId: 0, quantity: 10, customerId: 'customer-3' },
            { itemId: 2, quantity: 3, customerId: 'customer-1' },
            { itemId: 3, quantity: 1, customerId: 'customer-4' }
          ]
          
          for (let i = 0; i < transactionData.length; i++) {
            const transaction = await commentRepo.create({
              id: `transaction-${i}`,
              postId: inventoryItems[transactionData[i].itemId].id,
              userId: transactionData[i].customerId,
              content: `Sold ${transactionData[i].quantity} units`
            })
            transactions.push(transaction)
          }
          
          // 3. Calculate current stock levels
          const currentStock = new Map()
          for (let i = 0; i < inventoryData.length; i++) {
            currentStock.set(i, inventoryData[i].stock)
          }
          
          // Simulate stock deductions from transactions
          for (const transaction of transactions) {
            const itemIndex = inventoryItems.findIndex(item => item.id === transaction.postId)
            if (itemIndex !== -1) {
              const quantity = parseInt(transaction.content.match(/\d+/)?.[0] || '0')
              currentStock.set(itemIndex, currentStock.get(itemIndex) - quantity)
            }
          }
          
          // 4. Update inventory levels
          for (let i = 0; i < inventoryItems.length; i++) {
            const item = await postRepo.findById(inventoryItems[i].id)
            const newStock = currentStock.get(i)
            item!.content = `Stock: ${newStock} units, Price: $${inventoryData[i].price}`
            await postRepo.update(item!)
          }
          
          // 5. Check low stock alerts
          const lowStockItems = []
          for (let i = 0; i < inventoryItems.length; i++) {
            if (currentStock.get(i) < 30) {
              lowStockItems.push(inventoryItems[i])
            }
          }
          
          expect(lowStockItems.length).to.be.greaterThan(0)
          
          // 6. Generate sales report
          const salesReport = new Map()
          for (const transaction of transactions) {
            const itemIndex = inventoryItems.findIndex(item => item.id === transaction.postId)
            if (itemIndex !== -1) {
              const quantity = parseInt(transaction.content.match(/\d+/)?.[0] || '0')
              const revenue = quantity * inventoryData[itemIndex].price
              salesReport.set(itemIndex, (salesReport.get(itemIndex) || 0) + revenue)
            }
          }
          
          expect(salesReport.size).to.be.greaterThan(0)
          
          // 7. Restock low inventory items
          for (const item of lowStockItems) {
            const itemIndex = inventoryItems.findIndex(inventoryItem => inventoryItem.id === item.id)
            if (itemIndex !== -1) {
              const restockedItem = await postRepo.findById(item.id)
              const currentStock = parseInt(restockedItem!.content.match(/\d+/)?.[0] || '0')
              const newStock = currentStock + 100 // Restock with 100 units
              restockedItem!.content = `Stock: ${newStock} units, Price: $${inventoryData[itemIndex].price}`
              await postRepo.update(restockedItem!)
            }
          }
          
          // 8. Verify restocking
          for (const item of lowStockItems) {
            const restockedItem = await postRepo.findById(item.id)
            const stock = parseInt(restockedItem!.content.match(/\d+/)?.[0] || '0')
            expect(stock).to.be.greaterThanOrEqual(30)
          }
          
          // 9. Clean up
          for (const transaction of transactions) {
            await commentRepo.delete(transaction.id)
          }
          
          for (const item of inventoryItems) {
            await postRepo.delete(item.id)
          }
        })
      })
    }
  })

  describe('Social Media Platform Scenario', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle social media user interactions', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          const tagRepo = db.getRepository('tags')
          
          // 1. User Registration and Profile Setup
          const users = []
          const userData = [
            { name: 'Alice Johnson', email: 'alice@social.com', bio: 'Tech enthusiast' },
            { name: 'Bob Smith', email: 'bob@social.com', bio: 'Photographer' },
            { name: 'Carol Davis', email: 'carol@social.com', bio: 'Food blogger' },
            { name: 'David Wilson', email: 'david@social.com', bio: 'Traveler' },
            { name: 'Eva Brown', email: 'eva@social.com', bio: 'Artist' }
          ]
          
          for (let i = 0; i < userData.length; i++) {
            const user = await userRepo.create({
              id: `social-user-${i}`,
              email: userData[i].email,
              firstName: userData[i].name.split(' ')[0],
              lastName: userData[i].name.split(' ')[1],
              active: true
            })
            users.push(user)
          }
          
          // 2. Create Trending Hashtags
          const hashtags = []
          const hashtagNames = ['#tech', '#photography', '#food', '#travel', '#art', '#lifestyle']
          for (let i = 0; i < hashtagNames.length; i++) {
            const hashtag = await tagRepo.create({
              id: `hashtag-${i}`,
              name: hashtagNames[i],
              color: `#${i}${i}${i}${i}${i}${i}`
            })
            hashtags.push(hashtag)
          }
          
          // 3. Create Posts with Hashtags
          const posts = []
          const postData = [
            { content: 'Just got the latest smartphone! #tech', hashtags: [0] },
            { content: 'Beautiful sunset photo from my vacation #photography #travel', hashtags: [1, 3] },
            { content: 'Delicious homemade pasta recipe #food #lifestyle', hashtags: [2, 5] },
            { content: 'Working on my latest painting #art', hashtags: [4] },
            { content: 'Tech conference was amazing! #tech #lifestyle', hashtags: [0, 5] }
          ]
          
          for (let i = 0; i < postData.length; i++) {
            const post = await postRepo.create({
              id: `social-post-${i}`,
              userId: users[i % users.length].id,
              title: `Post ${i}`,
              content: postData[i].content,
              published: true
            })
            posts.push(post)
          }
          
          // 4. Create Post-Hashtag Relationships
          const kysely = db.getKysely()
          for (let i = 0; i < posts.length; i++) {
            for (const hashtagIndex of postData[i].hashtags) {
              await kysely
                .insertInto('post_tags')
                .values({
                  postId: posts[i].id,
                  tagId: hashtags[hashtagIndex].id
                })
                .execute()
            }
          }
          
          // 5. Create Comments and Interactions
          const comments = []
          const commentData = [
            { postId: 0, userId: 1, content: 'Cool! Which model did you get?' },
            { postId: 0, userId: 2, content: 'I love tech reviews!' },
            { postId: 1, userId: 0, content: 'Stunning photo! 📸' },
            { postId: 1, userId: 3, content: 'Where was this taken?' },
            { postId: 2, userId: 1, content: 'Recipe please! 🍝' },
            { postId: 3, userId: 4, content: 'Amazing artwork!' },
            { postId: 4, userId: 0, content: 'Which conference was it?' }
          ]
          
          for (let i = 0; i < commentData.length; i++) {
            const comment = await commentRepo.create({
              id: `social-comment-${i}`,
              postId: posts[commentData[i].postId].id,
              userId: users[commentData[i].userId].id,
              content: commentData[i].content
            })
            comments.push(comment)
          }
          
          // 6. Load Social Media Feed
          const usersWithPosts = await userRepo.loadRelationships(users, ['posts'])
          const postsWithComments = await postRepo.loadRelationships(posts, ['comments'])
          
          // 7. Calculate User Engagement
          const userEngagement = new Map()
          for (const user of users) {
            const userPosts = posts.filter(post => post.userId === user.id)
            const userComments = comments.filter(comment => comment.userId === user.id)
            const engagement = userPosts.length * 2 + userComments.length // Posts worth 2 points, comments 1 point
            userEngagement.set(user.id, engagement)
          }
          
          expect(userEngagement.size).to.equal(users.length)
          
          // 8. Find Trending Hashtags
          const hashtagUsage = new Map()
          for (const post of posts) {
            const postIndex = posts.indexOf(post)
            for (const hashtagIndex of postData[postIndex].hashtags) {
              const hashtagId = hashtags[hashtagIndex].id
              hashtagUsage.set(hashtagId, (hashtagUsage.get(hashtagId) || 0) + 1)
            }
          }
          
          const trendingHashtags = Array.from(hashtagUsage.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
          
          expect(trendingHashtags.length).to.be.greaterThan(0)
          
          // 9. Generate User Recommendations
          const userRecommendations = new Map()
          for (const user of users) {
            const userPosts = posts.filter(post => post.userId === user.id)
            const userHashtags = new Set()
            
            for (const post of userPosts) {
              const postIndex = posts.indexOf(post)
              for (const hashtagIndex of postData[postIndex].hashtags) {
                userHashtags.add(hashtagIndex)
              }
            }
            
            // Find other users with similar interests
            const similarUsers = users.filter(otherUser => {
              if (otherUser.id === user.id) return false
              
              const otherUserPosts = posts.filter(post => post.userId === otherUser.id)
              const otherUserHashtags = new Set()
              
              for (const post of otherUserPosts) {
                const postIndex = posts.indexOf(post)
                for (const hashtagIndex of postData[postIndex].hashtags) {
                  otherUserHashtags.add(hashtagIndex)
                }
              }
              
              // Check for common hashtags
              const commonHashtags = new Set([...userHashtags].filter(x => otherUserHashtags.has(x)))
              return commonHashtags.size > 0
            })
            
            userRecommendations.set(user.id, similarUsers.slice(0, 2)) // Top 2 recommendations
          }
          
          expect(userRecommendations.size).to.equal(users.length)
          
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
          
          for (const hashtag of hashtags) {
            await tagRepo.delete(hashtag.id)
          }
          
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })
      })
    }
  })

  describe('Content Management System Scenario', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle content publishing workflow', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          const tagRepo = db.getRepository('tags')
          
          // 1. Create Content Team
          const teamMembers = []
          const teamData = [
            { role: 'Editor', name: 'Sarah Editor', email: 'sarah@cms.com' },
            { role: 'Writer', name: 'Mike Writer', email: 'mike@cms.com' },
            { role: 'Reviewer', name: 'Lisa Reviewer', email: 'lisa@cms.com' },
            { role: 'Publisher', name: 'Tom Publisher', email: 'tom@cms.com' }
          ]
          
          for (let i = 0; i < teamData.length; i++) {
            const member = await userRepo.create({
              id: `team-member-${i}`,
              email: teamData[i].email,
              firstName: teamData[i].name.split(' ')[0],
              lastName: teamData[i].name.split(' ')[1],
              active: true
            })
            teamMembers.push(member)
          }
          
          // 2. Create Content Categories
          const categories = []
          const categoryNames = ['Technology', 'Business', 'Health', 'Education', 'Entertainment']
          for (let i = 0; i < categoryNames.length; i++) {
            const category = await tagRepo.create({
              id: `category-${i}`,
              name: categoryNames[i],
              color: `#${i}${i}${i}${i}${i}${i}`
            })
            categories.push(category)
          }
          
          // 3. Create Content Articles
          const articles = []
          const articleData = [
            { title: 'AI Revolution in Healthcare', category: 'Technology', status: 'draft' },
            { title: 'Remote Work Best Practices', category: 'Business', status: 'review' },
            { title: 'Healthy Eating Habits', category: 'Health', status: 'published' },
            { title: 'Online Learning Trends', category: 'Education', status: 'draft' },
            { title: 'Streaming Service Comparison', category: 'Entertainment', status: 'published' }
          ]
          
          for (let i = 0; i < articleData.length; i++) {
            const article = await postRepo.create({
              id: `article-${i}`,
              userId: teamMembers[1].id, // Writer creates articles
              title: articleData[i].title,
              content: `This is a comprehensive article about ${articleData[i].title}. It covers various aspects and provides detailed information.`,
              published: articleData[i].status === 'published'
            })
            articles.push(article)
          }
          
          // 4. Create Article-Category Relationships
          const kysely = db.getKysely()
          for (let i = 0; i < articles.length; i++) {
            const categoryIndex = categoryNames.indexOf(articleData[i].category)
            if (categoryIndex !== -1) {
              await kysely
                .insertInto('post_tags')
                .values({
                  postId: articles[i].id,
                  tagId: categories[categoryIndex].id
                })
                .execute()
            }
          }
          
          // 5. Create Editorial Comments
          const editorialComments = []
          const commentData = [
            { articleId: 0, userId: 2, content: 'Needs more technical details' },
            { articleId: 1, userId: 0, content: 'Good structure, minor edits needed' },
            { articleId: 2, userId: 2, content: 'Ready for publication' },
            { articleId: 3, userId: 0, content: 'Add more examples' },
            { articleId: 4, userId: 2, content: 'Excellent content' }
          ]
          
          for (let i = 0; i < commentData.length; i++) {
            const comment = await commentRepo.create({
              id: `editorial-comment-${i}`,
              postId: articles[commentData[i].articleId].id,
              userId: teamMembers[commentData[i].userId].id,
              content: commentData[i].content
            })
            editorialComments.push(comment)
          }
          
          // 6. Content Workflow Management
          const workflowStatus = new Map()
          for (let i = 0; i < articles.length; i++) {
            workflowStatus.set(articles[i].id, articleData[i].status)
          }
          
          // 7. Update Article Status Based on Comments
          for (const comment of editorialComments) {
            const article = articles.find(a => a.id === comment.postId)
            if (article) {
              const articleIndex = articles.indexOf(article)
              if (comment.content.includes('Ready for publication')) {
                workflowStatus.set(article.id, 'ready')
              } else if (comment.content.includes('Needs') || comment.content.includes('Add')) {
                workflowStatus.set(article.id, 'needs-revision')
              }
            }
          }
          
          // 8. Publish Ready Articles
          const readyArticles = []
          for (const [articleId, status] of workflowStatus.entries()) {
            if (status === 'ready') {
              const article = articles.find(a => a.id === articleId)
              if (article) {
                article.published = true
                await postRepo.update(article)
                readyArticles.push(article)
              }
            }
          }
          
          expect(readyArticles.length).to.be.greaterThan(0)
          
          // 9. Generate Content Analytics
          const contentAnalytics = {
            totalArticles: articles.length,
            publishedArticles: articles.filter(a => a.published).length,
            draftArticles: articles.filter(a => !a.published).length,
            articlesByCategory: new Map(),
            teamMemberContributions: new Map()
          }
          
          // Count articles by category
          for (let i = 0; i < articles.length; i++) {
            const category = articleData[i].category
            contentAnalytics.articlesByCategory.set(category, (contentAnalytics.articlesByCategory.get(category) || 0) + 1)
          }
          
          // Count team member contributions
          for (const article of articles) {
            const contributor = teamMembers.find(member => member.id === article.userId)
            if (contributor) {
              const count = contentAnalytics.teamMemberContributions.get(contributor.id) || 0
              contentAnalytics.teamMemberContributions.set(contributor.id, count + 1)
            }
          }
          
          expect(contentAnalytics.totalArticles).to.equal(articles.length)
          expect(contentAnalytics.publishedArticles).to.be.greaterThan(0)
          
          // 10. Content Performance Tracking
          const publishedArticles = articles.filter(a => a.published)
          const articlesWithComments = await postRepo.loadRelationships(publishedArticles, ['comments'])
          
          const performanceMetrics = new Map()
          for (const article of articlesWithComments) {
            const engagement = article.comments.length
            performanceMetrics.set(article.id, engagement)
          }
          
          expect(performanceMetrics.size).to.equal(publishedArticles.length)
          
          // 11. Clean up
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
          
          for (const member of teamMembers) {
            await userRepo.delete(member.id)
          }
        })
      })
    }
  })

  describe('Analytics and Reporting Scenario', () => {
    for (const dialect of enabledDatabases) {
      describe(`${dialect.toUpperCase()}`, () => {
        it('should handle comprehensive analytics and reporting', withTestDatabase(dialect, async (testDb) => {
          const { db } = testDb
          await db.initialize()
          
          const userRepo = db.getRepository('users')
          const postRepo = db.getRepository('posts')
          const commentRepo = db.getRepository('comments')
          const tagRepo = db.getRepository('tags')
          
          // 1. Create Analytics Data
          const users = []
          const posts = []
          const comments = []
          const tags = []
          
          // Create 50 users
          for (let i = 0; i < 50; i++) {
            const user = await userRepo.create({
              id: `analytics-user-${i}`,
              email: `user${i}@analytics.com`,
              firstName: `User${i}`,
              lastName: 'Analytics',
              active: i % 10 !== 0 // 90% active users
            })
            users.push(user)
          }
          
          // Create 100 posts
          for (let i = 0; i < 100; i++) {
            const post = await postRepo.create({
              id: `analytics-post-${i}`,
              userId: users[i % users.length].id,
              title: `Analytics Post ${i}`,
              content: `This is analytics post ${i} for testing purposes.`,
              published: i % 5 !== 0 // 80% published posts
            })
            posts.push(post)
          }
          
          // Create 200 comments
          for (let i = 0; i < 200; i++) {
            const comment = await commentRepo.create({
              id: `analytics-comment-${i}`,
              postId: posts[i % posts.length].id,
              userId: users[i % users.length].id,
              content: `Analytics comment ${i}`
            })
            comments.push(comment)
          }
          
          // Create 10 tags
          for (let i = 0; i < 10; i++) {
            const tag = await tagRepo.create({
              id: `analytics-tag-${i}`,
              name: `Tag${i}`,
              color: `#${i}${i}${i}${i}${i}${i}`
            })
            tags.push(tag)
          }
          
          // 2. User Analytics
          const userAnalytics = {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.active).length,
            inactiveUsers: users.filter(u => !u.active).length,
            userEngagement: new Map()
          }
          
          // Calculate user engagement
          for (const user of users) {
            const userPosts = posts.filter(p => p.userId === user.id).length
            const userComments = comments.filter(c => c.userId === user.id).length
            const engagement = userPosts * 2 + userComments // Posts worth 2 points, comments 1 point
            userAnalytics.userEngagement.set(user.id, engagement)
          }
          
          expect(userAnalytics.totalUsers).to.equal(50)
          expect(userAnalytics.activeUsers).to.equal(45)
          expect(userAnalytics.inactiveUsers).to.equal(5)
          
          // 3. Content Analytics
          const contentAnalytics = {
            totalPosts: posts.length,
            publishedPosts: posts.filter(p => p.published).length,
            draftPosts: posts.filter(p => !p.published).length,
            totalComments: comments.length,
            averageCommentsPerPost: 0,
            topPerformingPosts: []
          }
          
          contentAnalytics.averageCommentsPerPost = contentAnalytics.totalComments / contentAnalytics.publishedPosts
          
          // Find top performing posts
          const postPerformance = new Map()
          for (const post of posts) {
            const postComments = comments.filter(c => c.postId === post.id).length
            postPerformance.set(post.id, postComments)
          }
          
          contentAnalytics.topPerformingPosts = Array.from(postPerformance.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([postId, comments]) => ({ postId, comments }))
          
          expect(contentAnalytics.totalPosts).to.equal(100)
          expect(contentAnalytics.publishedPosts).to.equal(80)
          expect(contentAnalytics.draftPosts).to.equal(20)
          expect(contentAnalytics.totalComments).to.equal(200)
          
          // 4. Engagement Analytics
          const engagementAnalytics = {
            totalEngagement: 0,
            averageEngagementPerUser: 0,
            highEngagementUsers: [],
            lowEngagementUsers: []
          }
          
          engagementAnalytics.totalEngagement = Array.from(userAnalytics.userEngagement.values())
            .reduce((sum, engagement) => sum + engagement, 0)
          
          engagementAnalytics.averageEngagementPerUser = engagementAnalytics.totalEngagement / users.length
          
          // Identify high and low engagement users
          const sortedUsers = Array.from(userAnalytics.userEngagement.entries())
            .sort((a, b) => b[1] - a[1])
          
          engagementAnalytics.highEngagementUsers = sortedUsers
            .slice(0, 10)
            .map(([userId, engagement]) => ({ userId, engagement }))
          
          engagementAnalytics.lowEngagementUsers = sortedUsers
            .slice(-10)
            .map(([userId, engagement]) => ({ userId, engagement }))
          
          expect(engagementAnalytics.totalEngagement).to.be.greaterThan(0)
          expect(engagementAnalytics.highEngagementUsers.length).to.equal(10)
          expect(engagementAnalytics.lowEngagementUsers.length).to.equal(10)
          
          // 5. Content Performance Metrics
          const performanceMetrics = {
            postsWithComments: 0,
            postsWithoutComments: 0,
            averageCommentsPerPost: 0,
            mostCommentedPost: null,
            leastCommentedPost: null
          }
          
          const publishedPosts = posts.filter(p => p.published)
          const postsWithComments = publishedPosts.filter(post => 
            comments.some(comment => comment.postId === post.id)
          )
          
          performanceMetrics.postsWithComments = postsWithComments.length
          performanceMetrics.postsWithoutComments = publishedPosts.length - postsWithComments.length
          performanceMetrics.averageCommentsPerPost = comments.length / publishedPosts.length
          
          // Find most and least commented posts
          const postCommentCounts = new Map()
          for (const post of publishedPosts) {
            const commentCount = comments.filter(c => c.postId === post.id).length
            postCommentCounts.set(post.id, commentCount)
          }
          
          const sortedPosts = Array.from(postCommentCounts.entries())
            .sort((a, b) => b[1] - a[1])
          
          if (sortedPosts.length > 0) {
            performanceMetrics.mostCommentedPost = {
              postId: sortedPosts[0][0],
              comments: sortedPosts[0][1]
            }
            performanceMetrics.leastCommentedPost = {
              postId: sortedPosts[sortedPosts.length - 1][0],
              comments: sortedPosts[sortedPosts.length - 1][1]
            }
          }
          
          expect(performanceMetrics.postsWithComments).to.be.greaterThan(0)
          expect(performanceMetrics.averageCommentsPerPost).to.be.greaterThan(0)
          
          // 6. Generate Comprehensive Report
          const comprehensiveReport = {
            summary: {
              totalUsers: userAnalytics.totalUsers,
              totalPosts: contentAnalytics.totalPosts,
              totalComments: contentAnalytics.totalComments,
              totalEngagement: engagementAnalytics.totalEngagement
            },
            userMetrics: userAnalytics,
            contentMetrics: contentAnalytics,
            engagementMetrics: engagementAnalytics,
            performanceMetrics: performanceMetrics,
            generatedAt: new Date().toISOString()
          }
          
          expect(comprehensiveReport.summary.totalUsers).to.equal(50)
          expect(comprehensiveReport.summary.totalPosts).to.equal(100)
          expect(comprehensiveReport.summary.totalComments).to.equal(200)
          expect(comprehensiveReport.generatedAt).to.exist
          
          // 7. Clean up
          for (const comment of comments) {
            await commentRepo.delete(comment.id)
          }
          
          for (const post of posts) {
            await postRepo.delete(post.id)
          }
          
          for (const tag of tags) {
            await tagRepo.delete(tag.id)
          }
          
          for (const user of users) {
            await userRepo.delete(user.id)
          }
        })
      })
    }
  })
})
