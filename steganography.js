const Steganography = {
    // Convert string to array of bits (1s and 0s)
    textToBits: function(text) {
        // We first prepend a 32-bit integer indicating the length of the text in bytes
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);
        const length = bytes.length;
        
        let bits = [];
        
        // 32 bits for length
        for (let i = 31; i >= 0; i--) {
            bits.push((length >> i) & 1);
        }
        
        // Bits for actual data
        for (let i = 0; i < bytes.length; i++) {
            for (let j = 7; j >= 0; j--) {
                bits.push((bytes[i] >> j) & 1);
            }
        }
        return bits;
    },

    // Convert array of bits back to text
    bitsToText: function(bits) {
        if (bits.length < 32) return null;
        
        let length = 0;
        for (let i = 0; i < 32; i++) {
            length = (length << 1) | bits[i];
        }
        
        // Prevent huge allocations if length is garbage
        if (length < 0 || length > 10000000) return null;
        
        if (bits.length < 32 + length * 8) return null;
        
        const bytes = new Uint8Array(length);
        let bitIndex = 32;
        for (let i = 0; i < length; i++) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                byte = (byte << 1) | bits[bitIndex++];
            }
            bytes[i] = byte;
        }
        
        try {
            const decoder = new TextDecoder('utf-8', { fatal: true });
            return decoder.decode(bytes);
        } catch (e) {
            return null; // Not valid UTF-8
        }
    },

    // Get an array of shuffled pixel indices based on a seed
    // We only select pixels where we can hide data. 
    // Total pixels = imageData.width * imageData.height
    getPixelSequence: function(totalPixels, seed, count) {
        const prng = new CryptoTools.PRNG(seed);
        // Instead of full shuffle (slow for large images), we randomly pick distinct indices
        // For efficiency in JS, we use a Set to ensure distinct indices
        const indices = new Set();
        // Fallback to sequential if image is too small
        if (count > totalPixels) {
            throw new Error("Image too small to hold this payload.");
        }
        
        while (indices.size < count) {
            indices.add(prng.nextInt(0, totalPixels - 1));
        }
        
        return Array.from(indices);
    },

    // Embed text into image data
    // channel: 0=R, 1=G, 2=B
    embed: function(imageData, text, seed, channel) {
        const bits = this.textToBits(text);
        const totalPixels = imageData.width * imageData.height;
        
        if (bits.length > totalPixels) {
            throw new Error("Payload too large for this image. Need a bigger image.");
        }
        
        const sequence = this.getPixelSequence(totalPixels, seed, bits.length);
        
        for (let i = 0; i < bits.length; i++) {
            const pixelIndex = sequence[i];
            const dataIndex = (pixelIndex * 4) + channel;
            
            // Clear the LSB and set it to our bit
            const bit = bits[i];
            imageData.data[dataIndex] = (imageData.data[dataIndex] & 0xFE) | bit;
        }
        
        return imageData;
    },

    // Extract text from image data
    extract: function(imageData, seed, channel) {
        const totalPixels = imageData.width * imageData.height;
        
        // First we just need the 32-bit length header
        let lengthSequence;
        try {
            lengthSequence = this.getPixelSequence(totalPixels, seed, 32);
        } catch (e) {
            return null;
        }
        
        const headerBits = [];
        for (let i = 0; i < 32; i++) {
            const pixelIndex = lengthSequence[i];
            const dataIndex = (pixelIndex * 4) + channel;
            headerBits.push(imageData.data[dataIndex] & 1);
        }
        
        let length = 0;
        for (let i = 0; i < 32; i++) {
            length = (length << 1) | headerBits[i];
        }
        
        // Validate length
        if (length <= 0 || length > 10000000 || (32 + length * 8) > totalPixels) {
            return null;
        }
        
        // Now get the full sequence
        const totalBits = 32 + length * 8;
        const sequence = this.getPixelSequence(totalPixels, seed, totalBits);
        
        const allBits = [];
        for (let i = 0; i < totalBits; i++) {
            const pixelIndex = sequence[i];
            const dataIndex = (pixelIndex * 4) + channel;
            allBits.push(imageData.data[dataIndex] & 1);
        }
        
        return this.bitsToText(allBits);
    }
};
