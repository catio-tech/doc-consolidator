#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Configuration
const MIN_FILE_SIZE = 20 * 1024; // 20KB minimum
const OUTPUT_DIR = 'output';

function cleanFolderName(folderName) {
  // Remove hash keys (space + 32 alphanumeric characters at end)
  const cleaned = folderName.replace(/\s+[a-f0-9]{32}$/i, '');
  
  // Replace spaces and special chars with underscores, but preserve emojis
  return cleaned
    .replace(/[^\w\s\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, '_')
    .trim();
}

function generateFileName(folderPath, index) {
  const parts = folderPath.split('/').filter(part => part !== '.');
  const cleanedParts = parts.map(cleanFolderName);
  
  const paddedIndex = String(index).padStart(2, '0');
  
  if (cleanedParts.length === 0) {
    return `${paddedIndex}-Root.pdf`;
  } else if (cleanedParts.length === 1) {
    return `${paddedIndex}-${cleanedParts[0]}.pdf`;
  } else {
    // For nested folders: Parent-Child format
    const parent = cleanedParts[cleanedParts.length - 2];
    const child = cleanedParts[cleanedParts.length - 1];
    return `${paddedIndex}-${parent}-${child}.pdf`;
  }
}

async function getValidPDFs(folderPath) {
  try {
    const items = await fs.readdir(folderPath, { withFileTypes: true });
    const validPDFs = [];
    
    for (const item of items) {
      if (item.isFile() && item.name.toLowerCase().endsWith('.pdf')) {
        const fullPath = path.join(folderPath, item.name);
        try {
          const stats = await fs.stat(fullPath);
          
          if (stats.size >= MIN_FILE_SIZE) {
            validPDFs.push({
              name: item.name,
              path: fullPath,
              size: stats.size
            });
          } else {
            console.log(`  Skipping small file: ${item.name} (${formatBytes(stats.size)})`);
          }
        } catch (error) {
          console.warn(`  Warning: Could not stat ${item.name}: ${error.message}`);
        }
      }
    }
    
    // Sort alphabetically for consistent ordering
    validPDFs.sort((a, b) => a.name.localeCompare(b.name));
    return validPDFs;
    
  } catch (error) {
    console.error(`Error reading folder ${folderPath}: ${error.message}`);
    return [];
  }
}

async function mergePDFs(pdfFiles, outputPath) {
  if (pdfFiles.length === 0) {
    console.log(`  No PDFs to merge`);
    return false;
  }
  
  if (pdfFiles.length === 1) {
    // If only one PDF, just copy it
    try {
      await fs.copyFile(pdfFiles[0].path, outputPath);
      console.log(`  Copied single PDF: ${pdfFiles[0].name}`);
      return true;
    } catch (error) {
      console.error(`  Error copying single PDF: ${error.message}`);
      return false;
    }
  }
  
  // Merge multiple PDFs
  try {
    const mergedPdf = await PDFDocument.create();
    
    for (const pdfFile of pdfFiles) {
      try {
        console.log(`  Adding: ${pdfFile.name} (${formatBytes(pdfFile.size)})`);
        
        const pdfBytes = await fs.readFile(pdfFile.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        pages.forEach((page) => mergedPdf.addPage(page));
        
      } catch (error) {
        console.warn(`  Warning: Could not process ${pdfFile.name}: ${error.message}`);
        continue;
      }
    }
    
    const pdfBytes = await mergedPdf.save();
    await fs.writeFile(outputPath, pdfBytes);
    
    console.log(`  Created merged PDF with ${mergedPdf.getPageCount()} pages`);
    return true;
    
  } catch (error) {
    console.error(`  Error merging PDFs: ${error.message}`);
    return false;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function scanFolders(basePath) {
  const folders = [];
  
  async function scan(currentPath, relativePath = '.') {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      // Check if current folder has PDFs
      const hasDirectPDFs = items.some(item => 
        item.isFile() && item.name.toLowerCase().endsWith('.pdf')
      );
      
      if (hasDirectPDFs) {
        folders.push(relativePath);
      }
      
      // Recursively scan subfolders
      for (const item of items) {
        if (item.isDirectory()) {
          const subPath = path.join(currentPath, item.name);
          const subRelative = relativePath === '.' ? item.name : path.join(relativePath, item.name);
          await scan(subPath, subRelative);
        }
      }
      
    } catch (error) {
      console.error(`Error scanning ${currentPath}: ${error.message}`);
    }
  }
  
  await scan(basePath);
  return folders.sort();
}

async function main() {
  const sourceDir = process.cwd();
  const outputDir = path.join(sourceDir, OUTPUT_DIR);
  
  console.log(`PDF Merger Starting...`);
  console.log(`Source: ${sourceDir}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Minimum file size: ${formatBytes(MIN_FILE_SIZE)}\n`);
  
  try {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Scan for folders with PDFs
    console.log('Scanning for folders with PDF files...');
    const folders = await scanFolders(sourceDir);
    console.log(`Found ${folders.length} folders with PDF files\n`);
    
    let processedCount = 0;
    let successCount = 0;
    
    // Process each folder
    for (let i = 0; i < folders.length; i++) {
      const folderPath = folders[i];
      const fullFolderPath = folderPath === '.' ? sourceDir : path.join(sourceDir, folderPath);
      const outputFileName = generateFileName(folderPath, i + 1);
      const outputPath = path.join(outputDir, outputFileName);
      
      console.log(`[${i + 1}/${folders.length}] Processing: ${folderPath === '.' ? '(root)' : folderPath}`);
      console.log(`  Output: ${outputFileName}`);
      
      // Get valid PDFs from this folder only (not subfolders)
      const pdfFiles = await getValidPDFs(fullFolderPath);
      
      if (pdfFiles.length > 0) {
        const success = await mergePDFs(pdfFiles, outputPath);
        if (success) {
          successCount++;
          const stats = await fs.stat(outputPath);
          console.log(`  ✓ Success: ${formatBytes(stats.size)}\n`);
        } else {
          console.log(`  ✗ Failed to merge\n`);
        }
      } else {
        console.log(`  ⚠ No valid PDFs found (all files < ${formatBytes(MIN_FILE_SIZE)})\n`);
      }
      
      processedCount++;
    }
    
    console.log('='.repeat(60));
    console.log(`Merge Summary:`);
    console.log(`- Folders processed: ${processedCount}`);
    console.log(`- Successful merges: ${successCount}`);
    console.log(`- Output directory: ${outputDir}`);
    
    // List generated files
    const outputFiles = await fs.readdir(outputDir);
    if (outputFiles.length > 0) {
      console.log(`\nGenerated files:`);
      outputFiles.sort().forEach(file => console.log(`  - ${file}`));
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}