import { google } from "googleapis";

export const getGoogleSheetsClient = async () => {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  privateKey = privateKey.replace(/"/g, '').replace(/'/g, '');
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  // Guarantee the PEM format is strictly constructed
  if (privateKey.includes('BEGIN PRIVATE KEY')) {
     const body = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s+/g, '');
     privateKey = `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----\n`;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error("Missing Google Service Account credentials");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth: auth as any });

  return sheets;
};

export const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
export const SHEET_NAME = "Sheet1"; // Assuming default sheet name

// Column mapping based on requirements
export const COLUMNS = [
  "Order ID",
  "Bride Name",
  "Groom Name",
  "Bride Ashirbad",
  "Groom Ashirbad",
  "Engagement",
  "Haldi",
  "Bride Briddhi",
  "Groom Entry",
  "Wedding",
  "Reception",
  "Highlight",
  "Reel",
  "Last Updated",
];
