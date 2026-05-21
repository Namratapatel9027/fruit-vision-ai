document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION ---
    // You will replace this URL after creating your API Gateway
    const API_URL = "https://fcyjzmmptl.execute-api.ap-south-1.amazonaws.com/prod/predict";

    // Scroll Animations (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.animate-on-scroll');
    hiddenElements.forEach((el) => observer.observe(el));

    // DOM Elements
    const uploadSection = document.getElementById('upload-section');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');

    const analysisSection = document.getElementById('analysis-section');
    const imagePreview = document.getElementById('image-preview');
    const scanner = document.getElementById('scanner');
    const scanningText = document.getElementById('scanning-text');

    const resultContainer = document.getElementById('result-container');
    const fruitNameEl = document.getElementById('fruit-name');
    const confidenceScoreEl = document.getElementById('confidence-score');
    const confidenceFill = document.getElementById('confidence-fill');

    const resetBtn = document.getElementById('reset-btn');

    // --- 2. FILE UPLOAD HANDLING ---

    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });

    uploadSection.addEventListener('dragleave', () => {
        uploadSection.classList.remove('dragover');
    });

    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // --- 3. PRODUCTION INFERENCE LOGIC ---

    function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('Please upload an image file (JPEG, PNG, WEBP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            uploadSection.classList.remove('active');
            analysisSection.classList.add('active');

            // Get the base64 string (removing the metadata header)
            const base64Image = e.target.result.split(',')[1];

            startAnalysis(base64Image);
        };
        reader.readAsDataURL(file);
    }

    async function startAnalysis(base64Image) {
        // Reset previous results
        resultContainer.classList.remove('visible');
        resultContainer.classList.add('hidden');
        confidenceFill.style.width = '0%';

        // Show scanner
        scanner.style.display = 'block';
        scanningText.style.display = 'block';
        scanningText.textContent = "Uploading to AWS...";

        try {
            // THE REAL API CALL
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            finishAnalysis(data.class, data.confidence);

        } catch (error) {
            console.error(error);
            alert("Error: Could not connect to the AI brain. Make sure the API is live.");
            resetBtn.click();
        }
    }

    function finishAnalysis(fruit, confidence) {
        // Hide scanner
        scanner.style.display = 'none';
        scanningText.style.display = 'none';

        const confidencePercent = (confidence * 100).toFixed(1);

        // Update UI
        fruitNameEl.textContent = fruit;
        confidenceScoreEl.textContent = `${confidencePercent}%`;

        // Show results
        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('visible');

        setTimeout(() => {
            confidenceFill.style.width = `${confidencePercent}%`;
        }, 100);
    }

    // --- 4. RESET HANDLING ---
    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        analysisSection.classList.remove('active');
        resultContainer.classList.remove('visible');
        resultContainer.classList.add('hidden');
        uploadSection.classList.add('active');
    });
});