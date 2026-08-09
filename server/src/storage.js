const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'receipts';

async function uploadReceipt(fileName, fileBuffer, contentType) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, fileBuffer, { contentType, upsert: true });
  if (error) throw error;
  return data.path;
}

async function getReceiptUrl(filePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

async function deleteReceipt(filePath) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);
  if (error) throw error;
}

module.exports = { uploadReceipt, getReceiptUrl, deleteReceipt };
