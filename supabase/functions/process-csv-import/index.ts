import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { supabase as admin } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessCsvRequest {
  import_id: number;
  storage_path: string; // e.g., imports/1691432334-myfile.csv
  mapping: Record<string, string>; // csvHeader -> dbField
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function updateImport(id: number, patch: Record<string, unknown>) {
  const { error } = await admin.from('csv_imports').update(patch).eq('id', id);
  if (error) throw error;
}

async function processCsv({ import_id, storage_path, mapping }: ProcessCsvRequest) {
  const startedAt = Date.now();
  let successCount = 0;
  let failCount = 0;
  const errorLog: string[] = [];

  // Download file
  const [bucket, ...rest] = storage_path.split('/');
  const path = rest.join('/');
  const { data: fileData, error: downloadError } = await admin.storage.from(bucket).download(path);
  if (downloadError) throw downloadError;
  const text = await fileData.text();

  // Parse
  const rows = parseCSV(text);
  if (!rows.length) throw new Error('empty_csv');
  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Map indexes
  const mappedIndexes: Array<{ idx: number; field: string }> = [];
  headers.forEach((h, i) => {
    const field = mapping[h];
    if (field) mappedIndexes.push({ idx: i, field });
  });

  // Batch insert
  const batchSize = 50;
  for (let i = 0; i < dataRows.length; i += batchSize) {
    const batch = dataRows.slice(i, i + batchSize);
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      try {
        const customer: Record<string, any> = {};
        for (const m of mappedIndexes) {
          const raw = (row[m.idx] ?? '').trim();
          if ([
            'marketing_email_opt_in',
            'marketing_text_opt_in',
            'transactional_text_opt_in',
          ].includes(m.field)) {
            customer[m.field] = ['true', 'yes', '1', 'y'].includes(raw.toLowerCase());
          } else if (m.field === 'birthday' && raw) {
            const d = new Date(raw);
            customer[m.field] = isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
          } else {
            customer[m.field] = raw || null;
          }
        }

        // Required fields
        if (!customer.first_name || !customer.last_name || !customer.client_email) {
          throw new Error('missing_required_fields');
        }
        if (!isValidEmail(customer.client_email)) {
          throw new Error('invalid_email');
        }

        // Duplicate check
        const { data: existing } = await admin
          .from('customers')
          .select('id')
          .eq('client_email', customer.client_email)
          .maybeSingle();
        if (existing) {
          throw new Error('duplicate_email');
        }

        // client_name convenience
        customer.client_name = `${customer.first_name} ${customer.last_name}`.trim();

        const { error: insertError } = await admin.from('customers').insert(customer);
        if (insertError) throw insertError;
        successCount++;
      } catch (e: any) {
        failCount++;
        const msg = e?.message || 'unknown_error';
        errorLog.push(`Row ${i + j + 2}: ${msg}`);
      }
    }

    await updateImport(import_id, {
      new_records: successCount,
      failed_records: failCount,
      error_details: errorLog.length ? { errors: errorLog } : null,
      processing_time_ms: Date.now() - startedAt,
      status: 'processing',
    });
  }

  await updateImport(import_id, {
    new_records: successCount,
    failed_records: failCount,
    error_details: errorLog.length ? { errors: errorLog } : null,
    processing_time_ms: Date.now() - startedAt,
    completed_at: new Date().toISOString(),
    status: 'completed',
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const payload = (await req.json()) as ProcessCsvRequest;
    if (!payload.import_id || !payload.storage_path || !payload.mapping) {
      return new Response(JSON.stringify({ error: 'missing_parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Start background task
    (self as any).waitUntil(processCsv(payload));

    return new Response(JSON.stringify({ started: true, import_id: payload.import_id }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('process-csv-import error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'unknown_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});