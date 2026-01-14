const fs = require('fs');
const path = require('path');
const config = require('../config');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getUploadPath(type) {
  const dirMap = {
    'id': config.UPLOAD_DIR.IDS,
    'package': config.UPLOAD_DIR.PACKAGE_PHOTOS,
    'traveller': config.UPLOAD_DIR.TRAVELLER_PHOTOS,
    'ads': config.UPLOAD_DIR.ADS
  };
  
  const dir = dirMap[type] || config.UPLOAD_DIR.PACKAGE_PHOTOS;
  const fullPath = path.join(__dirname, '..', dir);
  ensureDirectoryExists(fullPath);
  return fullPath;
}

function generateFileName(originalName, prefix = '') {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${baseName}_${timestamp}_${random}${ext}`;
}

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

module.exports = {
  ensureDirectoryExists,
  getUploadPath,
  generateFileName,
  deleteFile
};











