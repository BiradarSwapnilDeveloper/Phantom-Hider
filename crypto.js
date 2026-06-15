const CryptoTools = {
    // Encrypt text using AES-256
    encrypt: function(text, password) {
        // Add a magic prefix to verify successful decryption
        const payload = "PHANTOM::" + text;
        return CryptoJS.AES.encrypt(payload, password).toString();
    },

    // Decrypt text using AES-256
    decrypt: function(encryptedText, password) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted.startsWith("PHANTOM::")) {
                return decrypted.substring(9);
            }
            return null; // Decryption succeeded but magic prefix missing
        } catch (e) {
            return null; // Decryption failed (wrong password)
        }
    },

    // Generate a 32-bit integer seed from a password
    getSeed: function(password) {
        const hash = CryptoJS.SHA256(password).toString();
        // Convert first 8 hex chars to integer
        return parseInt(hash.substring(0, 8), 16);
    },
    
    // Seeded PRNG (Mulberry32)
    PRNG: class {
        constructor(seed) {
            this.a = seed;
        }
        next() {
            let t = this.a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
        
        // Get random integer between min and max (inclusive)
        nextInt(min, max) {
            return Math.floor(this.next() * (max - min + 1)) + min;
        }
    }
};
