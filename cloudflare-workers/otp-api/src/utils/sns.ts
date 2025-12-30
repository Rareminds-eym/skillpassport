/**
 * AWS SNS utility for sending SMS
 */

import { Env } from '../types';

interface SnsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/**
 * Create AWS Signature Version 4 for SNS request
 */
async function createAwsSignature(
  method: string,
  host: string,
  path: string,
  queryString: string,
  headers: Record<string, string>,
  payload: string,
  config: SnsConfig,
  timestamp: string,
  dateStamp: string
): Promise<string> {
  const encoder = new TextEncoder();
  
  // Create canonical request
  const signedHeaders = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort()
    .join(';');
  
  const canonicalHeaders = Object.keys(headers)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(k => `${k.toLowerCase()}:${headers[k].trim()}`)
    .join('\n') + '\n';
  
  const payloadHash = await sha256(payload);
  
  const canonicalRequest = [
    method,
    path,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${config.region}/sns/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);
  
  const stringToSign = [
    algorithm,
    timestamp,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  // Calculate signature
  const kDate = await hmacSha256(encoder.encode(`AWS4${config.secretAccessKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, config.region);
  const kService = await hmacSha256(kRegion, 'sns');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = await hmacSha256Hex(kSigning, stringToSign);
  
  return `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

async function hmacSha256Hex(key: ArrayBuffer, message: string): Promise<string> {
  const signature = await hmacSha256(key, message);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Send SMS via AWS SNS
 */
export async function sendSms(
  phoneNumber: string,
  message: string,
  env: Env
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config: SnsConfig = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION || 'ap-south-1',
  };

  const host = `sns.${config.region}.amazonaws.com`;
  const endpoint = `https://${host}/`;
  
  // Build request parameters
  const params = new URLSearchParams({
    Action: 'Publish',
    Version: '2010-03-31',
    PhoneNumber: phoneNumber,
    Message: message,
  });
  
  // Add sender ID if configured
  if (env.SMS_SENDER_ID) {
    params.append('MessageAttributes.entry.1.Name', 'AWS.SNS.SMS.SenderID');
    params.append('MessageAttributes.entry.1.Value.DataType', 'String');
    params.append('MessageAttributes.entry.1.Value.StringValue', env.SMS_SENDER_ID);
  }
  
  // Set SMS type to Transactional for OTP
  params.append('MessageAttributes.entry.2.Name', 'AWS.SNS.SMS.SMSType');
  params.append('MessageAttributes.entry.2.Value.DataType', 'String');
  params.append('MessageAttributes.entry.2.Value.StringValue', 'Transactional');
  
  const body = params.toString();
  
  // Create timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = timestamp.slice(0, 8);
  
  // Create headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': host,
    'X-Amz-Date': timestamp,
  };
  
  // Create authorization header
  const authorization = await createAwsSignature(
    'POST',
    host,
    '/',
    '',
    headers,
    body,
    config,
    timestamp,
    dateStamp
  );
  
  headers['Authorization'] = authorization;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('SNS Error Response:', responseText);
      return { success: false, error: `SNS Error: ${response.status}` };
    }
    
    // Parse message ID from XML response
    const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
    const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
    
    return { success: true, messageId };
  } catch (error: any) {
    console.error('SNS Request Error:', error);
    return { success: false, error: error.message };
  }
}
