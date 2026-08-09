const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'receipts';

let supabase;
function getClient() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

async function uploadReceipt(fileName, fileBuffer, contentType) {
  const { data, error } = await getClient().storage
    .from(BUCKET)
    .upload(fileName, fileBuffer, { contentType, upsert: true });
  if (error) throw error;
  return data.path;
}

async function getReceiptUrl(filePath) {
  const { data, error } = await getClient().storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

async function deleteReceipt(filePath) {
  const { error } = await getClient().storage
    .from(BUCKET)
    .remove([filePath]);
  if (error) throw error;
}

module.exports = { uploadReceipt, getReceiptUrl, deleteReceipt };
