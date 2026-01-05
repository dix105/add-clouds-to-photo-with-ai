document.addEventListener('DOMContentLoaded', () => {
    
    /* =========================================
       VANTA BACKGROUND ANIMATION
       ========================================= */
    if (window.VANTA && window.VANTA.CLOUDS) {
        VANTA.CLOUDS({
            el: "#hero-vanta",
            mouseControls: true,
            touchControls: true,
            minHeight: 200.00,
            minWidth: 200.00,
            skyColor: 0x0ea5e9, // Primary
            cloudColor: 0xffffff,
            cloudShadowColor: 0xe0f2fe, // Secondary
            sunColor: 0xf43f5e, // Accent
            sunGlareColor: 0xf43f5e,
            sunlightColor: 0xf43f5e,
            speed: 0.8
        });
    }

    /* =========================================
       MOBILE MENU TOGGLE
       ========================================= */
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });
        
        // Close menu when clicking links
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    /* =========================================
       FAQ ACCORDION
       ========================================= */
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const item = button.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all others
            document.querySelectorAll('.faq-item').forEach(other => {
                other.classList.remove('active');
            });
            
            // Toggle current
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    /* =========================================
       MODALS
       ========================================= */
    const openModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    };
    
    const closeModal = (modal) => {
        modal.classList.remove('active');
    };
    
    document.querySelectorAll('[data-modal-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(link.getAttribute('data-modal-target'));
        });
    });
    
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    /* =========================================
       SCROLL ANIMATIONS
       ========================================= */
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .stagger-children').forEach(el => {
        observer.observe(el);
    });

    /* =========================================
       REAL API INTEGRATION LOGIC
       ========================================= */

    // --- CONFIGURATION ---
    const USER_ID = 'DObRu1vyStbUynoQmTcHBlhs55z2';
    const EFFECT_ID = 'cloudstophoto';
    const MODEL = 'image-effects';
    const TOOL_TYPE = 'image-effects';
    const POLL_INTERVAL = 2000;
    const MAX_POLLS = 60;

    // --- STATE ---
    let currentUploadedUrl = null;

    // --- DOM ELEMENTS ---
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    const previewImage = document.getElementById('preview-image');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultContainer = document.getElementById('result-container');
    const resultPlaceholder = document.getElementById('result-placeholder');
    const loadingState = document.getElementById('loading-state');
    const downloadBtn = document.getElementById('download-btn');

    // --- UTILITIES ---

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // UI Helpers
    function showLoading() {
        if (loadingState) loadingState.style.display = 'flex';
        loadingState.classList.remove('hidden'); // Ensure class compatibility
        if (resultContainer) resultContainer.classList.add('loading');
        if (resultPlaceholder) resultPlaceholder.classList.add('hidden');
        
        // Hide existing result if any
        const resultImg = document.getElementById('result-image');
        if (resultImg) resultImg.classList.add('hidden');
    }

    function hideLoading() {
        if (loadingState) loadingState.style.display = 'none';
        loadingState.classList.add('hidden');
        if (resultContainer) resultContainer.classList.remove('loading');
    }

    function updateStatus(text) {
        const statusText = document.querySelector('#loading-state p');
        if (statusText) statusText.textContent = text;
        
        if (generateBtn) {
            if (text.includes('PROCESSING') || text.includes('UPLOADING') || text.includes('SUBMITTING')) {
                generateBtn.disabled = true;
                generateBtn.textContent = text;
            } else if (text === 'READY') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Effect';
            } else if (text === 'COMPLETE') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Again';
            }
        }
    }

    function showError(msg) {
        alert('Error: ' + msg);
        hideLoading();
        updateStatus('READY');
        if (resetBtn) resetBtn.click();
    }

    function showPreview(url) {
        if (previewImage) {
            previewImage.src = url;
            previewImage.classList.remove('hidden');
            previewImage.style.display = 'block';
        }
        if (uploadPlaceholder) {
            uploadPlaceholder.classList.add('hidden');
        }
        if (uploadZone) {
            uploadZone.style.borderStyle = 'solid';
            uploadZone.style.borderColor = 'var(--primary)';
        }
    }

    function showResultMedia(url) {
        const resultImg = document.getElementById('result-image');
        if (!resultImg) return;

        // Hide placeholder
        if (resultPlaceholder) resultPlaceholder.classList.add('hidden');

        // Since this is an image effect, we mainly deal with images
        resultImg.src = url;
        resultImg.classList.remove('hidden');
        resultImg.style.display = 'block';
    }

    function showDownloadButton(url) {
        if (downloadBtn) {
            downloadBtn.dataset.url = url;
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('hidden'); // In case it was hidden
        }
    }

    // --- API FUNCTIONS ---

    // Upload file to CDN storage
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        const fileName = uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL
        const signedUrlResponse = await fetch(
            'https://api.chromastudio.ai/get-emd-upload-url?fileName=' + encodeURIComponent(fileName),
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        console.log('Got signed URL');
        
        // Step 2: PUT file
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        const downloadUrl = 'https://contents.maxstudio.ai/' + fileName;
        console.log('Uploaded to:', downloadUrl);
        return downloadUrl;
    }

    // Submit generation job
    async function submitImageGenJob(imageUrl) {
        const endpoint = 'https://api.chromastudio.ai/image-gen';
        
        const body = {
            model: MODEL,
            toolType: TOOL_TYPE,
            effectId: EFFECT_ID,
            imageUrl: imageUrl,
            userId: USER_ID,
            removeWatermark: true,
            isPrivate: true
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-mobile': '?0'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        console.log('Job submitted:', data.jobId, 'Status:', data.status);
        return data;
    }

    // Poll job status
    async function pollJobStatus(jobId) {
        const baseUrl = 'https://api.chromastudio.ai/image-gen';
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${USER_ID}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to check status: ' + response.statusText);
            }
            
            const data = await response.json();
            console.log('Poll', polls + 1, '- Status:', data.status);
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            updateStatus('PROCESSING... (' + (polls + 1) + ')');
            
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Job timed out after ' + MAX_POLLS + ' polls');
    }

    // --- EVENT HANDLERS ---

    // Handler when file is selected - uploads immediately
    async function handleFileSelect(file) {
        if (!file) return;

        try {
            showLoading();
            updateStatus('UPLOADING...');
            
            // Upload immediately
            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            // Show preview
            showPreview(uploadedUrl);
            
            updateStatus('READY');
            hideLoading();
            
            // Enable generate
            if (generateBtn) generateBtn.disabled = false;
            
        } catch (error) {
            hideLoading();
            updateStatus('ERROR');
            showError(error.message);
        }
    }

    // Handler when Generate button is clicked
    async function handleGenerate() {
        if (!currentUploadedUrl) return;
        
        try {
            showLoading();
            updateStatus('SUBMITTING JOB...');
            
            // Step 1: Submit job
            const jobData = await submitImageGenJob(currentUploadedUrl);
            
            updateStatus('JOB QUEUED...');
            
            // Step 2: Poll for completion
            const result = await pollJobStatus(jobData.jobId);
            
            // Step 3: Extract result URL
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            const resultUrl = resultItem?.mediaUrl || resultItem?.image || resultItem?.video;
            
            if (!resultUrl) {
                throw new Error('No image URL in response');
            }
            
            console.log('Result URL:', resultUrl);
            
            // Step 4: Display result
            showResultMedia(resultUrl);
            showDownloadButton(resultUrl);
            
            updateStatus('COMPLETE');
            hideLoading();
            
        } catch (error) {
            hideLoading();
            updateStatus('ERROR');
            showError(error.message);
        }
    }

    // --- WIRING ---

    // File Input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFileSelect(e.target.files[0]);
        });
    }

    // Drag & Drop
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.background = 'rgba(14, 165, 233, 0.1)';
        });
        
        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.style.background = 'rgba(255, 255, 255, 0.5)';
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.background = 'rgba(255, 255, 255, 0.5)';
            handleFileSelect(e.dataTransfer.files[0]);
        });
        
        uploadZone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Generate Button
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }

    // Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentUploadedUrl = null;
            
            // Reset Input
            if (fileInput) fileInput.value = '';
            
            // Reset Preview
            if (previewImage) {
                previewImage.src = '';
                previewImage.classList.add('hidden');
                previewImage.style.display = 'none';
            }
            
            // Reset Placeholders
            if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
            if (resultPlaceholder) resultPlaceholder.classList.remove('hidden');
            
            // Reset Result
            const resultImg = document.getElementById('result-image');
            if (resultImg) {
                resultImg.src = '';
                resultImg.classList.add('hidden');
                resultImg.style.display = 'none';
            }
            
            // Reset Buttons
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generate Effect';
            }
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.dataset.url = '';
            }
            
            // Reset Styles
            if (uploadZone) {
                uploadZone.style.borderStyle = 'dashed';
                uploadZone.style.borderColor = 'var(--border)';
            }
            
            hideLoading();
        });
    }

    // Download Button - Robust Strategy
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;
            
            function downloadBlob(blob, filename) {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            }
            
            function getExtension(url, contentType) {
                if (contentType) {
                    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
                    if (contentType.includes('png')) return 'png';
                }
                const match = url.match(/\.(jpe?g|png|webp)/i);
                return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
            }
            
            try {
                // STRATEGY 1: Proxy
                const proxyUrl = 'https://api.chromastudio.ai/download-proxy?url=' + encodeURIComponent(url);
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('Proxy failed');
                
                const blob = await response.blob();
                const ext = getExtension(url, response.headers.get('content-type'));
                downloadBlob(blob, 'cloud_effect_result_' + generateNanoId(8) + '.' + ext);
                
            } catch (proxyErr) {
                console.warn('Proxy failed, trying direct:', proxyErr.message);
                
                try {
                    // STRATEGY 2: Direct
                    const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                    const response = await fetch(fetchUrl, { mode: 'cors' });
                    if (response.ok) {
                        const blob = await response.blob();
                        const ext = getExtension(url, response.headers.get('content-type'));
                        downloadBlob(blob, 'cloud_effect_result_' + generateNanoId(8) + '.' + ext);
                        return;
                    }
                    throw new Error('Direct failed');
                } catch (fetchErr) {
                    // STRATEGY 3: Fallback Alert
                    alert('Download failed due to browser security restrictions. Please right-click the result image and select "Save Image As".');
                }
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }
        });
    }
});