/* Local rules shared by the browser and Node tests. */
(function(root) {
'use strict';
function analyze(value, mode = 'url') {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return {ok:false,error:'Enter a link or message before analyzing.'};
  if (!['url','email'].includes(mode)) return {ok:false,error:'Choose link or email mode.'};
  if (text.length > 20000) return {ok:false,error:'Please use 20,000 characters or fewer.'};
  const notes = [];
  let points = 0;
  const add = (weight, message) => { points += weight; notes.push(message); };
  if (mode === 'url') {
    if (!/^https?:\/\//i.test(text) || /\s/.test(text)) return {ok:false,error:'Enter one complete HTTP or HTTPS link, such as https://example.com.'};
    let url;
    try { url = new URL(text); } catch { return {ok:false,error:'This link is malformed. Check its address and try again.'}; }
    const host = url.hostname.toLowerCase();
    const ip = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[');
    const domain = host.includes('.') && host.length <= 253 && host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
    if (!ip && !domain) return {ok:false,error:'Use a full domain name or IP address. Local and single-word hosts are not supported.'};
    if (ip) add(30,'Uses an IP address instead of a recognizable domain. This can be legitimate, but deserves inspection.');
    if (url.protocol === 'http:') add(10,'Uses HTTP without transport encryption. HTTPS alone does not prove trustworthiness.');
    if (url.username || url.password) add(25,'Contains user information before @. The actual destination host is ' + host + '.');
    if (text.length > 90) add(12,'The URL is unusually long; inspect its host separately from its path and query.');
    if (!ip && host.split('.').length > 4) add(14,'The hostname has many labels. Verify the actual registered domain independently.');
    if (/%40|%2f|%5c/i.test(text)) add(18,'Contains encoded separators. These can be legitimate but make a link harder to read.');
    if (/login|verify|secure|account|password|update/i.test(url.pathname + url.search)) add(12,'Contains account-related words in the path or query. These occur in legitimate links and phishing lures.');
    if (host.split('.').some(label => label.startsWith('xn--'))) add(18,'Uses an internationalized domain. Check for visually similar characters or unfamiliar spelling.');
  } else {
    if (/\b(urgent|immediately|today|final warning|act now)\b/i.test(text)) add(24,'Contains urgency language, which can pressure readers into acting quickly.');
    if (/\b(password|otp|one-time password|verification code)\b/i.test(text)) add(25,'Mentions authentication secrets. Check whether it asks you to disclose them; never share passwords or OTPs.');
    if (/\b(blocked|suspend(?:ed|sion)?|locked|penalty)\b/i.test(text)) add(16,'Contains account-loss or penalty language, which can be used to create fear.');
    if (/\b(click|link below|verify|confirm)\b/i.test(text)) add(12,'Contains an action or verification prompt. Check the request through an independent channel.');
    if (/\b(gift|refund|prize|winner)\b/i.test(text)) add(10,'Contains reward or refund language. Verify the offer independently.');
  }
  if (!notes.length) notes.push('No configured warning patterns matched. The destination and sender have not been verified.');
  points = Math.min(points,100);
  return {ok:true,points,level:points >= 55 ? 'high' : points >= 25 ? 'caution' : 'low',notes};
}
if (typeof module !== 'undefined' && module.exports) module.exports = {analyze};
else root.PhishShield = {analyze};
})(typeof globalThis !== 'undefined' ? globalThis : this);
