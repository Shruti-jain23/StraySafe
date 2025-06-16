import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Search, Clock, AlertTriangle, Eye, Navigation } from 'lucide-react';
import { useReports, type StrayReport } from '../contexts/ReportsContext';

export const MapPage: React.FC = () => {
  const { reports } = useReports();
  const [filteredReports, setFilteredReports] = useState<StrayReport[]>(reports);
  const [selectedReport, setSelectedReport] = useState<StrayReport | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    urgency: 'all',
    search: ''
  });

  useEffect(() => {
    let filtered = reports;

    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    if (filters.urgency !== 'all') {
      filtered = filtered.filter(report => report.urgency === filters.urgency);
    }

    if (filters.search) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.location.address?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [reports, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'rescued': return 'bg-green-500';
      case 'adopted': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'border-green-300';
      case 'medium': return 'border-yellow-300';
      case 'high': return 'border-orange-300';
      case 'critical': return 'border-red-300';
      default: return 'border-gray-300';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interactive Map</h1>
              <p className="text-gray-600 mt-1">Explore stray animal reports in your area</p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Reported: {reports.filter(r => r.status === 'reported').length}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>In Progress: {reports.filter(r => r.status === 'in_progress').length}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Rescued: {reports.filter(r => r.status === 'rescued').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Filters & Search */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filters</h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="reported">Reported</option>
                    <option value="in_progress">In Progress</option>
                    <option value="rescued">Rescued</option>
                    <option value="adopted">Adopted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                  <select
                    value={filters.urgency}
                    onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Urgency</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Report List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reports ({filteredReports.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                      selectedReport?.id === report.id ? 'bg-primary-50 border-r-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{report.title}</h4>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(report.status)} flex-shrink-0 ml-2`}></div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{report.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{report.location.address?.split(',')[0]}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatTimeAgo(report.reportedAt)}</span>
                      </div>
                    </div>
                    
                    {report.urgency === 'critical' && (
                      <div className="flex items-center mt-2 text-red-600 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span>Critical Priority</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Map Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Navigation className="h-5 w-5 text-primary-500 mr-2" />
                    <span className="font-medium text-gray-900">Live Map View</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {filteredReports.length} of {reports.length} reports
                  </div>
                </div>
              </div>

              {/* Simulated Map */}
              <div className="relative h-96 bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
                {/* Map Background Pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%2394a3b8%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M20 20c0-11.046-8.954-20-20-20v20h20z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
                
                {/* Map Markers */}
                {filteredReports.map((report, index) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 ${
                      selectedReport?.id === report.id ? 'scale-125' : 'hover:scale-110'
                    } transition-transform duration-200`}
                    style={{
                      left: `${20 + (index * 15) % 60}%`,
                      top: `${20 + (index * 20) % 60}%`
                    }}
                  >
                    <div className={`relative ${getUrgencyColor(report.urgency)} border-2 rounded-full p-2 bg-white shadow-lg`}>
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(report.status)}`}></div>
                      {report.urgency === 'critical' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Legend</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span>Reported</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span>Rescued</span>
                    </div>
                  </div>
                </div>

                {/* No Reports Message */}
                {filteredReports.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No reports match your current filters</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Report Details */}
              {selectedReport && (
                <div className="border-t border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedReport.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedReport.location.address}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedReport.status === 'rescued' ? 'bg-green-100 text-green-800' :
                        selectedReport.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedReport.status.replace('_', ' ').charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedReport.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                        selectedReport.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        selectedReport.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedReport.urgency} priority
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{selectedReport.description}</p>

                  {selectedReport.photos.length > 0 && (
                    <div className="flex space-x-2 mb-4">
                      {selectedReport.photos.slice(0, 3).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${selectedReport.title} ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ))}
                      {selectedReport.photos.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-600">
                          +{selectedReport.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Reported by {selectedReport.reportedBy}</span>
                    <span>{formatTimeAgo(selectedReport.reportedAt)}</span>
                  </div>

                  {selectedReport.assignedNGO && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Assigned to:</strong> {selectedReport.assignedNGO}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};