# 🕵️‍♂️ PhantomHide - Secure Steganography

PhantomHide is a military-grade, CBI/FBI level steganography web application designed to securely hide classified messages within images. Built with an emphasis on Plausible Deniability, it uses a dual-lock system and AES-256 encryption to keep your data truly safe.

## 🌟 Key Features

- **Plausible Deniability (Dual-Lock):** Allows you to set a decoy message and a real message using two different passwords. If forced to decrypt the image, you can provide the decoy password to reveal a harmless message, keeping the real message hidden.
- **AES-256 Encryption:** Your hidden messages are strongly encrypted using CryptoJS before being embedded into the image.
- **Scattered LSB Encoding:** Data is pseudorandomly scattered across image pixels using a seeded PRNG, avoiding standard steganalysis detection which looks for sequential data.
- **100% Client-Side (No Backend):** Runs entirely locally in your browser with zero server interactions, ensuring that your images and passwords never leave your computer.
- **Premium UI/UX:** High-tech, engaging cyber/hacker theme with a responsive glassmorphism design, terminal-typing effects, and smooth animations.

## 🚀 Usage Guide

### 1. Encode Data (Hide Message)
- Open `index.html` in your browser.
- Upload an image (PNG or BMP format only. *Note: JPEG compression destroys hidden data.*)
- Enter your **Secret Message** and your **Real Password**.
- Enter your **Decoy Message** (e.g., "Grocery list") and your **Duress Password**.
- Click **Embed Data** and download the resulting secure image.

### 2. Decode Data (Extract Message)
- Navigate to the **Decode** tab.
- Upload the secure image you generated.
- Enter the **Duress Password** to reveal the decoy message, satisfying any attacker.
- Or, enter the **Real Password** to safely decrypt and reveal your highly classified message.

## ⚙️ Deployment

This project consists of pure static files (HTML, CSS, JS) and requires no server to run. It can be easily deployed to any static hosting provider such as Render, Vercel, Netlify, or GitHub Pages. 

A `render.yaml` blueprint is included to easily deploy the project on Render as a Static Site.

## 🛠 Built With
- Vanilla HTML, CSS, JavaScript
- CryptoJS (AES-256 Encryption)
