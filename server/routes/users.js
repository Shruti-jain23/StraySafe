import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, email, name, role, phone, organization, avatar, "isVerified", "createdAt"
      FROM users 
      WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user: result.rows[0] }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, organization, avatar } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (name) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name.trim());
    }

    if (phone) {
      paramCount++;
      updateFields.push(`phone = $${paramCount}`);
      updateValues.push(phone.trim());
    }

    if (organization) {
      paramCount++;
      updateFields.push(`organization = $${paramCount}`);
      updateValues.push(organization.trim());
    }

    if (avatar) {
      paramCount++;
      updateFields.push(`avatar = $${paramCount}`);
      updateValues.push(avatar);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    paramCount++;
    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(req.user.id);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, role, phone, organization, avatar, "isVerified", "createdAt"
    `;

    const result = await query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: result.rows[0] }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current password hash
    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password = $1, "updatedAt" = NOW() WHERE id = $2',
      [hashedNewPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

// @route   GET /api/users/reports
// @desc    Get current user's reports
// @access  Private
router.get('/reports', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(`
      SELECT 
        r.id, r.title, r.description, r.latitude, r.longitude, r.address,
        r.photos, r.status, r.urgency, r.tags, r."createdAt", r."updatedAt",
        ngo."organizationName" as "assignedNGO"
      FROM reports r
      LEFT JOIN ngo_profiles ngo ON r."assignedNGOId" = ngo.id
      WHERE r."reportedById" = $1
      ORDER BY r."createdAt" DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, parseInt(limit), offset]);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM reports WHERE "reportedById" = $1',
      [req.user.id]
    );

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
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user reports'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    let queryText = `
      SELECT 
        id, email, name, role, phone, organization, avatar, "isVerified", "createdAt"
      FROM users 
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      queryText += ` AND role = $${paramCount}`;
      queryParams.push(role);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` ORDER BY "createdAt" DESC`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount += 2;
    queryText += ` LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
    queryParams.push(parseInt(limit), offset);

    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (role) {
      countParamCount++;
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   PUT /api/users/:id/verify
// @desc    Verify/unverify user (Admin only)
// @access  Private (Admin only)
router.put('/:id/verify', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const result = await query(`
      UPDATE users 
      SET "isVerified" = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id, email, name, role, "isVerified"
    `, [isVerified, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { user: result.rows[0] }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying user'
    });
  }
});

export default router;