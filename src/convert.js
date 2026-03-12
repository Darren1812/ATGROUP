import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
// 1. **REQUIRED:** Update this path to your actual Excel file location.
const excelFilePath = 'C:\\Users\\User\\Desktop\\ATP CODE\\ASN_item_data.xlsx'; 
// 2. The name of the sheet you want to convert (usually the first one).
const sheetName = 'Sheet1'; 
// 3. The output path relative to where you run this script.
const outputFilePath = path.join(__dirname, 'src', 'data', 'printerData.json'); 
// ---------------------

try {
    // 1. Read the workbook from the file path
    const workbook = XLSX.readFile(excelFilePath);

    // 2. Get the specific worksheet
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        throw new Error(`Sheet '${sheetName}' not found in the workbook.`);
    }

    // 3. Convert the worksheet data to a JSON array
    // header: 1 means the first row is used as object keys
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 4. Transform the data to use the correct header names (Column A, B, C, etc.)
    // Based on your image:
    const headers = [
        "Model", 
        "Proposed model", 
        "Monthly Recommended Print Volume", 
        "Fax Features", 
        "Staple", 
        "Booklet", 
        "Puncher/Tray" // Combined Puncher and Tray for simplicity
    ];
    
    // We start from index 1 to skip the header row itself
    const finalData = jsonData.slice(1).map(row => {
        const item = {};
        headers.forEach((header, index) => {
            // Use the header name as the key, and the cell value as the value
            item[header] = row[index] !== undefined ? String(row[index]).trim() : '';
        });
        return item;
    });

    // 5. Create the data directory if it doesn't exist
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 6. Write the JSON data to the output file
    fs.writeFileSync(outputFilePath, JSON.stringify(finalData, null, 2));

    console.log(`✅ Successfully converted Excel data to JSON.`);
    console.log(`File saved to: ${outputFilePath}`);

} catch (error) {
    console.error(`❌ Conversion failed: ${error.message}`);
}