import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateReport, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/reports
// @desc    Get all reports with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      status,
      urgency,
      search,
      lat,
      lng,
      radius = 50,
      page = 1,
      limit = 20
    } = req.query;

    let queryText = `
      SELECT 
        r.id, r.title, r.description, r.latitude, r.longitude, r.address,
        r.photos, r.status, r.urgency, r.tags, r."createdAt", r."updatedAt",
        u.name as "reportedBy",
        ngo.id as "assignedNGOId", ngo."organizationName" as "assignedNGO"
      FROM reports r
      JOIN users u ON r."reportedById" = u.id
      LEFT JOIN ngo_profiles ngo ON r."assignedNGOId" = ngo.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    // Add filters
    if (status) {
      paramCount++;
      queryText += ` AND r.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (urgency) {
      paramCount++;
      queryText += ` AND r.urgency = $${paramCount}`;
      queryParams.push(urgency);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (r.title ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Location-based filtering
    if (lat && lng) {
      paramCount += 3;
      queryText += ` AND (
        6371 * acos(
          cos(radians($${paramCount - 2})) * cos(radians(r.latitude)) *
          cos(radians(r.longitude) - radians($${paramCount - 1})) +
          sin(radians($${paramCount - 2})) * sin(radians(r.latitude))
        )
      ) <= $${paramCount}`;
      queryParams.push(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    }

    // Add ordering and pagination
    queryText += ` ORDER BY r."createdAt" DESC`;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount += 2;
    queryText += ` LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
    queryParams.push(parseInt(limit), offset);

    const result = await query(queryText, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM reports r
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND r.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (urgency) {
      countParamCount++;
      countQuery += ` AND r.urgency = $${countParamCount}`;
      countParams.push(urgency);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (r.title ILIKE $${countParamCount} OR r.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (lat && lng) {
      countParamCount += 3;
      countQuery += ` AND (
        6371 * acos(
          cos(radians($${countParamCount - 2})) * cos(radians(r.latitude)) *
          cos(radians(r.longitude) - radians($${countParamCount - 1})) +
          sin(radians($${countParamCount - 2})) * sin(radians(r.latitude))
        )
      ) <= $${countParamCount}`;
      countParams.push(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        reports: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports'
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report with updates
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get report details
    const reportResult = await query(`
      SELECT 
        r.id, r.title, r.description, r.latitude, r.longitude, r.address,
        r.photos, r.status, r.urgency, r.tags, r."createdAt", r."updatedAt",
        u.name as "reportedBy",
        ngo.id as "assignedNGOId", ngo."organizationName" as "assignedNGO"
      FROM reports r
      JOIN users u ON r."reportedById" = u.id
      LEFT JOIN ngo_profiles ngo ON r."assignedNGOId" = ngo.id
      WHERE r.id = $1
    `, [id]);

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Get report updates
    const updatesResult = await query(`
      SELECT 
        ru.id, ru.message, ru.photos, ru."createdAt",
        u.name as author
      FROM report_updates ru
      JOIN users u ON ru."authorId" = u.id
      WHERE ru."reportId" = $1
      ORDER BY ru."createdAt" ASC
    `, [id]);

    const report = reportResult.rows[0];
    report.updates = updatesResult.rows;

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report'
    });
  }
});

// @route   POST /api/reports
// @desc    Create new report
// @access  Private
router.post('/', authenticate, validateReport, validateRequest, async (req, res) => {
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      address,
      photos = [],
      urgency,
      tags = []
    } = req.body;

    const reportId = uuidv4();

    const result = await query(`
      INSERT INTO reports (
        id, title, description, latitude, longitude, address,
        photos, urgency, tags, "reportedById", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `, [
      reportId, title, description, latitude, longitude, address,
      photos, urgency, tags, req.user.id
    ]);

    const report = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: { report }
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating report'
    });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report (status, assigned NGO, etc.)
// @access  Private (NGO or Admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedNGOId } = req.body;

    // Check if report exists
    const reportResult = await query('SELECT * FROM reports WHERE id = $1', [id]);
    
    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'NGO' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only NGOs and admins can update reports'
      });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
    }

    if (assignedNGOId) {
      paramCount++;
      updateFields.push(`"assignedNGOId" = $${paramCount}`);
      updateValues.push(assignedNGOId);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    paramCount++;
    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE reports 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: { report: result.rows[0] }
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating report'
    });
  }
});

// @route   POST /api/reports/:id/updates
// @desc    Add update to report
// @access  Private
router.post('/:id/updates', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, photos = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update message is required'
      });
    }

    // Check if report exists
    const reportResult = await query('SELECT id FROM reports WHERE id = $1', [id]);
    
    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const updateId = uuidv4();

    const result = await query(`
      INSERT INTO report_updates (id, "reportId", "authorId", message, photos, "createdAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [updateId, id, req.user.id, message.trim(), photos]);

    // Also update the report's updatedAt timestamp
    await query('UPDATE reports SET "updatedAt" = NOW() WHERE id = $1', [id]);

    res.status(201).json({
      success: true,
      message: 'Update added successfully',
      data: { update: result.rows[0] }
    });
  } catch (error) {
    console.error('Add update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding update'
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (Admin or report owner)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if report exists and get owner
    const reportResult = await query('SELECT "reportedById" FROM reports WHERE id = $1', [id]);
    
    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reportResult.rows[0];

    // Check permissions
    if (req.user.role !== 'ADMIN' && req.user.id !== report.reportedById) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reports'
      });
    }

    await query('DELETE FROM reports WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting report'
    });
  }
});

export default router;