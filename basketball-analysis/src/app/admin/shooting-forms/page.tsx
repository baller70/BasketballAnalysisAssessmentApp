"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Upload, 
  Check, 
  X, 
  Crop, 
  Search, 
  ChevronLeft, 
  Trash2,
  Save,
  ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  ZoomIn,
  RotateCcw,
  Download
} from "lucide-react";
import { ALL_ELITE_SHOOTERS, EliteShooter } from "@/data/eliteShooters";

// Types for image management
interface ShootingFormImage {
  id: string;
  url: string;
  playerName: string;
  playerId: number;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  cropData?: CropData;
  originalUrl?: string; // Original URL before cropping
  sourceUrl?: string; // The source URL where the image was found (for verification)
  isFromDatabase?: boolean; // True if this image is from the existing database
  uploadType?: 'url' | 'file'; // How the image was uploaded
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Local storage key
const STORAGE_KEY = 'shooting-form-images';

export default function ShootingFormsAdminPage() {
  const [images, setImages] = useState<ShootingFormImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ShootingFormImage | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<EliteShooter | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Crop state
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const cropImageRef = useRef<HTMLImageElement>(null);
  
  // Load images from localStorage AND existing database images on mount
  useEffect(() => {
    // First, load any saved images from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    let savedImages: ShootingFormImage[] = [];
    if (saved) {
      try {
        savedImages = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load images from localStorage:', e);
      }
    }
    
    // Then, load all existing shooting form images from the database
    const databaseImages: ShootingFormImage[] = [];
    ALL_ELITE_SHOOTERS.forEach(player => {
      if (player.shootingFormImages && player.shootingFormImages.length > 0) {
        player.shootingFormImages.forEach((url, index) => {
          // Check if this image already exists in saved images
          const existsInSaved = savedImages.some(img => img.url === url && img.playerId === player.id);
          if (!existsInSaved) {
            databaseImages.push({
              id: `db-${player.id}-${index}`,
              url,
              playerName: player.name,
              playerId: player.id,
              status: 'approved', // Database images are already approved
              uploadedAt: new Date().toISOString(),
              isFromDatabase: true, // Mark as from database
              sourceUrl: url, // Database images have their URL as the source
              uploadType: 'url',
            });
          }
        });
      }
    });
    
    // Combine saved images with database images
    setImages([...savedImages, ...databaseImages]);
  }, []);
  
  // Save images to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  }, [images]);
  
  // Filter images based on status and search
  const filteredImages = images.filter(img => {
    const matchesStatus = filterStatus === 'all' || img.status === filterStatus;
    const matchesSearch = img.playerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  // Filter players for assignment dropdown
  const filteredPlayers = ALL_ELITE_SHOOTERS.filter(player => 
    player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    player.team.toLowerCase().includes(playerSearch.toLowerCase())
  ).slice(0, 20);
  
  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newImage: ShootingFormImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          playerName: selectedPlayer?.name || 'Unassigned',
          playerId: selectedPlayer?.id || 0,
          status: 'pending',
          uploadedAt: new Date().toISOString(),
          originalUrl: url,
          sourceUrl: `Local file: ${file.name}`,
          uploadType: 'file'
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedPlayer]);
  
  // Handle URL upload
  const [urlInput, setUrlInput] = useState('');
  const handleUrlUpload = useCallback(() => {
    if (!urlInput.trim()) return;
    
    const newImage: ShootingFormImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: urlInput.trim(),
      playerName: selectedPlayer?.name || 'Unassigned',
      playerId: selectedPlayer?.id || 0,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
      originalUrl: urlInput.trim(),
      sourceUrl: urlInput.trim(), // Keep the source URL for verification
      uploadType: 'url'
    };
    setImages(prev => [...prev, newImage]);
    setUrlInput('');
  }, [urlInput, selectedPlayer]);
  
