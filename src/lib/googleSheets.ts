import { google } from "googleapis";

export const getGoogleSheetsClient = async () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
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

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient as import("googleapis").Auth.GoogleAuth });

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
