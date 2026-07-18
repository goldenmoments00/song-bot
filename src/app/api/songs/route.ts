import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAME, COLUMNS } from "@/lib/googleSheets";

// Define indices based on COLUMNS array
const CATEGORY_START_INDEX = 3; // Bride Asirbad is index 3

export async function GET(request: NextRequest) {
  // Test Mode: Skip authentication check
  const searchParams = request.nextUrl.searchParams;
  const projectIdParam = searchParams.get("projectId");

  if (!projectIdParam) {
    return NextResponse.json({
      projectId: "",
      brideName: "",
      groomName: "",
      selections: {},
    });
  }

  try {
    if (!SPREADSHEET_ID) throw new Error("Missing Google Sheet ID");
    const sheets = await getGoogleSheetsClient();

    // Read all data to find the user
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`, // Fetch a wide enough range
      valueRenderOption: "FORMULA", // Fetch formulas so we can read HYPERLINKs
    });

    const rows = response.data.values || [];
    
    // Find client block by searching Order ID column (Index 0)
    let startIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowProjectId = row ? row[0] : null;
      if (rowProjectId && rowProjectId.toString().trim() === projectIdParam.trim()) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      // User not found, return empty setup
      return NextResponse.json({
        projectId: "",
        brideName: "",
        groomName: "",
        selections: {},
      });
    }

    // User found, extract 5 rows
    const clientRows = rows.slice(startIndex, startIndex + 5);
    const firstRow = clientRows[0];
    
    const projectId = firstRow[0] || "";
    const brideName = firstRow[1] || "";
    const groomName = firstRow[2] || "";
    const selections: Record<string, unknown[]> = {};

    // Parse categories
    for (let colIdx = CATEGORY_START_INDEX; colIdx < COLUMNS.length - 1; colIdx++) {
      const categoryName = COLUMNS[colIdx];
      const categorySongs = [];
      
      // Each category can have up to 5 songs (1 per row)
      for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
        const cellValue = clientRows[rowIdx]?.[colIdx];
        if (cellValue) {
          const strValue = cellValue.toString();
          
          if (strValue.startsWith("{")) {
            // Backwards compatibility for old JSON format
            try {
              categorySongs.push(JSON.parse(strValue));
            } catch (e) {
              console.warn(`Malformed JSON in row ${startIndex + rowIdx}, col ${colIdx}`);
            }
          } else if (strValue.startsWith("=HYPERLINK")) {
            // Parse new HYPERLINK format: =HYPERLINK("url", "title")
            const match = strValue.match(/=HYPERLINK\("([^"]+)", "([^"]+)"\)/);
            if (match) {
              const url = match[1];
              const title = match[2].replace(/""/g, '"'); // unescape quotes
              
              let id = "";
              if (url.includes("watch?v=")) id = url.split("watch?v=")[1].split("&")[0];
              else if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1].split("?")[0];
              
              categorySongs.push({
                id,
                title,
                channel: "Unknown Channel",
                thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                url
              });
            }
          }
        }
      }
      selections[categoryName] = categorySongs;
    }

    return NextResponse.json({
      projectId,
      brideName,
      groomName,
      selections,
    });
  } catch (error: unknown) {
    console.error("GET Songs Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Test Mode: Skip authentication check
  const body = await request.json();
  const { projectId, brideName, groomName, selections } = body;

  if (!projectId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  try {
    if (!SPREADSHEET_ID) throw new Error("Missing Google Sheet ID");
    const sheets = await getGoogleSheetsClient();

    // Read all data to find the user
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
    });

    const rows = response.data.values || [];
    
    // Ensure header exists if empty sheet
    if (rows.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:Z1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [COLUMNS] },
      });
      rows.push(COLUMNS);
    }

    // Find client block by Order ID
    let startIndex = -1;
    for (let i = 1; i < rows.length; i++) { // Check every row to be safe against manual sheet edits
      if (rows[i] && rows[i][0] && rows[i][0].toString().trim() === projectId.trim()) {
        startIndex = i;
        break;
      }
    }

    // If not found, append 5 new rows at the bottom
    if (startIndex === -1) {
      // Find the absolute last row that has any data in column A
      let lastDataRow = 0;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i] && rows[i][0]) {
          lastDataRow = i;
          break;
        }
      }
      // Start the new block immediately after the last data block
      // Each block takes 5 rows, so we snap it to the next multiple of 5 after the header
      // Header is row 1 (index 0). Block 1 is index 1-5. Block 2 is index 6-10.
      startIndex = lastDataRow + 1;
      
      // Ensure we don't overwrite anything if it's misaligned
      while ((startIndex - 1) % 5 !== 0) {
         startIndex++;
      }
    }

    // Construct the 5 rows to update
    const updateRows: string[][] = Array(5).fill(null).map(() => Array(COLUMNS.length).fill(""));
    const timestamp = new Date().toISOString();

    // Fill metadata in the first row of the block
    updateRows[0][0] = projectId || "";
    updateRows[0][1] = brideName || "";
    updateRows[0][2] = groomName || "";
    updateRows[0][COLUMNS.length - 1] = timestamp; // Last Updated

    // Fill songs
    for (let colIdx = CATEGORY_START_INDEX; colIdx < COLUMNS.length - 1; colIdx++) {
      const categoryName = COLUMNS[colIdx];
      const categorySongs = selections[categoryName] || [];
      
      for (let i = 0; i < 5; i++) {
        if (categorySongs[i]) {
          const song = categorySongs[i];
          // Escape quotes in title for the formula
          const safeTitle = song.title.replace(/"/g, '""');
          updateRows[i][colIdx] = `=HYPERLINK("${song.url}", "${safeTitle}")`;
        }
      }
    }

    // Update the sheet
    // Range is 1-indexed for sheets. If startIndex is 1 (row 2), range is A2:M6
    const startRowSheet = startIndex + 1;
    const endRowSheet = startRowSheet + 4;
    const updateRange = `${SHEET_NAME}!A${startRowSheet}:Z${endRowSheet}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: updateRows },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("POST Songs Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
