const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Settings
router.get('/settings', cmsController.getSettings);
router.post('/settings', verifyAdmin, cmsController.updateSettings);

// Portfolio
router.get('/portfolio', cmsController.getPortfolio);
router.post('/portfolio', verifyAdmin, cmsController.createPortfolio);
router.delete('/portfolio/:id', verifyAdmin, cmsController.deletePortfolio);

// Gallery
router.get('/gallery', cmsController.getGallery);
router.post('/gallery', verifyAdmin, cmsController.createGallery);
router.delete('/gallery/:id', verifyAdmin, cmsController.deleteGallery);

// Blogs
router.get('/blogs', cmsController.getBlogs);
router.get('/blogs/:slug', cmsController.getBlogBySlug);
router.post('/blogs', verifyAdmin, cmsController.createBlog);
router.delete('/blogs/:id', verifyAdmin, cmsController.deleteBlog);

// FAQs
router.get('/faq', cmsController.getFAQs);
router.post('/faq', verifyAdmin, cmsController.createFAQ);
router.delete('/faq/:id', verifyAdmin, cmsController.deleteFAQ);

// Testimonials
router.get('/testimonials', cmsController.getTestimonials);
router.post('/testimonials', verifyAdmin, cmsController.createTestimonial);
router.delete('/testimonials/:id', verifyAdmin, cmsController.deleteTestimonial);

// Contact Form
router.post('/contact', cmsController.submitContactForm);

// Packages / Pricing
router.get('/packages', cmsController.getPackages);
router.post('/packages', verifyAdmin, cmsController.createPackage);
router.delete('/packages/:id', verifyAdmin, cmsController.deletePackage);

module.exports = router;
