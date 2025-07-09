import { Request, Response } from 'express';
import prisma from '../config/database';
import { notificationService } from '../services/notificationService';
import { geocodingService } from '../services/geocodingService';

interface AuthRequest extends Request {
  user?: any;
}

export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, latitude, longitude, address, urgency, tags, photos } = req.body;

    // Get address from coordinates if not provided
    let finalAddress = address;
    if (!finalAddress) {
      finalAddress = await geocodingService.reverseGeocode(latitude, longitude);
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        title,
        description,
        latitude,
        longitude,
        address: finalAddress,
        photos: photos || [],
        urgency,
        tags: tags || [],
        reportedById: req.user.id
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    // Find nearby NGOs and notify them
    await notificationService.notifyNearbyNGOs(report);

    // Emit real-time notification
    const io = req.app.get('io');
    io.emit('new_report', {
      id: report.id,
      title: report.title,
      location: { lat: report.latitude, lng: report.longitude, address: report.address },
      urgency: report.urgency,
      status: report.status,
      reportedAt: report.createdAt
    });

    res.status(201).json({
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      urgency,
      search,
      latitude,
      longitude,
      radius = 50 // km
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    let where: any = {};

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by urgency
    if (urgency && urgency !== 'all') {
      where.urgency = urgency;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Location-based filtering (simplified - in production, use PostGIS)
    if (latitude && longitude) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      const radiusInDegrees = Number(radius) / 111; // Rough conversion

      where.latitude = {
        gte: lat - radiusInDegrees,
        lte: lat + radiusInDegrees
      };
      where.longitude = {
        gte: lng - radiusInDegrees,
        lte: lng + radiusInDegrees
      };
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: {
            select: { id: true, name: true, avatar: true }
          },
          assignedNGO: {
            select: { id: true, organizationName: true }
          },
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              author: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          _count: {
            select: { updates: true }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    res.json({
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, phone: true, avatar: true }
        },
        assignedNGO: {
          select: { 
            id: true, 
            organizationName: true, 
            description: true,
            user: {
              select: { name: true, email: true, phone: true }
            }
          }
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, name: true, avatar: true, role: true }
            }
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedNGOId } = req.body;

    // Check if user has permission to update
    const report = await prisma.report.findUnique({
      where: { id },
      include: { assignedNGO: true }
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Only report owner, assigned NGO, or admin can update
    const canUpdate = 
      report.reportedById === req.user.id ||
      report.assignedNGO?.userId === req.user.id ||
      req.user.role === 'ADMIN';

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(assignedNGOId && { assignedNGOId })
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, phone: true }
        },
        assignedNGO: {
          select: { id: true, organizationName: true }
        }
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('report_updated', {
      id: updatedReport.id,
      status: updatedReport.status,
      assignedNGO: updatedReport.assignedNGO
    });

    // Send notification to report owner if status changed
    if (status && status !== report.status) {
      await notificationService.notifyStatusChange(updatedReport, status);
    }

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addReportUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message, photos } = req.body;

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
      include: { 
        reportedBy: true,
        assignedNGO: true 
      }
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user can add updates
    const canUpdate = 
      report.reportedById === req.user.id ||
      report.assignedNGO?.userId === req.user.id ||
      req.user.role === 'ADMIN';

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    const update = await prisma.reportUpdate.create({
      data: {
        reportId: id,
        authorId: req.user.id,
        message,
        photos: photos || []
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });

    // Update report's updatedAt timestamp
    await prisma.report.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('report_update_added', {
      reportId: id,
      update
    });

    // Send notification to interested parties
    await notificationService.notifyReportUpdate(report, update);

    res.status(201).json({
      message: 'Update added successfully',
      update
    });
  } catch (error) {
    console.error('Add report update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { ngoId } = req.body;

    // Only NGOs can assign reports to themselves or admins can assign to any NGO
    if (req.user.role !== 'ADMIN' && req.user.ngoProfile?.id !== ngoId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.status !== 'REPORTED') {
      return res.status(400).json({ message: 'Report is already assigned or completed' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        assignedNGOId: ngoId,
        status: 'IN_PROGRESS'
      },
      include: {
        reportedBy: true,
        assignedNGO: {
          include: {
            user: true
          }
        }
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('report_assigned', {
      reportId: id,
      ngoId,
      status: 'IN_PROGRESS'
    });

    // Send notification to report owner
    await notificationService.notifyReportAssigned(updatedReport);

    res.json({
      message: 'Report assigned successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = { reportedById: req.user.id };

    if (status && status !== 'all') {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          assignedNGO: {
            select: { id: true, organizationName: true }
          },
          _count: {
            select: { updates: true }
          }
        }
      }),
      prisma.report.count({ where })
    ]);

    res.json({
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};