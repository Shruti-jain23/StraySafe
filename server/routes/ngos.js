import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateNGOProfile, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/ngos
// @desc    Get all verified NGOs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    let queryText = `
      SELECT 
        ngo.id, ngo."organizationName", ngo.description, ngo.website,
        ngo.address, ngo."servicesOffered", ngo."operatingHours",
        ngo.capacity, ngo.rating, ngo."totalRescues", ngo."createdAt",
        u.name as "contactName", u.email as "contactEmail", u.phone as "contactPhone"
      FROM ngo_profiles ngo
      JOIN users u ON ngo."userId" = u.id
      WHERE ngo."isVerified" = true
    `;

    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      queryText += ` AND (ngo."organizationName" ILIKE $${paramCount} OR ngo.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` ORDER BY ngo.rating DESC, ngo."totalRescues" DESC`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount += 2;
    queryText += ` LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
    queryParams.push(parseInt(limit), offset);

    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM ngo_profiles ngo
      WHERE ngo."isVerified" = true
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (ngo."organizationName" ILIKE $1 OR ngo.description ILIKE $1)`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        ngos: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get NGOs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching NGOs'
    });
  }
});

// @route   GET /api/ngos/:id
// @desc    Get single NGO profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        ngo.id, ngo."organizationName", ngo.description, ngo.website,
        ngo.address, ngo."servicesOffered", ngo."operatingHours",
        ngo.capacity, ngo.rating, ngo."totalRescues", ngo."createdAt",
        u.name as "contactName", u.email as "contactEmail", u.phone as "contactPhone"
      FROM ngo_profiles ngo
      JOIN users u ON ngo."userId" = u.id
      WHERE ngo.id = $1 AND ngo."isVerified" = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    // Get recent reports handled by this NGO
    const reportsResult = await query(`
      SELECT 
        r.id, r.title, r.status, r.urgency, r."createdAt", r."updatedAt"
      FROM reports r
      WHERE r."assignedNGOId" = $1
      ORDER BY r."updatedAt" DESC
      LIMIT 10
    `, [id]);

    const ngo = result.rows[0];
    ngo.recentReports = reportsResult.rows;

    res.json({
      success: true,
      data: { ngo }
    });
  } catch (error) {
    console.error('Get NGO error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching NGO'
    });
  }
});

// @route   POST /api/ngos/profile
// @desc    Create or update NGO profile
// @access  Private (NGO users only)
router.post('/profile', authenticate, authorize('NGO'), validateNGOProfile, validateRequest, async (req, res) => {
  try {
    const {
      organizationName,
      description,
      website,
      address,
      servicesOffered = [],
      operatingHours,
      capacity
    } = req.body;

    // Check if profile already exists
    const existingProfile = await query(
      'SELECT id FROM ngo_profiles WHERE "userId" = $1',
      [req.user.id]
    );

    let result;

    if (existingProfile.rows.length > 0) {
      // Update existing profile
      result = await query(`
        UPDATE ngo_profiles 
        SET 
          "organizationName" = $1,
          description = $2,
          website = $3,
          address = $4,
          "servicesOffered" = $5,
          "operatingHours" = $6,
          capacity = $7,
          "updatedAt" = NOW()
        WHERE "userId" = $8
        RETURNING *
      `, [
        organizationName, description, website, address,
        servicesOffered, operatingHours, capacity, req.user.id
      ]);
    } else {
      // Create new profile
      const profileId = uuidv4();
      result = await query(`
        INSERT INTO ngo_profiles (
          id, "userId", "organizationName", description, website,
          address, "servicesOffered", "operatingHours", capacity,
          "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, [
        profileId, req.user.id, organizationName, description, website,
        address, servicesOffered, operatingHours, capacity
      ]);
    }

    res.json({
      success: true,
      message: 'NGO profile saved successfully',
      data: { profile: result.rows[0] }
    });
  } catch (error) {
    console.error('Save NGO profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving NGO profile'
    });
  }
});

// @route   GET /api/ngos/profile/me
// @desc    Get current user's NGO profile
// @access  Private (NGO users only)
router.get('/profile/me', authenticate, authorize('NGO'), async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM ngo_profiles WHERE "userId" = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO profile not found'
      });
    }

    res.json({
      success: true,
      data: { profile: result.rows[0] }
    });
  } catch (error) {
    console.error('Get NGO profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching NGO profile'
    });
  }
});

// @route   PUT /api/ngos/:id/verify
// @desc    Verify NGO (Admin only)
// @access  Private (Admin only)
router.put('/:id/verify', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const result = await query(`
      UPDATE ngo_profiles 
      SET "isVerified" = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `, [isVerified, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO profile not found'
      });
    }

    res.json({
      success: true,
      message: `NGO ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { profile: result.rows[0] }
    });
  } catch (error) {
    console.error('Verify NGO error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying NGO'
    });
  }
});

// @route   GET /api/ngos/stats/dashboard
// @desc    Get NGO dashboard statistics
// @access  Private (NGO users only)
router.get('/stats/dashboard', authenticate, authorize('NGO'), async (req, res) => {
  try {
    // Get NGO profile
    const profileResult = await query(
      'SELECT id FROM ngo_profiles WHERE "userId" = $1',
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'NGO profile not found'
      });
    }

    const ngoId = profileResult.rows[0].id;

    // Get statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as "totalReports",
        COUNT(CASE WHEN status = 'REPORTED' THEN 1 END) as "pendingReports",
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as "activeReports",
        COUNT(CASE WHEN status = 'RESCUED' THEN 1 END) as "rescuedAnimals",
        COUNT(CASE WHEN status = 'ADOPTED' THEN 1 END) as "adoptedAnimals"
      FROM reports 
      WHERE "assignedNGOId" = $1
    `, [ngoId]);

    // Get recent reports
    const recentReportsResult = await query(`
      SELECT 
        r.id, r.title, r.status, r.urgency, r."createdAt",
        u.name as "reportedBy"
      FROM reports r
      JOIN users u ON r."reportedById" = u.id
      WHERE r."assignedNGOId" = $1
      ORDER BY r."createdAt" DESC
      LIMIT 5
    `, [ngoId]);

    const stats = statsResult.rows[0];
    stats.recentReports = recentReportsResult.rows;

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get NGO stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching NGO statistics'
    });
  }
});

export default router;