// Basketball Image Approval Interface
// Main JavaScript application

class ApprovalInterface {
    constructor() {
        this.images = [];
        this.filteredImages = [];
        this.selectedImages = new Set();
        this.currentBatch = 'all';
        this.currentSource = 'all';
        this.currentSort = 'score-high';
        this.approvalStatus = {}; // Track approval status
        
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateDashboard();
        this.renderImages();
    }
    
    async loadData() {
        try {
            // Load collection metadata
            const response = await fetch('../metadata/collection_metadata.json');
            if (!response.ok) {
                throw new Error('Failed to load metadata');
            }
            const data = await response.json();
            
            // Filter for accepted images only
            this.images = data.images.filter(img => 
                img.vision_ai_verdict === 'ACCEPT'
            );
            
            // Load existing approval status from localStorage
            const savedStatus = localStorage.getItem('approvalStatus');
            if (savedStatus) {
                this.approvalStatus = JSON.parse(savedStatus);
            }
            
            // Apply saved status to images
            this.images.forEach(img => {
                if (this.approvalStatus[img.filename]) {
                    img.user_approved = this.approvalStatus[img.filename];
                }
            });
            
            this.filteredImages = [...this.images];
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load images. Make sure you have run the collector and filter scripts.');
        }
    }
    
    setupEventListeners() {
        // Controls
        document.getElementById('batch-select').addEventListener('change', (e) => {
            this.currentBatch = e.target.value;
            this.filterAndSort();
        });
        
        document.getElementById('source-filter').addEventListener('change', (e) => {
            this.currentSource = e.target.value;
            this.filterAndSort();
        });
        
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.filterAndSort();
        });
        
        document.getElementById('refresh-btn').addEventListener('click', () => {
            location.reload();
        });
        
        document.getElementById('save-progress-btn').addEventListener('click', () => {
            this.saveProgress();
        });
        
        // Modal
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('modal-approve').addEventListener('click', () => {
            this.approveCurrentImage();
        });
        
        document.getElementById('modal-reject').addEventListener('click', () => {
            this.rejectCurrentImage();
        });
        
        // Bulk actions
        document.getElementById('bulk-deselect').addEventListener('click', () => {
            this.deselectAll();
        });
        
        document.getElementById('bulk-approve').addEventListener('click', () => {
            this.bulkApprove();
        });
        
        document.getElementById('bulk-reject').addEventListener('click', () => {
            this.bulkReject();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.currentImageFilename) {
                if (e.key === 'ArrowRight' || e.key === 'a') {
                    this.approveCurrentImage();
                } else if (e.key === 'ArrowLeft' || e.key === 'r') {
                    this.rejectCurrentImage();
                } else if (e.key === 'Escape') {
                    this.closeModal();
                }
            }
        });
        
        // Click outside modal to close
        document.getElementById('image-modal').addEventListener('click', (e) => {
            if (e.target.id === 'image-modal') {
                this.closeModal();
            }
        });
    }
    
    filterAndSort() {
        // Filter by source
        this.filteredImages = this.images.filter(img => {
            if (this.currentSource !== 'all' && img.source !== this.currentSource) {
                return false;
            }
            return true;
        });
        
        // Sort
        this.filteredImages.sort((a, b) => {
            switch (this.currentSort) {
                case 'score-high':
                    return (b.vision_ai_score || 0) - (a.vision_ai_score || 0);
                case 'score-low':
                    return (a.vision_ai_score || 0) - (b.vision_ai_score || 0);
                case 'source':
                    return a.source.localeCompare(b.source);
                case 'date':
                    return new Date(a.collected_at) - new Date(b.collected_at);
                default:
                    return 0;
            }
        });
        
        this.renderImages();
    }
    
    renderImages() {
        const grid = document.getElementById('image-grid');
        grid.innerHTML = '';
        
        if (this.filteredImages.length === 0) {
            grid.innerHTML = '<div class="loading"><p>No images to display. Run the collector and filter scripts first.</p></div>';
            return;
        }
        
        this.filteredImages.forEach(img => {
            const card = this.createImageCard(img);
            grid.appendChild(card);
        });
    }
    
    createImageCard(img) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        // Add status classes
        if (img.user_approved === true) {
            card.classList.add('approved');
        } else if (img.user_approved === false) {
            card.classList.add('rejected');
        }
        
        if (this.selectedImages.has(img.filename)) {
            card.classList.add('selected');
        }
        
        const score = img.vision_ai_score || 0;
        const scoreClass = score >= 90 ? 'score-excellent' :
                          score >= 70 ? 'score-good' :
                          score >= 50 ? 'score-fair' : 'score-poor';
        
        card.innerHTML = `
            <div class="checkbox-overlay">✓</div>
            ${img.user_approved === true ? '<div class="status-badge" style="background: #28a745; color: white;">✓ Approved</div>' : ''}
            ${img.user_approved === false ? '<div class="status-badge" style="background: #dc3545; color: white;">✗ Rejected</div>' : ''}
            <div class="image-wrapper">
                <img src="../filtered_images/${img.filename}" alt="Basketball shot" loading="lazy">
            </div>
            <div class="image-info">
                <div class="image-score">
                    <span class="score-badge ${scoreClass}">${score}</span>
                    <span class="image-source">${img.source}</span>
                </div>
                <div class="image-actions">
                    <button class="btn btn-reject" data-action="reject" data-filename="${img.filename}">✗</button>
                    <button class="btn btn-approve" data-action="approve" data-filename="${img.filename}">✓</button>
                </div>
            </div>
        `;
        
        // Click on card to open modal
        card.addEventListener('click', (e) => {
            // Check if clicked on action button
            if (e.target.dataset.action) {
                e.stopPropagation();
                const action = e.target.dataset.action;
                const filename = e.target.dataset.filename;
                if (action === 'approve') {
                    this.approveImage(filename);
                } else if (action === 'reject') {
                    this.rejectImage(filename);
                }
                return;
            }
            
            // Check if shift key is pressed for multi-select
            if (e.shiftKey) {
                this.toggleSelection(img.filename);
                this.updateBulkActionsBar();
                return;
            }
            
            this.openModal(img);
        });
        
        return card;
    }
    
    openModal(img) {
        this.currentImageFilename = img.filename;
        
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-img');
        const scoreFill = document.getElementById('modal-score-fill');
        const scoreText = document.getElementById('modal-score-text');
        
        modalImg.src = `../filtered_images/${img.filename}`;
        
        // Score
        const score = img.vision_ai_score || 0;
        scoreFill.style.width = `${score}%`;
        scoreFill.style.background = score >= 90 ? '#28a745' :
                                     score >= 70 ? '#17a2b8' :
                                     score >= 50 ? '#ffc107' : '#dc3545';
        scoreText.textContent = score;
        
        // Details
        document.getElementById('modal-source').textContent = img.source;
        document.getElementById('modal-filename').textContent = img.filename;
        document.getElementById('modal-date').textContent = new Date(img.collected_at).toLocaleString();
        
        // Quality checks
        const details = img.vision_ai_details || {};
        document.getElementById('check-basketball').textContent = details.basketball_visible ? '✅' : '❌';
        document.getElementById('check-form').textContent = details.shooting_form_visible ? '✅' : '❌';
        document.getElementById('check-body').textContent = details.full_body_visible ? '✅' : '❌';
        document.getElementById('check-quality').textContent = details.image_quality === 'excellent' || details.image_quality === 'good' ? '✅' : '❌';
        
        // Reason
        document.getElementById('modal-reason').textContent = details.reason || 'No reason provided';
        
        modal.classList.add('active');
    }
    
    closeModal() {
        document.getElementById('image-modal').classList.remove('active');
        this.currentImageFilename = null;
    }
    
    approveImage(filename) {
        const img = this.images.find(i => i.filename === filename);
        if (img) {
            img.user_approved = true;
            this.approvalStatus[filename] = true;
            this.updateDashboard();
            this.renderImages();
            this.saveProgress();
        }
    }
    
    rejectImage(filename) {
        const img = this.images.find(i => i.filename === filename);
        if (img) {
            img.user_approved = false;
            this.approvalStatus[filename] = false;
            this.updateDashboard();
            this.renderImages();
            this.saveProgress();
        }
    }
    
    approveCurrentImage() {
        if (this.currentImageFilename) {
            this.approveImage(this.currentImageFilename);
            this.closeModal();
        }
    }
    
    rejectCurrentImage() {
        if (this.currentImageFilename) {
            this.rejectImage(this.currentImageFilename);
            this.closeModal();
        }
    }
    
    toggleSelection(filename) {
        if (this.selectedImages.has(filename)) {
            this.selectedImages.delete(filename);
        } else {
            this.selectedImages.add(filename);
        }
    }
    
    deselectAll() {
        this.selectedImages.clear();
        this.updateBulkActionsBar();
        this.renderImages();
    }
    
    bulkApprove() {
        this.selectedImages.forEach(filename => {
            this.approveImage(filename);
        });
        this.deselectAll();
    }
    
    bulkReject() {
        this.selectedImages.forEach(filename => {
            this.rejectImage(filename);
        });
        this.deselectAll();
    }
    
    updateBulkActionsBar() {
        const bar = document.getElementById('bulk-actions-bar');
        const count = document.getElementById('selected-count');
        
        if (this.selectedImages.size > 0) {
            bar.style.display = 'flex';
            count.textContent = this.selectedImages.size;
        } else {
            bar.style.display = 'none';
        }
    }
    
    updateDashboard() {
        const approved = this.images.filter(img => img.user_approved === true).length;
        const rejected = this.images.filter(img => img.user_approved === false).length;
        const pending = this.images.length - approved - rejected;
        
        document.getElementById('target-images').textContent = '1,500';
        document.getElementById('collected-images').textContent = this.images.length;
        document.getElementById('filtered-images').textContent = this.images.length;
        document.getElementById('approved-images').textContent = approved;
        document.getElementById('pending-images').textContent = pending;
        
        // Progress bar
        const progressPct = (approved / 1500) * 100;
        document.getElementById('progress-fill').style.width = `${progressPct}%`;
        document.getElementById('progress-percentage').textContent = `${progressPct.toFixed(1)}%`;
        document.getElementById('progress-text').textContent = `${approved} / 1,500 images approved`;
        
        // Estimated time
        const remainingImages = 1500 - approved;
        const minutesRemaining = Math.ceil(remainingImages * 10 / 60); // 10 seconds per image
        document.getElementById('time-remaining').textContent = `Estimated time: ${minutesRemaining} minutes`;
    }
    
    saveProgress() {
        // Save to localStorage
        localStorage.setItem('approvalStatus', JSON.stringify(this.approvalStatus));
        
        // Update metadata file (would need backend endpoint)
        console.log('Progress saved to localStorage');
        
        // Show confirmation
        alert('✅ Progress saved!');
    }
    
    showError(message) {
        const grid = document.getElementById('image-grid');
        grid.innerHTML = `
            <div class="loading">
                <p style="color: #dc3545; font-weight: bold;">❌ ${message}</p>
                <p>Please run:</p>
                <ol style="text-align: left; display: inline-block;">
                    <li>python setup_api_keys.py</li>
                    <li>python multi_source_collector.py</li>
                    <li>python vision_ai_filter.py</li>
                </ol>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ApprovalInterface();
});
