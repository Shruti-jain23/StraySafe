import React, { useState, useRef } from 'react';
import { Camera, MapPin, Upload, AlertTriangle, Heart, CheckCircle, X } from 'lucide-react';
import { useReports, type Location } from '../contexts/ReportsContext';
import { useNavigate } from 'react-router-dom';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { addReport } = useReports();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    tags: [] as string[],
    reportedBy: ''
  });

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800', description: 'Animal appears healthy, needs rehoming' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800', description: 'Needs attention but not urgent' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800', description: 'Injured or in distress' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800', description: 'Life-threatening condition' }
  ];

  const commonTags = [
    'injured', 'dehydrated', 'malnourished', 'lost-pet', 'needs-adoption',
    'friendly', 'aggressive', 'pregnant', 'with-babies', 'elderly',
    'dog', 'cat', 'puppy', 'kitten', 'disabled'
  ];

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // In a real app, you'd use Google Geocoding API or similar
            const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setCurrentLocation({
              lat: latitude,
              lng: longitude,
              address
            });
          } catch (error) {
            setCurrentLocation({
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
          
          setLocationLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationLoading(false);
          alert('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationLoading(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPhotos(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentLocation) {
      alert('Please add your location before submitting.');
      return;
    }
    
    if (photos.length === 0) {
      alert('Please add at least one photo.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addReport({
        ...formData,
        location: currentLocation,
        photos,
        status: 'reported'
      });
      
      // Success - redirect to tracking page
      navigate('/tracking', { 
        state: { message: 'Report submitted successfully! NGOs have been notified.' }
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-warm-50 to-earth-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary-500 rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Report a Stray Animal</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us save a life by reporting stray animals in your area. Your report will immediately notify nearby NGOs and volunteers.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6">
            <div className="flex items-center text-white">
              <AlertTriangle className="h-6 w-6 mr-3" />
              <span className="font-semibold">Emergency? Call our 24/7 hotline: +1-800-STRAY-HELP</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Basic Information
              </h2>
              
              <div>
                <label htmlFor="reportedBy" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="reportedBy"
                  value={formData.reportedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportedBy: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Injured dog near park"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe the animal's condition, behavior, and any other relevant details..."
                  required
                />
              </div>
            </div>

            {/* Urgency Level */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Urgency Level
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {urgencyLevels.map((level) => (
                  <label
                    key={level.value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      formData.urgency === level.value
                        ? 'border-primary-500 ring-2 ring-primary-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={level.value}
                      checked={formData.urgency === level.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${level.color}`}>
                          {level.label}
                        </span>
                        {formData.urgency === level.value && (
                          <CheckCircle className="h-5 w-5 text-primary-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{level.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Photos *
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors duration-200">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Add photos of the animal</p>
                <p className="text-gray-500 mb-4">Clear photos help NGOs assess the situation quickly</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose Photos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Location *
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                {currentLocation ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-6 w-6 text-primary-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Location Captured</p>
                        <p className="text-sm text-gray-600">{currentLocation.address}</p>
                      </div>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                ) : (
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Get Current Location</p>
                    <p className="text-gray-500 mb-4">We need your location to alert nearby NGOs</p>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors duration-200"
                    >
                      {locationLoading ? 'Getting Location...' : 'Use My Location'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Tags (Optional)
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-600">Select tags that describe the animal or situation:</p>
                <div className="flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                        formData.tags.includes(tag)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {tag.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || !currentLocation || photos.length === 0}
                className="w-full bg-primary-500 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Heart className="h-6 w-6 mr-3" />
                    Submit Report
                  </>
                )}
              </button>
              
              <p className="text-sm text-gray-500 text-center mt-3">
                By submitting, you agree to our terms and confirm the information is accurate.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};