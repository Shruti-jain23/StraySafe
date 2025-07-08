import { Request, Response } from 'express';
import prisma from '../config/database';

interface AuthRequest extends Request {
  user?: any;
}

export const createNGOProfile = async (req: AuthRequest, res: Response) => {
  try {
    const {
      organizationName,
      description,
      website,
      address,
      servicesOffered,
      operatingHours,
      capacity
    } = req.body;

    // Check if user already has an NGO profile
    const existingProfile = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (existingProfile) {
      return res.status(400).json({ message: 'NGO profile already exists' });
    }

    // Update user role to NGO if not already
    await prisma.user.update({
      where: { id: req.user.id },
      data: { role: 'NGO' }
    });

    const ngoProfile = await prisma.nGOProfile.create({
      data: {
        userId: req.user.id,
        organizationName,
        description,
        website,
        address,
        servicesOffered,
        operatingHours,
        capacity
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    res.status(201).json({
      message: 'NGO profile created successfully',
      ngoProfile
    });
  } catch (error) {
    console.error('Create NGO profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateNGOProfile = async (req: AuthRequest, res: Response) => {
  try {
    const {
      organizationName,
      description,
      website,
      address,
      servicesOffered,
      operatingHours,
      capacity
    } = req.body;

    const ngoProfile = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!ngoProfile) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    const updatedProfile = await prisma.nGOProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(organizationName && { organizationName }),
        ...(description && { description }),
        ...(website && { website }),
        ...(address && { address }),
        ...(servicesOffered && { servicesOffered }),
        ...(operatingHours && { operatingHours }),
        ...(capacity && { capacity })
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    res.json({
      message: 'NGO profile updated successfully',
      ngoProfile: updatedProfile
    });
  } catch (error) {
    console.error('Update NGO profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getNGOProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ngoProfile = await prisma.nGOProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true }
        },
        assignedReports: {
          where: { status: { in: ['IN_PROGRESS', 'RESCUED'] } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            urgency: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            assignedReports: {
              where: { status: 'RESCUED' }
            }
          }
        }
      }
    });

    if (!ngoProfile) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    res.json({ ngoProfile });
  } catch (error) {
    console.error('Get NGO profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getNGOs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      services,
      verified
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { organizationName: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Services filter
    if (services) {
      where.servicesOffered = {
        hasSome: Array.isArray(services) ? services : [services]
      };
    }

    // Verified filter
    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    const [ngos, total] = await Promise.all([
      prisma.nGOProfile.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [
          { isVerified: 'desc' },
          { rating: 'desc' },
          { totalRescues: 'desc' }
        ],
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatar: true }
          },
          _count: {
            select: {
              assignedReports: {
                where: { status: 'RESCUED' }
              }
            }
          }
        }
      }),
      prisma.nGOProfile.count({ where })
    ]);

    res.json({
      ngos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get NGOs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyNGOReports = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const ngoProfile = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!ngoProfile) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    let where: any = { assignedNGOId: ngoProfile.id };

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
          reportedBy: {
            select: { id: true, name: true, email: true, phone: true, avatar: true }
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
    console.error('Get my NGO reports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getNGOStats = async (req: AuthRequest, res: Response) => {
  try {
    const ngoProfile = await prisma.nGOProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!ngoProfile) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    const [
      totalReports,
      inProgressReports,
      rescuedReports,
      adoptedReports,
      recentReports
    ] = await Promise.all([
      prisma.report.count({
        where: { assignedNGOId: ngoProfile.id }
      }),
      prisma.report.count({
        where: { assignedNGOId: ngoProfile.id, status: 'IN_PROGRESS' }
      }),
      prisma.report.count({
        where: { assignedNGOId: ngoProfile.id, status: 'RESCUED' }
      }),
      prisma.report.count({
        where: { assignedNGOId: ngoProfile.id, status: 'ADOPTED' }
      }),
      prisma.report.findMany({
        where: { assignedNGOId: ngoProfile.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          urgency: true,
          createdAt: true,
          reportedBy: {
            select: { name: true }
          }
        }
      })
    ]);

    // Calculate success rate
    const successRate = totalReports > 0 
      ? Math.round(((rescuedReports + adoptedReports) / totalReports) * 100)
      : 0;

    res.json({
      stats: {
        totalReports,
        inProgressReports,
        rescuedReports,
        adoptedReports,
        successRate
      },
      recentReports
    });
  } catch (error) {
    console.error('Get NGO stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};