  // Approve image - marks as approved and saves to player's shooting form images
  const approveImage = useCallback((id: string) => {
    const imageToApprove = images.find(img => img.id === id);
    if (!imageToApprove) return;
    
    // Update the image status
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status: 'approved' as const } : img
    ));
    
    // Save to player's approved shooting form images in localStorage
    // This will be read by the ShootingFormGallery component
    const approvedKey = 'approved_shooting_forms';
    const existingApproved = JSON.parse(localStorage.getItem(approvedKey) || '{}');
    
    if (!existingApproved[imageToApprove.playerId]) {
      existingApproved[imageToApprove.playerId] = [];
    }
    
    // If this image was cropped, remove the original URL first (if it exists)
    // Only the cropped version should be in the player's bio
    const wasCropped = imageToApprove.originalUrl && imageToApprove.originalUrl !== imageToApprove.url;
    if (wasCropped) {
      existingApproved[imageToApprove.playerId] = existingApproved[imageToApprove.playerId].filter(
        (url: string) => url !== imageToApprove.originalUrl
      );
      
      // Also store excluded URLs so the gallery knows to filter out the original from database
      const excludedKey = 'excluded_shooting_forms';
      const existingExcluded = JSON.parse(localStorage.getItem(excludedKey) || '{}');
      if (!existingExcluded[imageToApprove.playerId]) {
        existingExcluded[imageToApprove.playerId] = [];
      }
      if (!existingExcluded[imageToApprove.playerId].includes(imageToApprove.originalUrl)) {
        existingExcluded[imageToApprove.playerId].push(imageToApprove.originalUrl);
      }
      localStorage.setItem(excludedKey, JSON.stringify(existingExcluded));
    }
    
    // Add the current image URL (cropped version if cropped) if not already present
    if (!existingApproved[imageToApprove.playerId].includes(imageToApprove.url)) {
      existingApproved[imageToApprove.playerId].push(imageToApprove.url);
    }
    
    localStorage.setItem(approvedKey, JSON.stringify(existingApproved));
    
    // Close the modal and show success
    setSelectedImage(null);
    
    // Show success alert
    alert(`✅ ${wasCropped ? 'Cropped image' : 'Image'} approved and added to ${imageToApprove.playerName}'s shooting form gallery!`);
  }, [images]);
  
  // Reject image - DELETES the image from the system entirely
  const rejectImage = useCallback((id: string) => {
    const imageToReject = images.find(img => img.id === id);
    
    // Remove from images array (delete it)
    setImages(prev => prev.filter(img => img.id !== id));
    
    // Close modal if this image was selected
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
    
    // Also remove from approved list if it was there (both current URL and original URL)
    if (imageToReject) {
      const approvedKey = 'approved_shooting_forms';
      const existingApproved = JSON.parse(localStorage.getItem(approvedKey) || '{}');
      if (existingApproved[imageToReject.playerId]) {
        // Remove both the current URL and original URL (in case it was cropped)
        existingApproved[imageToReject.playerId] = existingApproved[imageToReject.playerId].filter(
          (url: string) => url !== imageToReject.url && url !== imageToReject.originalUrl
        );
        localStorage.setItem(approvedKey, JSON.stringify(existingApproved));
      }
    }
    
    alert('🗑️ Image rejected and removed from the system.');
  }, [images, selectedImage]);
  
  // Delete image
  const deleteImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  }, [selectedImage]);
  
  // Reset image to pending
  const resetImage = useCallback((id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status: 'pending' as const } : img
    ));
    // Also update selectedImage if it's the same image
    setSelectedImage(prev => 
      prev?.id === id ? { ...prev, status: 'pending' as const } : prev
    );
  }, []);
  
  // Assign image to player
  const assignToPlayer = useCallback((imageId: string, player: EliteShooter) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, playerName: player.name, playerId: player.id } : img
    ));
    setShowAssignModal(false);
    setPlayerSearch('');
  }, []);
  
  // Handle crop
  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropImageRef.current) return;
    const rect = cropImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsCropping(true);
  };
  
  const handleCropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropImageRef.current) return;
    const rect = cropImageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCropEnd({ x, y });
  };
  
  const handleCropMouseUp = () => {
    setIsCropping(false);
  };
  
  const [isCropLoading, setIsCropLoading] = useState(false);
  
  const applyCrop = useCallback(async () => {
    if (!selectedImage || !cropStart || !cropEnd || !cropImageRef.current) return;
    
    const cropData: CropData = {
      x: Math.min(cropStart.x, cropEnd.x),
      y: Math.min(cropStart.y, cropEnd.y),
      width: Math.abs(cropEnd.x - cropStart.x),
      height: Math.abs(cropEnd.y - cropStart.y)
    };
    
    // If crop area is too small, don't apply
    if (cropData.width < 5 || cropData.height < 5) {
      alert('Please select a larger crop area');
      return;
    }
    
    setIsCropLoading(true);
    
    try {
      // For data URLs (uploaded files), we can crop directly
      const sourceUrl = selectedImage.originalUrl || selectedImage.url;
      const isDataUrl = sourceUrl.startsWith('data:');
      
      if (isDataUrl) {
        // Create a canvas to crop the image
        const img = cropImageRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsCropLoading(false);
          return;
        }
        
        // Calculate actual pixel coordinates from percentages
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const cropX = (cropData.x / 100) * naturalWidth;
        const cropY = (cropData.y / 100) * naturalHeight;
        const cropW = (cropData.width / 100) * naturalWidth;
        const cropH = (cropData.height / 100) * naturalHeight;
        
        // Set canvas size to cropped dimensions
        canvas.width = cropW;
        canvas.height = cropH;
        
        // Draw the cropped portion
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        
        // Convert to data URL
        const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Update the image with the cropped version
        setImages(prev => prev.map(imgItem => 
          imgItem.id === selectedImage.id ? { 
            ...imgItem, 
            url: croppedUrl,
            cropData,
            originalUrl: imgItem.originalUrl || imgItem.url
          } : imgItem
        ));
        
        setSelectedImage(prev => prev ? {
          ...prev,
          url: croppedUrl,
          cropData,
          originalUrl: prev.originalUrl || prev.url
        } : null);
      } else {
        // For external URLs, we need to fetch and convert to data URL first
        // Try using a proxy or just store the crop data
        try {
          const response = await fetch(sourceUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onload = () => {
            const dataUrl = reader.result as string;
            
            // Create an image element to get dimensions
            const tempImg = document.createElement('img');
            tempImg.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              
              const cropX = (cropData.x / 100) * tempImg.width;
              const cropY = (cropData.y / 100) * tempImg.height;
              const cropW = (cropData.width / 100) * tempImg.width;
              const cropH = (cropData.height / 100) * tempImg.height;
              
              canvas.width = cropW;
              canvas.height = cropH;
              ctx.drawImage(tempImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
              
              const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
              
              setImages(prev => prev.map(imgItem => 
                imgItem.id === selectedImage.id ? { 
                  ...imgItem, 
                  url: croppedUrl,
                  cropData,
                  originalUrl: imgItem.originalUrl || imgItem.url
                } : imgItem
              ));
              
              setSelectedImage(prev => prev ? {
                ...prev,
                url: croppedUrl,
                cropData,
                originalUrl: prev.originalUrl || prev.url
              } : null);
              
              setIsCropLoading(false);
              setShowCropModal(false);
              setCropStart(null);
              setCropEnd(null);
            };
            tempImg.src = dataUrl;
          };
          
          reader.readAsDataURL(blob);
          return; // Exit early, the reader.onload will handle the rest
        } catch {
          // If fetch fails due to CORS, just save crop data without actual cropping
          setImages(prev => prev.map(imgItem => 
            imgItem.id === selectedImage.id ? { 
              ...imgItem, 
              cropData,
              originalUrl: imgItem.originalUrl || imgItem.url
            } : imgItem
          ));
          
          setSelectedImage(prev => prev ? {
            ...prev,
            cropData,
            originalUrl: prev.originalUrl || prev.url
          } : null);
          
          alert('Note: External images cannot be visually cropped due to security restrictions. The crop selection has been saved for reference.');
        }
      }
    } catch (error) {
      console.error('Crop error:', error);
      alert('Failed to crop image. Please try again.');
    }
    
    setIsCropLoading(false);
    setShowCropModal(false);
    setCropStart(null);
    setCropEnd(null);
  }, [selectedImage, cropStart, cropEnd]);
  
  const resetCrop = useCallback(() => {
    if (!selectedImage) return;
    
    // Restore original URL if available
    setImages(prev => prev.map(img => 
      img.id === selectedImage.id ? { 
        ...img, 
        url: img.originalUrl || img.url, // Restore original
        cropData: undefined 
      } : img
    ));
    
    // Also update selectedImage
    setSelectedImage(prev => prev ? {
      ...prev,
      url: prev.originalUrl || prev.url,
      cropData: undefined
    } : null);
    
    setCropStart(null);
    setCropEnd(null);
  }, [selectedImage]);
  
  // Export approved images - generates TypeScript code to add to database
  const exportApprovedImages = useCallback(() => {
    // Only export NEW approved images (not ones already in database)
    const newApproved = images.filter(img => img.status === 'approved' && !img.isFromDatabase);
    
    if (newApproved.length === 0) {
      alert('No new approved images to export. All approved images are already in the database.');
      return;
    }
    
    // Group by player
    const grouped = newApproved.reduce((acc, img) => {
      if (!acc[img.playerId]) {
        acc[img.playerId] = {
          playerName: img.playerName,
          playerId: img.playerId,
          images: []
        };
      }
      acc[img.playerId].images.push(img.url);
      return acc;
    }, {} as Record<number, { playerName: string; playerId: number; images: string[] }>);
    
    // Generate TypeScript code
    let code = `// Add these shooting form images to eliteShooters.ts\n`;
    code += `// Generated on ${new Date().toLocaleDateString()}\n\n`;
    
    Object.values(grouped).forEach(player => {
      code += `// ${player.playerName} (ID: ${player.playerId})\n`;
      code += `// Find the player in ALL_ELITE_SHOOTERS and add/update shootingFormImages:\n`;
      code += `shootingFormImages: [\n`;
      player.images.forEach((url, i) => {
        code += `  "${url}"${i < player.images.length - 1 ? ',' : ''}\n`;
      });
      code += `],\n\n`;
    });
    
    // Also create JSON for reference
    const jsonData = {
      exportedAt: new Date().toISOString(),
      totalImages: newApproved.length,
      players: grouped
    };
    
    // Download TypeScript code
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shooting-forms-to-add.ts';
    a.click();
    URL.revokeObjectURL(url);
    
    // Also log to console for easy copy
    console.log('=== SHOOTING FORM IMAGES TO ADD ===');
    console.log(code);
    console.log('=== JSON DATA ===');
    console.log(JSON.stringify(jsonData, null, 2));
  }, [images]);
  
  // Stats
  const stats = {
    total: images.length,
    pending: images.filter(i => i.status === 'pending').length,
    approved: images.filter(i => i.status === 'approved').length,
    rejected: images.filter(i => i.status === 'rejected').length,
    inDatabase: images.filter(i => i.isFromDatabase).length,
    newUploads: images.filter(i => !i.isFromDatabase).length,
    newApproved: images.filter(i => i.status === 'approved' && !i.isFromDatabase).length
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/elite-shooters" className="text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-orange-400">Shooting Form Image Manager</h1>
                <p className="text-gray-400 text-sm">Review, approve, and manage shooting form images</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportApprovedImages}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Download size={18} />
                <span>Export Approved</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ImageIcon className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-gray-400 text-sm">Total Images</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Clock className="text-orange-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-gray-400 text-sm">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-gray-400 text-sm">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="text-red-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-gray-400 text-sm">Rejected</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* New Approved Images Alert */}
        {stats.newApproved > 0 && (
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-500/50 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-400" size={24} />
                <div>
                  <p className="font-bold text-green-400">
                    {stats.newApproved} New Image{stats.newApproved > 1 ? 's' : ''} Ready for Database
                  </p>
                  <p className="text-gray-400 text-sm">
                    Click &quot;Export Approved&quot; to download the code to add these images to player profiles
                  </p>
                </div>
              </div>
              <button
                onClick={exportApprovedImages}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Download size={18} />
                <span>Export Code</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Upload Section */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <Upload className="text-orange-400" />
            <span>Upload Images</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Player Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Assign to Player (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search player..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                />
                {playerSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-[#1a1a2e] border border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                    {filteredPlayers.map(player => (
                      <button
                        key={player.id}
                        onClick={() => {
                          setSelectedPlayer(player);
                          setPlayerSearch(player.name);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[#2a2a3e] transition-colors flex items-center space-x-2"
                      >
                        <span>{player.name}</span>
                        <span className="text-gray-500 text-sm">({player.team})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPlayer && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-green-400 text-sm">Selected: {selectedPlayer.name}</span>
                  <button onClick={() => { setSelectedPlayer(null); setPlayerSearch(''); }} className="text-red-400 hover:text-red-300">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Upload Methods */}
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Upload from Computer</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-500 text-black font-bold rounded-lg hover:from-orange-600 hover:to-orange-600 transition-all"
                >
                  <Upload size={20} />
                  <span>Select Files (Bulk Upload)</span>
                </button>
              </div>
              
              {/* URL Upload */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Upload from URL</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Paste image URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleUrlUpload}
                    disabled={!urlInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter & Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[#1a1a2e] rounded-lg p-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                    filterStatus === status 
                      ? 'bg-orange-500 text-black font-bold' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 w-64"
            />
          </div>
        </div>
        
        {/* Image Grid */}
        {filteredImages.length === 0 ? (
          <div className="bg-[#1a1a2e] rounded-xl p-12 border border-gray-700 text-center">
            <ImageIcon className="mx-auto text-gray-600 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Images Found</h3>
            <p className="text-gray-500">Upload some shooting form images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filteredImages.map(image => (
              <div 
                key={image.id}
                className={`bg-[#1a1a2e] rounded-xl overflow-hidden border-2 transition-all ${
                  image.status === 'approved' ? 'border-green-500' :
                  image.status === 'rejected' ? 'border-red-500' :
                  'border-gray-700 hover:border-orange-500'
                }`}
              >
                {/* Image Preview */}
                <div 
                  className="relative aspect-[4/3] cursor-pointer group"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image.url}
                    alt={image.playerName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold uppercase ${
                    image.status === 'approved' ? 'bg-green-500 text-white' :
                    image.status === 'rejected' ? 'bg-red-500 text-white' :
                    'bg-orange-500 text-black'
                  }`}>
                    {image.status}
                  </div>
                  {/* Database indicator */}
                  {image.isFromDatabase && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600 rounded text-xs font-bold text-white">
                      IN DATABASE
                    </div>
                  )}
                  {/* Crop indicator */}
                  {image.cropData && !image.isFromDatabase && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 rounded text-xs font-bold text-white">
                      CROPPED
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="text-white" size={32} />
                  </div>
                </div>
                
                {/* Image Info */}
                <div className="p-3">
                  <p className="font-bold truncate">{image.playerName}</p>
                  <p className="text-gray-500 text-xs">{new Date(image.uploadedAt).toLocaleDateString()}</p>
                  {/* Source URL - show for ALL images including database */}
                  {image.sourceUrl && (
                    <a 
                      href={image.sourceUrl.startsWith('Local') ? undefined : image.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs mt-1 block truncate ${
                        image.sourceUrl.startsWith('Local') 
                          ? 'text-gray-500' 
                          : 'text-blue-400 hover:text-blue-300 hover:underline'
                      }`}
                      title={image.sourceUrl}
                      onClick={(e) => {
                        if (image.sourceUrl?.startsWith('Local')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      📎 {image.sourceUrl.length > 40 ? image.sourceUrl.substring(0, 40) + '...' : image.sourceUrl}
                    </a>
                  )}
                </div>
                
                {/* Actions */}
                <div className="px-3 pb-3 flex items-center justify-between">
                  <div className="flex space-x-1">
                    {image.status !== 'approved' && (
                      <button
                        onClick={() => approveImage(image.id)}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    {image.status !== 'rejected' && (
                      <button
                        onClick={() => rejectImage(image.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    )}
                    {image.status !== 'pending' && (
                      <button
                        onClick={() => resetImage(image.id)}
                        className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                        title="Reset to Pending"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => { setSelectedImage(image); setShowCropModal(true); }}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="Crop"
                    >
                      <Crop size={16} />
                    </button>
                    <button
                      onClick={() => { setSelectedImage(image); setShowAssignModal(true); }}
                      className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      title="Assign to Player"
                    >
                      <Filter size={16} />
                    </button>
                    <button
                      onClick={() => deleteImage(image.id)}
                      className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Crop Modal */}
      {showCropModal && selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold">Crop Image - {selectedImage.playerName}</h3>
              <button onClick={() => { setShowCropModal(false); setCropStart(null); setCropEnd(null); }} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-400 mb-4">Click and drag to select the area you want to crop. Focus on the shooting form.</p>
              <div 
                className="relative bg-black rounded-lg overflow-hidden cursor-crosshair"
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
              >
                <img
                  ref={cropImageRef}
                  src={selectedImage.originalUrl || selectedImage.url}
                  alt={selectedImage.playerName}
                  className="max-w-full max-h-[60vh] mx-auto"
                />
                {/* Crop overlay */}
                {cropStart && cropEnd && (
                  <div
                    className="absolute border-2 border-orange-400 bg-orange-400/20"
                    style={{
                      left: `${Math.min(cropStart.x, cropEnd.x)}%`,
                      top: `${Math.min(cropStart.y, cropEnd.y)}%`,
                      width: `${Math.abs(cropEnd.x - cropStart.x)}%`,
                      height: `${Math.abs(cropEnd.y - cropStart.y)}%`
                    }}
                  />
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex items-center justify-between">
              <button
                onClick={resetCrop}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RotateCcw size={18} />
                <span>Reset Crop</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setShowCropModal(false); setCropStart(null); setCropEnd(null); }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyCrop}
                  disabled={!cropStart || !cropEnd || isCropLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isCropLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Cropping...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Apply Crop</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Assign to Player Modal */}
      {showAssignModal && selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] rounded-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold">Assign to Player</h3>
              <button onClick={() => { setShowAssignModal(false); setPlayerSearch(''); }} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Search player..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 mb-4"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredPlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => assignToPlayer(selectedImage.id, player)}
                    className="w-full px-4 py-3 text-left hover:bg-[#2a2a3e] rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold">{player.name}</p>
                      <p className="text-gray-500 text-sm">{player.team} • {player.league}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      player.tier === 'legendary' ? 'bg-orange-500 text-black' :
                      player.tier === 'elite' ? 'bg-purple-500 text-white' :
                      player.tier === 'great' ? 'bg-blue-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {player.tier}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Preview Modal */}
      {selectedImage && !showCropModal && !showAssignModal && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-orange-400 transition-colors"
            >
              <X size={32} />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.playerName}
              className="max-w-full max-h-[80vh] rounded-lg"
            />
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xl font-bold">{selectedImage.playerName}</p>
                  <p className="text-gray-400">Status: <span className={`font-bold ${
                  selectedImage.status === 'approved' ? 'text-green-400' :
                  selectedImage.status === 'rejected' ? 'text-red-400' :
                  'text-orange-400'
                }`}>{selectedImage.status.toUpperCase()}</span></p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => approveImage(selectedImage.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Check size={18} />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => rejectImage(selectedImage.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <X size={18} />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => setShowCropModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Crop size={18} />
                  <span>Crop</span>
                </button>
              </div>
              </div>
              {/* Source URL - Full display */}
              {selectedImage.sourceUrl && (
                <div className="mt-3 p-3 bg-[#1a1a2e] rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">📎 Source URL:</p>
                  {selectedImage.sourceUrl.startsWith('Local') ? (
                    <p className="text-gray-300 text-sm break-all">{selectedImage.sourceUrl}</p>
                  ) : (
                    <a 
                      href={selectedImage.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline text-sm break-all"
                    >
                      {selectedImage.sourceUrl}
                    </a>
                  )}
                </div>
              )}
              {selectedImage.isFromDatabase && (
                <div className="mt-3 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
                  <p className="text-purple-300 text-sm">✓ This image is already in the player database</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

