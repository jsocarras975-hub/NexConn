export async function sendEmail(input:{to:string;subject:string;html:string}){
 const key=process.env.RESEND_API_KEY;const from=process.env.EMAIL_FROM;
 if(!key||!from)return {sent:false,reason:"Email provider is not configured."};
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:input.to,subject:input.subject,html:input.html})});
 if(!response.ok)return {sent:false,reason:"Email provider rejected the request."};
 return {sent:true};
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

// Retries a send up to `attempts` times with backoff. A missing provider
// config is permanent, so it is not retried. Never throws: the final result
// is returned and failures are logged by the caller.
export async function sendEmailWithRetry(
  input: { to: string; subject: string; html: string },
  attempts = 3,
): Promise<{ sent: boolean; reason?: string }> {
  if (!emailConfigured()) return { sent: false, reason: "Email provider is not configured." };
  let last: { sent: boolean; reason?: string } = { sent: false, reason: "Email send was not attempted." };
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      last = await sendEmail(input);
      if (last.sent) return last;
    } catch (error) {
      last = { sent: false, reason: error instanceof Error ? error.message : "Email send threw." };
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 1000 : 3000));
    }
  }
  return last;
}
