# Doc Consolidator

PDF documentation consolidation utilities for processing exported documentation files from platforms like Notion, Confluence, or other knowledge management systems.

## Purpose

This toolkit was created to solve common problems when working with exported documentation from knowledge management platforms:

- **Fragmented Structure**: Exported docs often come as hundreds of separate PDF files in nested folders with cryptic hash-based naming
- **Poor Organization**: Original folder structure may not be optimal for distribution or consumption
- **Noise Filtering**: Exported content includes empty pages, metadata files, and system-generated stub documents
- **Bulk Processing**: Manual consolidation of large documentation sets is time-intensive and error-prone

The utilities help transform chaotic exported documentation into clean, organized, consolidated PDF files suitable for distribution, archiving, or further processing.

## Tools

### 1. File Analyzer (`analyze-files.js`)

Recursively analyzes directory structure to provide comprehensive metrics about your documentation export.

**Features:**
- Counts files and calculates total size for each folder
- Displays hierarchical folder structure with subfolder counts
- Provides summary statistics and averages
- Handles complex nested directory structures
- Clean, tabular output format

**Usage:**
```bash
node analyze-files.js
```

**Sample Output:**
```
Complete Folder Analysis Results:
====================================================================================================
Folder Path                                                 Subfolders  Files   Size
----------------------------------------------------------------------------------------------------
(root)                                                      1           4       18.28 MB
Documentation & Knowledge Base                              14          18      70.2 MB
Documentation & Knowledge Base/Getting Started             4           7       68.04 MB
Documentation & Knowledge Base/Integrations                3           10      6.32 MB
...
```

### 2. PDF Merger (`merge-pdfs.js`)

Consolidates PDF files by folder, creating one merged document per directory while filtering out noise.

**Features:**
- **Smart Folder Processing**: Merges PDFs within each folder (not including subfolders)
- **Hash Key Removal**: Cleans folder names by removing cryptographic hashes (e.g., `Catio Academy 123456abcdef123456abcdef123456ab` → `Catio Academy`)
- **Size Filtering**: Ignores files smaller than 20KB to exclude metadata/stub files
- **Hierarchical Naming**: Creates logical, sequential filenames with parent-child relationships
- **Emoji Preservation**: Maintains special characters and emojis in folder names
- **Robust Error Handling**: Continues processing even if individual PDFs fail to merge

**Usage:**
```bash
npm install
node merge-pdfs.js
```

**Output Structure:**
```
output/
├── 01-Root.pdf
├── 02-Documentation_Knowledge_Base.pdf
├── 03-Documentation_Knowledge_Base-Getting_Started.pdf
├── 04-Getting_Started-Key_Benefits.pdf
└── ...
```

**File Naming Convention:**
- Root folder: `01-Root.pdf`
- Top-level folders: `02-Folder_Name.pdf`
- Nested folders: `03-Parent_Folder-Child_Folder.pdf`
- Sequential numbering ensures proper sorting

## Requirements

- **Node.js** 14+ 
- **npm** for dependency management
- **Exported PDF files** from documentation platforms (Notion, Confluence, etc.)

## Installation

```bash
# Clone the repository
git clone https://github.com/catio-tech/doc-consolidator.git
cd doc-consolidator

# Install dependencies
npm install
```

## Important Notes

⚠️ **This tool works specifically with exported PDF files** from documentation platforms. It expects:

- PDF files organized in nested folder structures
- Folder names potentially containing hash keys (32-character alphanumeric strings)
- Mix of content files and metadata/stub files
- Hierarchical organization that needs flattening

✅ **Tested with exports from:**
- Notion workspace exports
- Similar structured PDF documentation exports

## Configuration

### PDF Merger Settings

You can modify these constants in `merge-pdfs.js`:

```javascript
const MIN_FILE_SIZE = 20 * 1024; // 20KB minimum file size
const OUTPUT_DIR = 'output';     // Output directory name
```

## Sample Workflow

1. **Export your documentation** from Notion/Confluence as PDF files
2. **Extract the export** to a directory
3. **Analyze the structure**:
   ```bash
   node analyze-files.js
   ```
4. **Consolidate the PDFs**:
   ```bash
   node merge-pdfs.js
   ```
5. **Review the output** in the `output/` directory

## Output Examples

### Before (Exported Structure)
```
Documentation & Knowledge Base 123456abcdef123456abcdef123456ab/
├── Getting Started 789abc123def456789abc123def45678/
│   ├── What is Product def456789abc123def456789abc12345.pdf
│   ├── Key Benefits abc123def456789abc123def456789ab.pdf
│   └── Setup Guide 456789abcdef123456789abcdef12345.pdf
└── Integrations 987654fedcba987654fedcba987654fe/
    ├── AWS Setup 135792468ace135792468ace135792ac.pdf
    └── Kubernetes Setup 246810bdf357246810bdf357246810bd.pdf
```

### After (Consolidated Structure)  
```
output/
├── 01-Documentation_Knowledge_Base.pdf
├── 02-Documentation_Knowledge_Base-Getting_Started.pdf
└── 03-Documentation_Knowledge_Base-Integrations.pdf
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or feature requests, please open an issue on the [GitHub repository](https://github.com/catio-tech/doc-consolidator/issues).