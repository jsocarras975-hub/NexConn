export async function sendEmail(input:{to:string;subject:string;html:string}){
 const key=process.env.RESEND_API_KEY;const from=process.env.EMAIL_FROM;
 if(!key||!from)return {sent:false,reason:"Email provider is not configured."};
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:input.to,subject:input.subject,html:input.html})});
 if(!response.ok)return {sent:false,reason:"Email provider rejected the request."};
 return {sent:true};
}
