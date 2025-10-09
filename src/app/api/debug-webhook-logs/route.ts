import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Define a log file path in the temp directory
const LOG_FILE = path.join(os.tmpdir(), 'webhook-debug.log');

export async function POST(req: NextRequest) {
  try {
    const { message, data } = await req.json();
    
    // Format the log entry
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n\n`;
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, logEntry);
    
    return NextResponse.json({
      success: true,
      message: 'Log entry added'
    });
  } catch (error) {
    console.error('Error logging webhook debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to log webhook debug' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if log file exists
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({
        success: true,
        logs: 'No logs found'
      });
    }
    
    // Read the log file
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    
    // Clear logs if requested
    const url = new URL(req.url);
    const clear = url.searchParams.get('clear');
    
    if (clear === 'true') {
      fs.writeFileSync(LOG_FILE, '');
    }
    
    return NextResponse.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error reading webhook logs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to read webhook logs' 
    }, { status: 500 });
  }
}
