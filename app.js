document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const btnEncode = document.getElementById('btn-encode');
    const btnDecode = document.getElementById('btn-decode');
    const secEncode = document.getElementById('section-encode');
    const secDecode = document.getElementById('section-decode');

    btnEncode.addEventListener('click', () => {
        btnEncode.classList.add('active');
        btnDecode.classList.remove('active');
        secEncode.classList.add('active-section');
        secDecode.classList.remove('active-section');
    });

    btnDecode.addEventListener('click', () => {
        btnDecode.classList.add('active');
        btnEncode.classList.remove('active');
        secDecode.classList.add('active-section');
        secEncode.classList.remove('active-section');
    });

    // --- ENCODE LOGIC ---
    const fileEncode = document.getElementById('file-encode');
    const previewEncode = document.getElementById('preview-encode');
    const canvasEncode = document.getElementById('canvas-encode');
    const ctxEncode = canvasEncode.getContext('2d');
    const statusEncode = document.getElementById('encode-status');
    const btnActionEncode = document.getElementById('action-encode');
    const downloadContainer = document.getElementById('download-container');
    const downloadLink = document.getElementById('download-link');

    let isImageLoadedEncode = false;

    fileEncode.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    canvasEncode.width = img.width;
                    canvasEncode.height = img.height;
                    ctxEncode.drawImage(img, 0, 0);
                    previewEncode.src = event.target.result;
                    previewEncode.style.display = 'block';
                    isImageLoadedEncode = true;
                    statusEncode.innerText = "IMAGE LOADED. AWAITING PAYLOAD & KEYS.";
                    statusEncode.style.color = 'var(--primary-color)';
                    btnActionEncode.disabled = false;
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    btnActionEncode.addEventListener('click', () => {
        if (!isImageLoadedEncode) return;

        const realMsg = document.getElementById('real-message').value;
        const realPwd = document.getElementById('real-password').value;
        const fakeMsg = document.getElementById('fake-message').value;
        const fakePwd = document.getElementById('fake-password').value;

        if (!realMsg || !realPwd || !fakeMsg || !fakePwd) {
            statusEncode.innerText = "[ERROR] ALL FIELDS MUST BE FILLED.";
            statusEncode.style.color = 'var(--error-color)';
            return;
        }

        try {
            statusEncode.innerText = "ENCRYPTING PAYLOADS...";
            statusEncode.style.color = 'var(--text-main)';

            // 1. Encrypt Data
            const encryptedReal = CryptoTools.encrypt(realMsg, realPwd);
            const encryptedFake = CryptoTools.encrypt(fakeMsg, fakePwd);

            // 2. Get ImageData
            let imageData = ctxEncode.getImageData(0, 0, canvasEncode.width, canvasEncode.height);

            // 3. Embed Real Message (Channel 0 = Red) using Real Seed
            const seedReal = CryptoTools.getSeed(realPwd);
            imageData = Steganography.embed(imageData, encryptedReal, seedReal, 0);

            // 4. Embed Fake Message (Channel 2 = Blue) using Fake Seed
            const seedFake = CryptoTools.getSeed(fakePwd);
            imageData = Steganography.embed(imageData, encryptedFake, seedFake, 2);

            // 5. Put Data Back
            ctxEncode.putImageData(imageData, 0, 0);

            statusEncode.innerText = "DATA EMBEDDED SECURELY. READY FOR EXTRACTION.";
            statusEncode.style.color = 'var(--primary-color)';

            // Prepare Download
            // We use PNG because JPEG compression destroys LSB steganography
            const dataUrl = canvasEncode.toDataURL('image/png');
            downloadLink.href = dataUrl;
            downloadContainer.style.display = 'block';

        } catch (err) {
            console.error(err);
            statusEncode.innerText = "[ERROR] " + err.message;
            statusEncode.style.color = 'var(--error-color)';
        }
    });

    // --- DECODE LOGIC ---
    const fileDecode = document.getElementById('file-decode');
    const previewDecode = document.getElementById('preview-decode');
    const canvasDecode = document.getElementById('canvas-decode');
    const ctxDecode = canvasDecode.getContext('2d', { willReadFrequently: true });
    const statusDecode = document.getElementById('decode-status');
    const btnActionDecode = document.getElementById('action-decode');
    const outputContainer = document.getElementById('output-container');
    const decryptedOutput = document.getElementById('decrypted-output');

    let isImageLoadedDecode = false;

    fileDecode.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    canvasDecode.width = img.width;
                    canvasDecode.height = img.height;
                    ctxDecode.drawImage(img, 0, 0);
                    previewDecode.src = event.target.result;
                    previewDecode.style.display = 'block';
                    isImageLoadedDecode = true;
                    statusDecode.innerText = "SECURE IMAGE LOADED. AWAITING KEY.";
                    statusDecode.style.color = 'var(--primary-color)';
                    btnActionDecode.disabled = false;
                    outputContainer.style.display = 'none';
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    // Typewriter effect for output
    function typeWriter(element, text, speed) {
        element.innerHTML = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    btnActionDecode.addEventListener('click', () => {
        if (!isImageLoadedDecode) return;

        const pwd = document.getElementById('decode-password').value;
        if (!pwd) {
            statusDecode.innerText = "[ERROR] KEY REQUIRED FOR DECRYPTION.";
            statusDecode.style.color = 'var(--error-color)';
            return;
        }

        statusDecode.innerText = "EXTRACTING & DECRYPTING...";
        statusDecode.style.color = 'var(--text-main)';
        outputContainer.style.display = 'none';

        try {
            const imageData = ctxDecode.getImageData(0, 0, canvasDecode.width, canvasDecode.height);
            const seed = CryptoTools.getSeed(pwd);

            // Attempt to extract from Red Channel (might be the real message)
            let rawDataR = Steganography.extract(imageData, seed, 0);
            let decryptedR = rawDataR ? CryptoTools.decrypt(rawDataR, pwd) : null;

            // Attempt to extract from Blue Channel (might be the fake message)
            let rawDataB = Steganography.extract(imageData, seed, 2);
            let decryptedB = rawDataB ? CryptoTools.decrypt(rawDataB, pwd) : null;

            if (decryptedR) {
                statusDecode.innerText = "DECRYPTION SUCCESSFUL.";
                statusDecode.style.color = 'var(--primary-color)';
                outputContainer.style.display = 'block';
                typeWriter(decryptedOutput, decryptedR, 20);
            } else if (decryptedB) {
                statusDecode.innerText = "DECRYPTION SUCCESSFUL.";
                statusDecode.style.color = 'var(--primary-color)';
                outputContainer.style.display = 'block';
                typeWriter(decryptedOutput, decryptedB, 20);
            } else {
                statusDecode.innerText = "[ACCESS DENIED] INVALID KEY OR NO MESSAGE FOUND.";
                statusDecode.style.color = 'var(--error-color)';
            }

        } catch (err) {
            console.error(err);
            statusDecode.innerText = "[ERROR] EXTRACTION FAILED.";
            statusDecode.style.color = 'var(--error-color)';
        }
    });

    // Setup drag and drop for both zones
    function setupDragAndDrop(zoneId, fileInputId) {
        const zone = document.getElementById(zoneId);
        const fileInput = document.getElementById(fileInputId);

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                // Trigger change event manually
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            }
        });
    }

    setupDragAndDrop('upload-zone-encode', 'file-encode');
    setupDragAndDrop('upload-zone-decode', 'file-decode');
});
