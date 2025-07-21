#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function analyzeDirectory(dirPath, basePath = dirPath) {
  const folderStats = {};
  const allFolders = new Set();
  
  async function scanDirectory(currentPath) {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      const relativeDirPath = path.relative(basePath, currentPath) || '.';
      
      // Track all folders, even empty ones
      allFolders.add(relativeDirPath);
      
      // Initialize folder stats if not exists
      if (!folderStats[relativeDirPath]) {
        folderStats[relativeDirPath] = { fileCount: 0, totalSize: 0, folderCount: 0 };
      }
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        
        if (item.isDirectory()) {
          // Count this as a subfolder
          folderStats[relativeDirPath].folderCount++;
          
          // Recursively scan subdirectory
          await scanDirectory(fullPath);
        } else if (item.isFile()) {
          try {
            const stats = await fs.stat(fullPath);
            
            // Add file to current folder stats
            folderStats[relativeDirPath].fileCount++;
            folderStats[relativeDirPath].totalSize += stats.size;
          } catch (statError) {
            console.warn(`Warning: Could not get stats for ${fullPath}: ${statError.message}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentPath}: ${error.message}`);
    }
  }
  
  await scanDirectory(dirPath);
  
  return { folderStats, allFolders };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  const targetDir = process.cwd();
  console.log(`Analyzing directory: ${targetDir}\n`);
  
  try {
    const { folderStats, allFolders } = await analyzeDirectory(targetDir);
    
    // Sort folders by path for better readability
    const sortedFolders = Array.from(allFolders).sort();
    
    console.log('Complete Folder Analysis Results:');
    console.log('='.repeat(100));
    console.log(String('Folder Path').padEnd(60) + String('Subfolders').padEnd(12) + String('Files').padEnd(8) + 'Size');
    console.log('-'.repeat(100));
    
    let totalFiles = 0;
    let totalSize = 0;
    let totalFolders = sortedFolders.length;
    
    for (const folder of sortedFolders) {
      const stats = folderStats[folder];
      const folderDisplay = folder === '.' ? '(root)' : folder;
      
      console.log(
        String(folderDisplay).padEnd(60) + 
        String(stats.folderCount).padEnd(12) + 
        String(stats.fileCount).padEnd(8) + 
        formatBytes(stats.totalSize)
      );
      
      totalFiles += stats.fileCount;
      totalSize += stats.totalSize;
    }
    
    console.log('-'.repeat(100));
    console.log(
      String('TOTALS').padEnd(60) + 
      String(totalFolders - 1).padEnd(12) + 
      String(totalFiles).padEnd(8) + 
      formatBytes(totalSize)
    );
    
    console.log(`\nDetailed Summary:`);
    console.log(`- Total folders (including root): ${totalFolders}`);
    console.log(`- Total subfolders: ${totalFolders - 1}`);
    console.log(`- Total files: ${totalFiles}`);
    console.log(`- Total size: ${formatBytes(totalSize)}`);
    console.log(`- Average files per folder: ${(totalFiles / totalFolders).toFixed(1)}`);
    console.log(`- Average folder size: ${formatBytes(totalSize / totalFolders)}`);
    
  } catch (error) {
    console.error('Error analyzing directory:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}