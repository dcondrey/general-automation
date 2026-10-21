const Transport = {
  request(url, method, body, headers, retryReads) {
    if (!/^https:\/\/(app\.asana\.com\/api\/1\.0\/|generativelanguage\.googleapis\.com\/v1beta\/models\/|hooks\.slack\.com\/services\/)/.test(url)) throw new OperatorError('This connection endpoint is not supported.');
    const opts = { method: method || 'get', muteHttpExceptions: true, headers: headers || {}, followRedirects: false };
    if (body !== undefined) Object.assign(opts, { contentType: 'application/json', payload: JSON.stringify(body) });
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try { response = UrlFetchApp.fetch(url, opts); }
      catch (_) { throw new OperatorError('The connection ended without a confirmed result. Check the destination before retrying a write.'); }
      const code = response.getResponseCode();
      if (code >= 200 && code < 300) {
        const text = response.getContentText();
        if (text.length > 2000000) throw new OperatorError('The service returned too much data. Narrow the request before trying again.');
        return text;
      }
      if (opts.method === 'get' && retryReads && attempt < 2 && (code === 429 || code >= 500)) {
        const all = response.getAllHeaders();
        const key = Object.keys(all).find(k => k.toLowerCase() === 'retry-after');
        const retry = key ? Number(all[key]) : NaN;
        const wait = Number.isFinite(retry) && retry >= 0 ? retry * 1000 : 1000 * Math.pow(2, attempt);
        if (wait > 10000) throw new OperatorError('The service is rate limited. Wait before trying again.');
        Utilities.sleep(wait);
        continue;
      }
      throw new OperatorError(code === 401 || code === 403 ? 'The service rejected this connection. Check your token and access in Connections.' : 'The service returned status ' + code + '. Check the destination before retrying a write.');
    }
  },
  json(url, method, body, headers, retryReads) {
    const text = Transport.request(url, method, body, headers, retryReads);
    try { return JSON.parse(text); } catch (_) { throw new OperatorError('The service returned an unreadable result. Check the destination before retrying.'); }
  },
};
