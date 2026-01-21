import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production.local' });

async function main() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const res = await searchconsole.sites.list();
  console.log(JSON.stringify(res.data, null, 2));
}

main();
