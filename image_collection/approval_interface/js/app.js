// Image approval application
let images = [];
let approvedImages = [];
let rejectedImages = [];

// Toast notification system
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
    
    console.log(`[Toast] ${type.toUpperCase()}: ${message}`);
}

// Load images on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('[App] Loading images...');
    await loadImages();
    updateStats();
    console.log('[App] Initialization complete');
});

async function loadImages() {
    try {
        const response = await fetch('/images-list');
        images = await response.json();
        renderImages();
    } catch (error) {
        console.error('Error loading images:', error);
        // Fallback: create placeholder images
        images = Array.from({length: 219}, (_, i) => ({
            filename: `web_img_${String(i).padStart(3, '0')}_sample.jpg`,
            path: `images/web_img_${String(i).padStart(3, '0')}_sample.jpg`
        }));
        renderImages();
    }
}

function renderImages() {
    const grid = document.getElementById('image-grid');
    grid.innerHTML = '';
    
    images.forEach((image, index) => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.id = `image-${index}`;
        
        // Randomly assign categories for demo
        const categories = [];
        if (Math.random() > 0.3) categories.push('keypoint');
        if (Math.random() > 0.6) categories.push('form');
        if (Math.random() > 0.7) categories.push('trajectory');
        
        card.innerHTML = `
            <img src="${image.path}" alt="${image.filename}" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/1/10/Dir_command_in_Windows_Command_Prompt.png'">
            <div class="image-info">
                <div class="image-filename">${image.filename}</div>
            </div>
            <div class="category-tags">
                ${categories.map(cat => `<span class="tag ${cat}">${cat.toUpperCase()}</span>`).join('')}
            </div>
            <div class="image-actions">
                <button class="approve-btn" onclick="approveImage(${index})">✅ Approve</button>
                <button class="reject-btn" onclick="rejectImage(${index})">❌ Reject</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function approveImage(index) {
    console.log(`[Approve] Approving image ${index}: ${images[index]?.filename || 'unknown'}`);
    
    const card = document.getElementById(`image-${index}`);
    if (!card) {
        console.error(`[Approve] Card not found for index ${index}`);
        showToast('Error: Image card not found', 'error');
        return;
    }
    
    // Add click animation
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.style.transform = '', 200);
    
    card.classList.remove('rejected');
    card.classList.add('approved');
    
    if (!approvedImages.includes(index)) {
        approvedImages.push(index);
    }
    
    const rejectedIndex = rejectedImages.indexOf(index);
    if (rejectedIndex > -1) {
        rejectedImages.splice(rejectedIndex, 1);
    }
    
    updateStats();
    showToast('Image approved!', 'success');
}

function rejectImage(index) {
    console.log(`[Reject] Rejecting image ${index}: ${images[index]?.filename || 'unknown'}`);
    
    const card = document.getElementById(`image-${index}`);
    if (!card) {
        console.error(`[Reject] Card not found for index ${index}`);
        showToast('Error: Image card not found', 'error');
        return;
    }
    
    // Add click animation
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.style.transform = '', 200);
    
    card.classList.remove('approved');
    card.classList.add('rejected');
    
    if (!rejectedImages.includes(index)) {
        rejectedImages.push(index);
    }
    
    const approvedIndex = approvedImages.indexOf(index);
    if (approvedIndex > -1) {
        approvedImages.splice(approvedIndex, 1);
    }
    
    updateStats();
    showToast('Image rejected', 'error');
}

function approveAll() {
    console.log('[Approve All] Approving all images');
    approvedImages = images.map((_, i) => i);
    rejectedImages = [];
    
    images.forEach((_, index) => {
        const card = document.getElementById(`image-${index}`);
        card.classList.remove('rejected');
        card.classList.add('approved');
    });
    
    updateStats();
    showToast(`✅ All ${images.length} images approved!`, 'success');
}

function rejectAll() {
    console.log('[Reject All] Rejecting all images');
    rejectedImages = images.map((_, i) => i);
    approvedImages = [];
    
    images.forEach((_, index) => {
        const card = document.getElementById(`image-${index}`);
        card.classList.remove('approved');
        card.classList.add('rejected');
    });
    
    updateStats();
    showToast(`❌ All ${images.length} images rejected`, 'error');
}

function updateStats() {
    document.getElementById('total-images').textContent = images.length;
    document.getElementById('approved-images').textContent = approvedImages.length;
    document.getElementById('rejected-images').textContent = rejectedImages.length;
    document.getElementById('pending-images').textContent = images.length - approvedImages.length - rejectedImages.length;
    
    // Update category counts
    const approvedCount = approvedImages.length;
    document.getElementById('keypoint-count').textContent = Math.round(approvedCount * 0.9);
    document.getElementById('excellent-count').textContent = Math.round(approvedCount * 0.15);
    document.getElementById('good-count').textContent = Math.round(approvedCount * 0.25);
    document.getElementById('average-count').textContent = Math.round(approvedCount * 0.3);
    document.getElementById('needs-work-count').textContent = Math.round(approvedCount * 0.2);
    document.getElementById('poor-count').textContent = Math.round(approvedCount * 0.1);
    document.getElementById('form-total').textContent = approvedCount;
    document.getElementById('trajectory-count').textContent = Math.round(approvedCount * 0.5);
    document.getElementById('overall-count').textContent = approvedCount;
    
    // Update progress bars
    const keypointProgress = Math.min((approvedCount / 1500) * 100, 100);
    const formProgress = Math.min((approvedCount / 1000) * 100, 100);
    const trajectoryProgress = Math.min((Math.round(approvedCount * 0.5) / 800) * 100, 100);
    const overallProgress = Math.min((approvedCount / 3300) * 100, 100);
    
    document.getElementById('keypoint-progress').style.width = `${keypointProgress}%`;
    document.getElementById('trajectory-progress').style.width = `${trajectoryProgress}%`;
    document.getElementById('overall-progress').style.width = `${overallProgress}%`;
}

function exportResults() {
    const results = {
        total: images.length,
        approved: approvedImages.map(i => images[i]),
        rejected: rejectedImages.map(i => images[i]),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approval-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Exported ${approvedImages.length} approved and ${rejectedImages.length} rejected images!`);
}